const { Annotation, ActivityLog } = require('../models/sqlite');

exports.getAnnotations = async (req, res) => {
  try {
    const annotations = Annotation.find({ project: req.params.projectId });
    res.json({ annotations });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createAnnotation = async (req, res) => {
  try {
    const { position, content, type, color } = req.body;

    if (!position || !content) {
      return res.status(400).json({ message: 'Position and content are required' });
    }

    const annotation = Annotation.create({
      project: req.params.projectId,
      user: req.user._id,
      position,
      content,
      type: type || 'note',
      color: color || '#ff6b35',
      populate: true,
    });

    ActivityLog.create({
      user: req.user._id,
      action: 'annotation.create',
      details: { projectId: req.params.projectId, annotationId: annotation._id },
    });

    res.status(201).json({ annotation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateAnnotation = async (req, res) => {
  try {
    const annotation = Annotation.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: req.body },
      { new: true }
    );

    if (!annotation) {
      return res.status(404).json({ message: 'Annotation not found' });
    }

    ActivityLog.create({
      user: req.user._id,
      action: 'annotation.update',
      details: { annotationId: annotation._id },
    });

    res.json({ annotation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteAnnotation = async (req, res) => {
  try {
    const annotation = Annotation.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!annotation) {
      return res.status(404).json({ message: 'Annotation not found' });
    }

    ActivityLog.create({
      user: req.user._id,
      action: 'annotation.delete',
      details: { annotationId: annotation._id },
    });

    res.json({ message: 'Annotation deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
