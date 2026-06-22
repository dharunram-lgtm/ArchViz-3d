const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/auth');
const {
  getProjects, getProject, createProject,
  updateProject, deleteProject, shareProject, getSharedProject,
} = require('../controllers/projectController');

router.get('/shared/:shareLink', optionalAuth, getSharedProject);

router.use(protect);

router.get('/', getProjects);
router.post('/', createProject);
router.get('/:id', getProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);
router.post('/:id/share', shareProject);

module.exports = router;
