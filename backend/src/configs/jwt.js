const jwt = require('jsonwebtoken');
const { env } = require('./env');

function signAccess(payload) {
  return jwt.sign(payload, env.jwt.accessSecret, { expiresIn: env.jwt.accessExpiresIn });
}
function signRefresh(payload) {
  return jwt.sign(payload, env.jwt.refreshSecret, { expiresIn: env.jwt.refreshExpiresIn });
}
function verifyAccess(token) {
  return jwt.verify(token, env.jwt.accessSecret);
}
function verifyRefresh(token) {
  return jwt.verify(token, env.jwt.refreshSecret);
}

module.exports = { signAccess, signRefresh, verifyAccess, verifyRefresh };