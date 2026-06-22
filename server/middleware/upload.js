const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/png', 'image/jpg', 'image/jpeg',
    'application/pdf',
    'image/vnd.dxf', 'application/dxf',
    'model/gltf+json', 'model/gltf-binary',
    'application/octet-stream',
  ];
  if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(dxf|scad|glb|gltf|obj)$/i)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not supported: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});

const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Max 50MB.' });
    }
    return res.status(400).json({ message: err.message });
  }
  if (err) return res.status(400).json({ message: err.message });
  next();
};

const deleteLocalFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

module.exports = { upload, handleUploadError, deleteLocalFile };