const mongoose = require('mongoose');

const InviteSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  survey: { type: mongoose.Schema.Types.ObjectId, ref: 'Survey', required: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uses: { type: Number, default: 0 },
  maxUses: { type: Number, default: 1 },
  expiresAt: Date,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Invite', InviteSchema);
