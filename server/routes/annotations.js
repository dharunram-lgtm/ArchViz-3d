const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getAnnotations, createAnnotation, updateAnnotation, deleteAnnotation,
} = require('../controllers/annotationController');

router.use(protect);

router.get('/project/:projectId', getAnnotations);
router.post('/project/:projectId', createAnnotation);
router.put('/:id', updateAnnotation);
router.delete('/:id', deleteAnnotation);

module.exports = router;
