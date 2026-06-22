const { Project, Blueprint, Annotation, Material, ActivityLog, User } = require('../models/sqlite');
const { v4: uuidv4 } = require('uuid');

exports.getProjects = async (req, res) => {
  try {
    const { search, sort, page = 1, limit = 12 } = req.query;
    const query = { user: req.user._id };
    if (search) query.search = search;

    const projects = Project.find({
      ...query,
      sort,
      skip: (page - 1) * Number(limit),
      limit: Number(limit),
    });

    const total = Project.countDocuments(query);

    res.json({
      projects,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProject = async (req, res) => {
  try {
    const project = Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.userId !== req.user._id && !project.sharing.isPublic) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    project.user = User.findById(project.userId);

    const annotations = Annotation.find({ project: project._id });
    const material = Material.findOne({ project: project._id });

    ActivityLog.create({
      user: req.user._id,
      action: 'project.view',
      details: { projectId: project._id, projectName: project.name },
    });

    res.json({ project, annotations, material });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createProject = async (req, res) => {
  try {
    const { name, description, tags } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Project name is required' });
    }

    const project = Project.create({
      user: req.user._id,
      name,
      description: description || '',
      tags: tags || [],
    });

    Material.create({ project: project._id });

    ActivityLog.create({
      user: req.user._id,
      action: 'project.create',
      details: { projectId: project._id, projectName: project.name },
    });

    res.status(201).json({ project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const { name, description, layers, dimensions, sharing, tags } = req.body;
    const project = Project.findOne({ _id: req.params.id, user: req.user._id });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (layers) project.layers = { ...project.layers, ...layers };
    if (dimensions) project.dimensions = dimensions;
    if (tags) project.tags = tags;

    if (sharing) {
      if (sharing.isPublic && !project.sharing.shareLink) {
        project.sharing.shareLink = uuidv4();
      }
      project.sharing = { ...project.sharing, ...sharing };
    }

    const { blueprints: _, user: __, ...cleanProject } = project;
    cleanProject._id = project._id;
    Project.findOneAndUpdate({ _id: project._id }, cleanProject);

    ActivityLog.create({
      user: req.user._id,
      action: 'project.update',
      details: { projectId: project._id },
    });

    res.json({ project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = Project.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    Blueprint.deleteMany({ project: project._id });
    Annotation.deleteMany({ project: project._id });
    Material.deleteOne({ project: project._id });

    ActivityLog.create({
      user: req.user._id,
      action: 'project.delete',
      details: { projectId: project._id, projectName: project.name },
    });

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.shareProject = async (req, res) => {
  try {
    const project = Project.findOne({ _id: req.params.id, user: req.user._id });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const shareLink = uuidv4();
    project.sharing = { isPublic: true, shareLink };
    const { blueprints: _, user: __, ...cleanProject } = project;
    cleanProject._id = project._id;
    Project.findOneAndUpdate({ _id: project._id }, cleanProject);

    ActivityLog.create({
      user: req.user._id,
      action: 'project.share',
      details: { projectId: project._id, shareLink },
    });

    res.json({ shareLink: `${process.env.CLIENT_URL}/shared/${shareLink}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSharedProject = async (req, res) => {
  try {
    const project = Project.findOne({ 'sharing.shareLink': req.params.shareLink });

    if (!project || !project.sharing.isPublic) {
      return res.status(404).json({ message: 'Project not found or not shared' });
    }

    const annotations = Annotation.find({ project: project._id });
    const material = Material.findOne({ project: project._id });
    project.user = User.findById(project.userId);

    if (req.user) {
      ActivityLog.create({
        user: req.user._id,
        action: 'project.view',
        details: { projectId: project._id, projectName: project.name, shared: true },
      });
    }

    res.json({ project, annotations, material });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
