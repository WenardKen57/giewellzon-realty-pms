const rateLimit = require('express-rate-limit');
const { env } = require('../configs/env');

const authLimiter = rateLimit({
  windowMs: env.rateLimit.authWindowMs,
  max: env.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many auth attempts, try later.' }
});

const inquiryLimiter = rateLimit({
  windowMs: env.rateLimit.inquiryWindowMs,
  max: env.rateLimit.inquiryMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many inquiries from this IP, please wait.' }
});

module.exports = { authLimiter, inquiryLimiter };