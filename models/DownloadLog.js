const mongoose = require('mongoose');

const downloadLogSchema = new mongoose.Schema({
  dataset: { type: mongoose.Schema.Types.ObjectId, ref: 'Dataset' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ip: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DownloadLog', downloadLogSchema);
