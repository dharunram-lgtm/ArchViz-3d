const { Material, ActivityLog } = require('../models/sqlite');

const defaultMaterials = {
  walls: { color: '#e8e0d8', texture: '' },
  floors: { color: '#c4b8a8', texture: '' },
  ceiling: { color: '#ffffff', texture: '' },
  furniture: { color: '#8B7355', texture: '' },
  lighting: {
    timeOfDay: 'day',
    intensity: 1,
    sunPosition: { azimuth: 45, altitude: 60 },
    shadows: true,
  },
  theme: 'light',
};

exports.getMaterials = async (req, res) => {
  try {
    let material = Material.findOne({ project: req.params.projectId });
    if (!material) {
      material = Material.create({ project: req.params.projectId, ...defaultMaterials });
    }
    res.json({ material });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateMaterials = async (req, res) => {
  try {
    const updates = req.body;
    let material = Material.findOne({ project: req.params.projectId });

    if (!material) {
      material = Material.create({ project: req.params.projectId, ...defaultMaterials });
    }

    Object.keys(updates).forEach((key) => {
      if (key === 'lighting') {
        material.lighting = { ...material.lighting, ...updates.lighting };
      } else if (['walls', 'floors', 'ceiling', 'furniture'].includes(key)) {
        material[key] = { ...material[key], ...updates[key] };
      } else if (key !== 'project' && key !== 'projectId') {
        material[key] = updates[key];
      }
    });

    Material.findOneAndUpdate({ project: req.params.projectId }, material);

    ActivityLog.create({
      user: req.user._id,
      action: 'material.update',
      details: { projectId: req.params.projectId, updates: Object.keys(updates) },
    });

    res.json({ material });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.resetMaterials = async (req, res) => {
  try {
    const material = Material.findOneAndUpdate(
      { project: req.params.projectId },
      { $set: defaultMaterials },
      { new: true, upsert: true }
    );

    ActivityLog.create({
      user: req.user._id,
      action: 'material.reset',
      details: { projectId: req.params.projectId },
    });

    res.json({ material });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
