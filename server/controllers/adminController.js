const { User, Project, Blueprint, ActivityLog } = require('../models/sqlite');

exports.getDashboard = async (req, res) => {
  try {
    const totalUsers = User.countDocuments();
    const totalProjects = Project.countDocuments();
    const totalBlueprints = Blueprint.countDocuments();
    const recentUsers = User.find({ limit: 5 });
    const recentProjects = Project.find({ limit: 5, populateUser: true });

    const projectsByDay = Project.aggregate();

    const activityLogs = ActivityLog.find({ limit: 20 });

    res.json({
      stats: { totalUsers, totalProjects, totalBlueprints },
      recentUsers,
      recentProjects,
      projectsByDay,
      activityLogs,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = {};
    if (search) query.search = search;

    const users = User.find({
      ...query,
      skip: (page - 1) * Number(limit),
      limit: Number(limit),
    });

    const total = User.countDocuments(query);

    res.json({ users, total, totalPages: Math.ceil(total / limit), currentPage: Number(page) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot delete admin users' });
    }

    Project.deleteMany({ user: user._id });
    User.deleteOne({ _id: user._id });

    ActivityLog.create({
      user: req.user._id,
      action: 'admin.action',
      details: { action: 'delete_user', targetUserId: user._id, targetEmail: user.email },
    });

    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProjects = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = {};
    if (search) query.search = search;

    const projects = Project.find({
      ...query,
      skip: (page - 1) * Number(limit),
      limit: Number(limit),
      populateUser: true,
    });

    const total = Project.countDocuments(query);

    res.json({ projects, total, totalPages: Math.ceil(total / limit), currentPage: Number(page) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = Project.findOne({ _id: req.params.id });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    Blueprint.deleteMany({ project: project._id });
    Project.deleteMany({ _id: project._id });

    ActivityLog.create({
      user: req.user._id,
      action: 'admin.action',
      details: { action: 'delete_project', targetProjectId: project._id, projectName: project.name },
    });

    res.json({ message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, action } = req.query;
    const query = {};
    if (action) query.action = action;

    const logs = ActivityLog.find({
      ...query,
      skip: (page - 1) * Number(limit),
      limit: Number(limit),
    });

    const total = ActivityLog.countDocuments(query);

    res.json({ logs, total, totalPages: Math.ceil(total / limit), currentPage: Number(page) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
