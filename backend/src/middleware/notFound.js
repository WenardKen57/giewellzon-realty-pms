module.exports = function notFound(req, res) {
  console.warn(`[404] ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: 'Not Found' });
};