const crypto = require('crypto');
const { env } = require('../configs/env');

function generateNumericOTP(length) {
  const digits = '0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += digits[Math.floor(Math.random() * 10)];
  }
  return code;
}

function hashOTP(code) {
  return crypto.createHash('sha256').update(String(code)).digest('hex');
}

function otpExpiryDate() {
  const ms = env.otp.expMinutes * 60 * 1000;
  return new Date(Date.now() + ms);
}

module.exports = { generateNumericOTP, hashOTP, otpExpiryDate };