const mongoose = require('mongoose');

mongoose.set('strictQuery', true);

function maskUri(uri = '') {
  return uri.replace(/(mongodb(\+srv)?:\/\/)([^:@/]+):([^@]+)@/i, (_, p1, _srv, user) => `${p1}${user}:***@`);
}

async function connect() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is required');

  console.log('[DB] Connecting to', maskUri(uri));
  const conn = await mongoose.connect(uri, {
    autoIndex: true,
    maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL || '10', 10),
    serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SRV_TIMEOUT || '10000', 10),
  });
  console.log('[DB] Connected:', conn.connection.name);
  return conn;
}

module.exports = connect;
module.exports.connect = connect;