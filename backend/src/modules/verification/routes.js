const express = require('express');
const multer = require('multer');
const controllers = require('./controllers');
const { authenticate, authorize } = require('../../middleware/auth');
const { ALLOWED_CONTENT_TYPES, MAX_FILE_SIZE, MAX_FILES } = require('./screening');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES, fields: 1, fieldSize: 64 * 1024 },
  fileFilter: (req, file, callback) => {
    if (!ALLOWED_CONTENT_TYPES.has(file.mimetype)) {
      const error = new Error('Documents must be PDF, JPEG, or PNG files.');
      error.status = 400;
      return callback(error);
    }
    return callback(null, true);
  }
});
const uploadDocuments = (req, res, next) => {
  upload.array('documents', MAX_FILES)(req, res, error => {
    if (error instanceof multer.MulterError) {
      error.status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    }
    return next(error);
  });
};

router.use(authenticate);
router.get('/status', controllers.getStatus);
router.post('/submit', uploadDocuments, controllers.submitRequest);
router.get('/admin/summary', authorize('admin'), controllers.getAdminSummary);
router.get('/admin/requests', authorize('admin'), controllers.listAdminRequests);
router.get('/admin/requests/:id', authorize('admin'), controllers.getAdminRequest);
router.delete('/admin/requests/:id/documents/:documentId', authorize('admin'), controllers.deleteAdminDocument);
router.patch('/admin/requests/:id/decision', authorize('admin'), controllers.decideAdminRequest);

module.exports = router;
