const User = require('../models/User');
const Otp = require('../models/Otp');
const RefreshToken = require('../models/RefreshToken');
const PasswordReset = require('../models/PasswordReset');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateNumericOTP, hashOTP, otpExpiryDate } = require('../utils/otp');
const { renderOtpTemplate, renderPasswordResetTemplate, renderAdminApprovalTemplate } = require('../utils/emailTemplates');
const { signAccess, signRefresh, verifyRefresh } = require('../configs/jwt');
const { safeSend } = require('../configs/mailer');
const { env } = require('../configs/env');
const { AppError } = require('../utils/error');
const crypto = require('crypto');
const dayjs = require('dayjs');

function uniformAuthError() {
  return new AppError('Invalid credentials', 401);
}

async function sendOtp(user) {
  const recent = await Otp.findOne({ userId: user._id, used: false }).sort({ createdAt: -1 });
  const resendCooldown = env.otp.resendCooldown;
  if (recent && dayjs().diff(recent.createdAt, 'second') < resendCooldown)
    throw new AppError('Please wait before requesting another OTP', 429);

  await Otp.deleteMany({ userId: user._id, used: false });

  const code = generateNumericOTP(env.otp.length);
  const codeHash = hashOTP(code);
  await Otp.create({
    userId: user._id,
    codeHash,
    expiresAt: otpExpiryDate()
  });

  const sendToAdmins = env.approvals.sendOtpToAdminOnly && env.approvals.adminEmails.length > 0;
  const toRecipients = sendToAdmins ? env.approvals.adminEmails : [user.email];

  const html = sendToAdmins
    ? renderAdminApprovalTemplate({
        email: user.email,
        username: user.username,
        code,
        minutes: env.otp.expMinutes,
        baseUrl: env.baseUrl
      })
    : renderOtpTemplate(code, env.otp.expMinutes);

  const subject = sendToAdmins ? 'New Admin Registration Approval' : 'Verify your email';

  await safeSend({ to: toRecipients, subject, html });
}

async function register(req, res, next) {
  try {
    const { username, email, password, fullName } = req.body;

    if (!email || !username || !password) {
      return next(new AppError('username, email and password are required', 400));
    }

    // Leave ALLOWED_ADMIN_EMAILS empty in .env to allow any email to register.
    const allowedEmails = (process.env.ALLOWED_ADMIN_EMAILS || '')
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);
    if (allowedEmails.length > 0 && !allowedEmails.includes(String(email).toLowerCase())) {
      return next(new AppError('Registration not allowed for this email', 403));
    }

    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) return next(new AppError('User already exists', 409));

    const passwordHash = await hashPassword(password);
    const user = await User.create({ username, email, passwordHash, fullName, role: 'admin' });

    // Try OTP send; do not fail registration if mailer fails
    try {
      await sendOtp(user);
      const msg = env.approvals.sendOtpToAdminOnly
        ? 'Registered. Awaiting admin approval.'
        : 'Registered. OTP sent.';
      return res.status(201).json({ message: msg, email: user.email });
    } catch (otpErr) {
      console.warn('[OTP] send failed after registration:', otpErr.message);
      return res.status(201).json({
        message: env.approvals.sendOtpToAdminOnly
          ? 'Registered. Admin approval pending (email send failed; try resend).'
          : 'Registered. OTP could not be sent right now. Use "Resend OTP".',
        email: user.email
      });
    }
  } catch (e) { next(e); }
}

async function resendOtp(req, res, next) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.json({ message: 'If account exists, OTP resent' });
    if (user.emailVerified) return res.json({ message: 'Email already verified' });
    await sendOtp(user);
    res.json({ message: env.approvals.sendOtpToAdminOnly ? 'Approval OTP resent to admin' : 'OTP resent' });
  } catch (e) { next(e); }
}

async function verifyEmail(req, res, next) {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) throw uniformAuthError();
    if (user.emailVerified) return res.json({ message: 'Already verified' });

    const otpDoc = await Otp.findOne({ userId: user._id, used: false }).sort({ createdAt: -1 });
    if (!otpDoc) throw new AppError('OTP not found', 400);
    if (otpDoc.expiresAt < new Date()) throw new AppError('OTP expired', 400);

    if (otpDoc.attempts >= env.otp.maxAttempts) {
      otpDoc.used = true;
      await otpDoc.save();
      throw new AppError('Too many attempts. Request new OTP.', 429);
    }

    const hashed = hashOTP(otp);
    if (hashed !== otpDoc.codeHash) {
      otpDoc.attempts += 1;
      await otpDoc.save();
      throw new AppError('Invalid OTP', 400);
    }

    otpDoc.used = true;
    await otpDoc.save();
    user.emailVerified = true;
    await user.save();
    res.json({ message: 'Email verified' });
  } catch (e) { next(e); }
}

async function login(req, res, next) {
  try {
    const { emailOrUsername, password } = req.body;
    const user = await User.findOne({
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }]
    });

    if (!user) throw uniformAuthError();
    if (!user.isActive) throw new AppError('Account disabled', 403);

    const sec = user.loginSecurity || {};
    if (sec.lockedUntil && sec.lockedUntil > new Date()) {
      return next(new AppError('Account temporarily locked. Try later.', 423));
    }

    const ok = await comparePassword(password, user.passwordHash);
    if (!ok) {
      sec.count = (sec.count || 0) + 1;
      sec.lastAttempt = new Date();
      if (sec.count >= 5) {
        sec.lockedUntil = dayjs().add(10, 'minute').toDate();
        sec.count = 0;
      }
      user.loginSecurity = sec;
      await user.save();
      throw uniformAuthError();
    }

    user.loginSecurity = { count: 0, lastAttempt: new Date(), lockedUntil: null };
    if (!user.emailVerified) throw new AppError('Email not verified', 403);
    user.lastLogin = new Date();
    await user.save();

    const payload = { sub: user._id.toString(), email: user.email, role: user.role, username: user.username, fullName: user.fullName };
    const accessToken = signAccess(payload);
    const refreshToken = signRefresh(payload);

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = dayjs().add(7, 'day').toDate();

    await RefreshToken.create({ userId: user._id, tokenHash, expiresAt });

    res.json({
      accessToken,
      refreshToken,
      user: { id: user._id, email: user.email, username: user.username, fullName: user.fullName, role: user.role }
    });

  } catch (e) { next(e); }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new AppError('Missing refreshToken', 400);
    let decoded;
    try {
      decoded = verifyRefresh(refreshToken);
    } catch {
      throw new AppError('Invalid refresh token', 401);
    }

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const existing = await RefreshToken.findOne({ tokenHash, userId: decoded.sub, revoked: false });
    if (!existing) throw new AppError('Refresh token revoked or invalid', 401);
    if (existing.expiresAt < new Date()) {
      existing.revoked = true;
      await existing.save();
      throw new AppError('Refresh token expired', 401);
    }

    existing.revoked = true;
    await existing.save();

    const payload = { sub: decoded.sub, email: decoded.email, role: decoded.role, username: decoded.username, fullName: decoded.fullName };
    const newAccess = signAccess(payload);
    const newRefresh = signRefresh(payload);

    const newHash = crypto.createHash('sha256').update(newRefresh).digest('hex');
    const expiresAt = dayjs().add(7, 'day').toDate();
    const replacement = await RefreshToken.create({ userId: decoded.sub, tokenHash: newHash, expiresAt });
    existing.replacedBy = replacement._id;
    await existing.save();

    res.json({ accessToken: newAccess, refreshToken: newRefresh });
  } catch (e) { next(e); }
}

async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      const doc = await RefreshToken.findOne({ tokenHash });
      if (doc) {
        doc.revoked = true;
        await doc.save();
      }
    }
    res.json({ message: 'Logged out' });
  } catch (e) { next(e); }
}

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.json({ message: 'If email exists a reset link was sent' });
    const raw = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(raw).digest('hex');
    const expiresAt = dayjs().add(env.passwordReset.expMinutes, 'minute').toDate();
    await PasswordReset.create({ userId: user._id, tokenHash, expiresAt });
    const link = `${env.baseUrl}/admin/reset-password?token=${raw}&email=${encodeURIComponent(email)}`;
    await safeSend({
      to: email,
      subject: 'Password Reset',
      html: renderPasswordResetTemplate(link)
    });
    res.json({ message: 'If email exists a reset link was sent' });
  } catch (e) { next(e); }
}

async function resetPassword(req, res, next) {
  try {
    const { email, token, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user) throw new AppError('Invalid reset request', 400);
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const resetDoc = await PasswordReset.findOne({ userId: user._id, tokenHash, used: false });
    if (!resetDoc || resetDoc.expiresAt < new Date()) throw new AppError('Invalid or expired token', 400);
    user.passwordHash = await hashPassword(newPassword);
    await user.save();
    resetDoc.used = true;
    await resetDoc.save();
    res.json({ message: 'Password updated' });
  } catch (e) { next(e); }
}

module.exports = {
  register,
  resendOtp,
  verifyEmail,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword
};