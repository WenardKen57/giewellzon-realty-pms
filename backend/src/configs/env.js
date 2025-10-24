const env = {
  baseUrl: process.env.BASE_URL || 'http://localhost:5173',
  otp: {
    length: parseInt(process.env.OTP_LENGTH || '6', 10),
    expMinutes: parseInt(process.env.OTP_EXP_MINUTES || '10', 10),
    resendCooldown: parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS || '60', 10),
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10),
  },
  passwordReset: {
    expMinutes: parseInt(process.env.PASSWORD_RESET_EXP_MINUTES || '30', 10),
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
  },
  approvals: {
    adminEmails: (process.env.APPROVER_EMAILS || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean),
    sendOtpToAdminOnly: String(process.env.SEND_OTP_TO_ADMIN_ONLY || '').toLowerCase() === 'true',
  }
};

module.exports = { env };