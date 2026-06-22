const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const {
  uploadBlueprint, uploadMultiple, deleteBlueprint, uploadThumbnail,
} = require('../controllers/uploadController');

router.use(protect);

router.post('/blueprint/:projectId', upload.single('file'), handleUploadError, uploadBlueprint);
router.post('/blueprints/:projectId', upload.array('files', 10), handleUploadError, uploadMultiple);
router.delete('/blueprint/:blueprintId', deleteBlueprint);
router.post('/thumbnail/:projectId', upload.single('thumbnail'), handleUploadError, uploadThumbnail);

module.exports = router;
