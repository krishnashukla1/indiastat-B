const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin','analyst','user','guest'], default: 'user' },
  plan: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', default: null },
  apiKey: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
