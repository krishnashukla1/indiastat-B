const mongoose = require('mongoose');

const datasetSchema = new mongoose.Schema({
  title: { type: String, required: true, text: true },
  description: { type: String },
  category: { type: String, index: true, default: 'General' },
  tags: [String],
  year: Number,
  source: String,
  formats: [String], // csv, json, xlsx
  filePath: String, // local path under uploads/
  fileOriginalName: String,
  preview: { type: Array, default: [] }, // first N rows
  recordsCount: { type: Number, default: 0 },
  isPremium: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt: { type: Date, default: Date.now },
  deleted: { type: Boolean, default: false }
});

datasetSchema.index({ title: 'text', tags: 'text', source: 'text' });

module.exports = mongoose.model('Dataset', datasetSchema);
