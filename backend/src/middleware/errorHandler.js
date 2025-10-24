const { AppError } = require('../utils/error');

module.exports = function errorHandler(err, req, res, _next) {
  console.error('[ERROR]', err);
  if (err instanceof AppError) {
    return res.status(err.statusCode || 500).json({ message: err.message, code: err.code || undefined });
  }
  return res.status(500).json({ message: err.message || 'Internal Server Error' });
};