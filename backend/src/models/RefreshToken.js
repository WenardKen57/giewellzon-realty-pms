const mongoose = require('mongoose');

const RefreshTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  tokenHash: { type: String, required: true, index: true },
  expiresAt: { type: Date, required: true },
  revoked: { type: Boolean, default: false, index: true },
  replacedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'RefreshToken' }
}, { timestamps: true });

module.exports = mongoose.model('RefreshToken', RefreshTokenSchema);