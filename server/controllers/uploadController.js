const path = require('path');
const { Blueprint, Project, ActivityLog } = require('../models/sqlite');
const { deleteLocalFile } = require('../middleware/upload');

exports.uploadBlueprint = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = Project.findOne({ _id: projectId, user: req.user._id });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileExt = req.file.originalname.split('.').pop().toLowerCase();
    const fileUrl = `/uploads/${path.basename(req.file.path)}`;
    const blueprint = Blueprint.create({
      project: projectId,
      name: req.file.originalname,
      fileUrl,
      fileType: fileExt,
      layer: req.body.layer || 'structural',
      originalName: req.file.originalname,
      fileSize: req.file.size,
      metadata: {
        width: req.file.width || 0,
        height: req.file.height || 0,
      },
    });

    ActivityLog.create({
      user: req.user._id,
      action: 'blueprint.upload',
      details: { projectId, blueprintId: blueprint._id, fileName: req.file.originalname },
    });

    res.status(201).json({ blueprint });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.uploadMultiple = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = Project.findOne({ _id: projectId, user: req.user._id });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const blueprints = [];
    for (const file of req.files) {
      const fileExt = file.originalname.split('.').pop().toLowerCase();
      const fileUrl = `/uploads/${path.basename(file.path)}`;
      const blueprint = Blueprint.create({
        project: projectId,
        name: file.originalname,
        fileUrl,
        fileType: fileExt,
        layer: req.body.layer || 'structural',
        originalName: file.originalname,
        fileSize: file.size,
      });
      blueprints.push(blueprint);
    }

    res.status(201).json({ blueprints });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteBlueprint = async (req, res) => {
  try {
    const blueprint = Blueprint.findById(req.params.blueprintId);
    if (!blueprint) {
      return res.status(404).json({ message: 'Blueprint not found' });
    }

    const project = Project.findOne({ _id: blueprint.projectId, user: req.user._id });
    if (!project) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const filePath = path.join(__dirname, '..', blueprint.fileUrl.replace(/^\//, ''));
    deleteLocalFile(filePath);

    Blueprint.deleteOne({ _id: blueprint._id });

    ActivityLog.create({
      user: req.user._id,
      action: 'blueprint.delete',
      details: { projectId: project._id, blueprintId: blueprint._id },
    });

    res.json({ message: 'Blueprint deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.uploadThumbnail = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = Project.findOne({ _id: projectId, user: req.user._id });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    project.thumbnail = `/uploads/${path.basename(req.file.path)}`;
    Project.findOneAndUpdate({ _id: project._id }, project);

    res.json({ thumbnail: project.thumbnail });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
