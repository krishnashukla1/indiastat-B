const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Dataset = require('../models/Dataset'); 

const { uploadDataset, listDatasets, getDatasetDetail, downloadDataset,updateDataset ,deleteDataset,updateDatasetWithFile} = require('../controllers/datasetController');
const authMiddleware = require('../middlewares/auth');
const role = require('../middlewares/role');
const { publicLimiter } = require('../middlewares/rateLimiter');

// multer storage config (store in uploads/, keep original extension)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname,  '..', 'uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage: storage, limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB


// Featured datasets endpoint
router.get('/featured', async (req, res) => {
  try {
    // Fetch featured datasets, e.g., latest 5 or isPremium=false
    const featured = await Dataset.find({ deleted: false })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('-preview'); // exclude preview if not needed
    res.json(featured);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch featured datasets' });
  }
});

// public listing with rate limiter
router.get('/', publicLimiter, listDatasets);

// detail
router.get('/:id', getDatasetDetail);

// download (auth optional but recommended). If you want downloads only for logged users, use authMiddleware
router.get('/:id/download', authMiddleware, downloadDataset);

// upload - only admin or analyst
router.post('/upload', authMiddleware, role(['admin','analyst']), upload.single('file'), uploadDataset);

// Update - only admin
router.patch('/:id', authMiddleware, role(['admin']), updateDataset); // or use PUT if preferred

// New route: Allow file replacement (POST or PATCH with multipart/form-data)
router.post('/:id/update-with-file', authMiddleware, role(['admin']), upload.single('file'),  updateDatasetWithFile );

// Delete - only admin
router.delete('/:id', authMiddleware, role(['admin']), deleteDataset);


module.exports = router;
