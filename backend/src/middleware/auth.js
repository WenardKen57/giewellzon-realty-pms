const { verifyAccess } = require('../configs/jwt');
const RefreshToken = require('../models/RefreshToken');
const { AppError } = require('../utils/error');

async function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer '))
    return res.status(401).json({ message: 'Unauthorized' });
  const token = auth.split(' ')[1];
  try {
    const payload = verifyAccess(token);
    req.user = payload;
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  next();
}

// Optional refresh token reuse check (passed userId & hashed token)
async function ensureRefreshStillValid(userId, hashedToken) {
  const doc = await RefreshToken.findOne({ userId, tokenHash: hashedToken, revoked: false });
  if (!doc) throw new AppError('Refresh token invalid', 401);
  return doc;
}

module.exports = { requireAuth, requireAdmin, ensureRefreshStillValid };