const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  action: {
    type: String,
    required: true,
    enum: [
      'project.create', 'project.update', 'project.delete',
      'project.view', 'project.share',
      'blueprint.upload', 'blueprint.delete',
      'annotation.create', 'annotation.update', 'annotation.delete',
      'material.update', 'material.reset',
      'user.login', 'user.register', 'user.logout',
      'admin.action',
    ],
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  ip: String,
  userAgent: String,
}, { timestamps: true });

activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
