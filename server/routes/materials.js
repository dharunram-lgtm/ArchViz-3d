const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getMaterials, updateMaterials, resetMaterials } = require('../controllers/materialController');

router.use(protect);

router.get('/project/:projectId', getMaterials);
router.put('/project/:projectId', updateMaterials);
router.post('/project/:projectId/reset', resetMaterials);

module.exports = router;
