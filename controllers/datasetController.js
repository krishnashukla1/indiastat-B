const fs = require('fs');
const path = require('path');
const Dataset = require('../models/Dataset');
const DownloadLog = require('../models/DownloadLog');
const auth = require("../middlewares/auth");

const { parseCSVFromFile, parseXlsxFromFile, safeDeleteFile } = require('../utils/csvParser');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');


async function uploadDataset(req, res) {
  try {
    // multer puts file info in req.file
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const filePath = req.file.path;
    const originalName = req.file.originalname.toLowerCase();
    let rows = [];

    if (originalName.endsWith('.csv') || req.file.mimetype === 'text/csv') {
      rows = await parseCSVFromFile(filePath);
    } else if (originalName.endsWith('.xlsx') || originalName.endsWith('.xls')) {
      rows = parseXlsxFromFile(filePath);
    } else if (originalName.endsWith('.json') || req.file.mimetype === 'application/json') {
      const raw = fs.readFileSync(filePath, 'utf8');
      rows = JSON.parse(raw);
      if (!Array.isArray(rows)) rows = [rows];
    } else {
      // unsupported: keep file but return error
      safeDeleteFile(filePath);
      return res.status(400).json({ message: 'Unsupported file type' });
    }

    const preview = rows.slice(0, 10);
    const dataset = new Dataset({
      title: req.body.title || req.file.originalname,
      description: req.body.description || '',
      category: req.body.category || 'General',
      tags: req.body.tags ? String(req.body.tags).split(',').map(t => t.trim()) : [],
      year: req.body.year ? Number(req.body.year) : undefined,
      formats: [path.extname(originalName).replace('.','')],
      filePath: req.file.filename, // only filename; served from /uploads
      fileOriginalName: req.file.originalname,
      preview,
      recordsCount: rows.length,
      createdBy: req.user ? req.user._id : null,
      isPremium: req.body.isPremium === 'true' || req.body.isPremium === true
    });

    await dataset.save();

    res.json({ message: 'Upload successful', dataset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Upload failed' });
  }
}

async function listDatasets(req, res) {
  // supports pagination & search & filters
  const { page = 1, limit = 10, q, category, year, tags } = req.query;
  const filter = { deleted: false };

  if (category) filter.category = category;
  if (year) filter.year = Number(year);
  if (tags) filter.tags = { $in: String(tags).split(',').map(t => t.trim()) };
  if (q) filter.$text = { $search: q };

  const skip = (Number(page) - 1) * Number(limit);

  const docs = await Dataset.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .select('-preview'); // exclude preview if not needed

  const total = await Dataset.countDocuments(filter);
  res.json({ docs, total, page: Number(page), limit: Number(limit) });
}

async function getDatasetDetail(req, res) {
  const id = req.params.id;
  const ds = await Dataset.findById(id).lean();
  if (!ds || ds.deleted) return res.status(404).json({ message: 'Not found' });
  // include preview
  res.json(ds);
}

// async function downloadDataset(req, res) {
//   // Check permission: if isPremium and user not logged or not subscribed -> deny
//   const id = req.params.id;
//   const ds = await Dataset.findById(id);
//   if (!ds || ds.deleted) return res.status(404).json({ message: 'Not found' });

//   // simple permission check: allow all for now; add subscription checks here
//   // Log download
//   const log = new DownloadLog({
//     dataset: ds._id,
//     user: req.user ? req.user._id : null,
//     ip: req.ip
//   });
//   await log.save();

//   const filePath = path.join(UPLOAD_DIR, ds.filePath);
//   if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'File missing' });

//   // set headers and send file
//   res.setHeader('Content-Disposition', `attachment; filename="${ds.fileOriginalName}"`);
//   res.sendFile(filePath);
// }

async function downloadDataset(req, res) {
  try {
    const dataset = await Dataset.findById(req.params.id);
    if (!dataset) return res.status(404).json({ message: "Dataset not found" });

    const fileName = dataset.filePath; // file-1764613575280-441954559.xlsx
    const filePath = path.join(__dirname, "..", "uploads", fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File missing" });
    }

    res.download(filePath, dataset.fileOriginalName || fileName); // send original name
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Add these to your existing datasetController.js

async function updateDataset(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body; // title, description, category, tags, year, isPremium, etc.

    // Prevent updating certain fields if needed
    delete updates.filePath;
    delete updates.fileOriginalName;
    delete updates.preview;
    delete updates.recordsCount;
    delete updates.createdBy;

    const dataset = await Dataset.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

    if (!dataset || dataset.deleted) {
      return res.status(404).json({ message: 'Dataset not found' });
    }

    res.json({ message: 'Dataset updated successfully', dataset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Update failed' });
  }
}

async function deleteDataset(req, res) {
  try {
    const { id } = req.params;

    const dataset = await Dataset.findById(id);
    if (!dataset || dataset.deleted) {
      return res.status(404).json({ message: 'Dataset not found' });
    }

    // Soft delete (recommended)
    dataset.deleted = true;
    await dataset.save();

    // Optional: delete physical file
    // const filePath = path.join(UPLOAD_DIR, dataset.filePath);
    // safeDeleteFile(filePath);

    res.json({ message: 'Dataset deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Delete failed' });
  }
}

async function updateDatasetWithFile(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;

    const dataset = await Dataset.findById(id);
    if (!dataset || dataset.deleted) {
      return res.status(404).json({ message: 'Dataset not found' });
    }

    // Update text fields
    if (updates.title) dataset.title = updates.title;
    if (updates.description) dataset.description = updates.description;
    if (updates.category) dataset.category = updates.category;
    if (updates.year) dataset.year = Number(updates.year);
    if (updates.isPremium !== undefined) dataset.isPremium = updates.isPremium === 'true';

    if (updates.tags) {
      dataset.tags = updates.tags.split(',').map(t => t.trim()).filter(Boolean);
    }

    // If new file uploaded → replace everything related to file
    if (req.file) {
      const filePath = req.file.path;
      const originalName = req.file.originalname.toLowerCase();
      let rows = [];

      if (originalName.endsWith('.csv') || req.file.mimetype === 'text/csv') {
        rows = await parseCSVFromFile(filePath);
      } else if (originalName.endsWith('.xlsx') || originalName.endsWith('.xls')) {
        rows = await parseXlsxFromFile(filePath);
      } else if (originalName.endsWith('.json') || req.file.mimetype === 'application/json') {
        const raw = fs.readFileSync(filePath, 'utf8');
        rows = JSON.parse(raw);
        if (!Array.isArray(rows)) rows = [rows];
      } else {
        safeDeleteFile(filePath);
        return res.status(400).json({ message: 'Unsupported file type' });
      }

      // Optional: delete old file
      const oldFilePath = path.join(UPLOAD_DIR, dataset.filePath);
      safeDeleteFile(oldFilePath);

      // Update file-related fields
      dataset.filePath = req.file.filename;
      dataset.fileOriginalName = req.file.originalname;
      dataset.formats = [path.extname(originalName).replace('.', '')];
      dataset.preview = rows.slice(0, 10);
      dataset.recordsCount = rows.length;
    }

    await dataset.save();
    res.json({ message: 'Dataset updated successfully', dataset });
  } catch (err) {
    console.error(err);
    if (req.file) safeDeleteFile(req.file.path);
    res.status(500).json({ message: 'Update failed' });
  }
}


module.exports = { uploadDataset, listDatasets, getDatasetDetail, downloadDataset,  updateDataset,deleteDataset,updateDatasetWithFile  };
