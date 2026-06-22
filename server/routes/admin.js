const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');
const {
  getDashboard, getUsers, deleteUser,
  getProjects, deleteProject, getLogs,
} = require('../controllers/adminController');

router.use(protect);
router.use(adminOnly);

router.get('/dashboard', getDashboard);
router.get('/users', getUsers);
router.delete('/users/:id', deleteUser);
router.get('/projects', getProjects);
router.delete('/projects/:id', deleteProject);
router.get('/logs', getLogs);

module.exports = router;
