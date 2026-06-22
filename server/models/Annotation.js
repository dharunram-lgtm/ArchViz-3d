const mongoose = require('mongoose');

const annotationSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    z: { type: Number, required: true },
  },
  content: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['note', 'comment', 'pin'],
    default: 'note',
  },
  color: {
    type: String,
    default: '#ff6b35',
  },
  isResolved: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

annotationSchema.index({ project: 1, createdAt: -1 });

module.exports = mongoose.model('Annotation', annotationSchema);
