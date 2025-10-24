const bcrypt = require('bcryptjs');

async function hashPassword(raw) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(raw, salt);
}
async function comparePassword(raw, hash) {
  return bcrypt.compare(raw, hash);
}

module.exports = { hashPassword, comparePassword };