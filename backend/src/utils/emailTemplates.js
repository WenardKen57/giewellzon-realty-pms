function renderOtpTemplate(code, minutes) {
  return `
  <div style="font-family: Arial, sans-serif; line-height:1.5">
    <h2>Verify your email</h2>
    <p>Use the One-Time Password (OTP) below to verify your email address.</p>
    <p style="font-size:24px; letter-spacing:3px;"><strong>${code}</strong></p>
    <p>This code expires in ${minutes} minutes.</p>
  </div>`;
}

function renderPasswordResetTemplate(link) {
  return `
  <div style="font-family: Arial, sans-serif; line-height:1.5">
    <h2>Password reset</h2>
    <p>Click the button below to reset your password:</p>
    <p><a href="${link}" style="background:#046A38;color:#fff;padding:10px 16px;text-decoration:none;border-radius:6px">Reset Password</a></p>
    <p>If you didn’t request this, you can safely ignore this email.</p>
  </div>`;
}

/**
 * Admin receives OTP to approve a new account.
 * email: registrant email, username: registrant username, code: OTP code
 */
function renderAdminApprovalTemplate({ email, username, code, minutes, baseUrl }) {
  const link = `${baseUrl}/verify-email?email=${encodeURIComponent(email)}`;
  return `
  <div style="font-family: Arial, sans-serif; line-height:1.5">
    <h2>New Admin Registration Approval</h2>
    <p>A new account registration needs approval.</p>
    <ul>
      <li><strong>Email:</strong> ${email}</li>
      <li><strong>Username:</strong> ${username || '—'}</li>
    </ul>
    <p>Use this OTP code to approve:</p>
    <p style="font-size:24px; letter-spacing:3px;"><strong>${code}</strong></p>
    <p>This code expires in ${minutes} minutes.</p>
    <p>You can open the approval page here (email pre-filled):</p>
    <p><a href="${link}" style="background:#0C4E26;color:#fff;padding:10px 16px;text-decoration:none;border-radius:6px">Open Approval Page</a></p>
    <p>After approval, the user will be able to sign in.</p>
  </div>`;
}

module.exports = { renderOtpTemplate, renderPasswordResetTemplate, renderAdminApprovalTemplate };