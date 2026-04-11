const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const controllers = require('./controllers');
const { authenticate } = require('../../middleware/auth'); // Assuming auth middleware exists

const router = express.Router();

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/verification';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });

router.use(authenticate);

router.post('/submit', upload.single('screenshot'), controllers.submitVerification);
router.get('/status', controllers.getStatus);
router.patch('/:id', controllers.updateStatus);

module.exports = router;
