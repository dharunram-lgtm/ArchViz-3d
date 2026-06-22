const mongoose = require('mongoose');

const layerSchema = new mongoose.Schema({
  structural: { type: Boolean, default: true },
  furniture: { type: Boolean, default: false },
  electrical: { type: Boolean, default: false },
  plumbing: { type: Boolean, default: false },
  ceiling: { type: Boolean, default: false },
}, { _id: false });

const dimensionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['distance', 'area', 'wall_length'],
  },
  label: String,
  value: Number,
  unit: { type: String, default: 'm' },
  startPosition: {
    x: Number, y: Number, z: Number,
  },
  endPosition: {
    x: Number, y: Number, z: Number,
  },
}, { _id: false });

const sharingSchema = new mongoose.Schema({
  isPublic: { type: Boolean, default: false },
  shareLink: { type: String, default: '' },
}, { _id: false });

const projectSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  thumbnail: {
    type: String,
    default: '',
  },
  blueprints: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blueprint',
  }],
  layers: {
    type: layerSchema,
    default: () => ({}),
  },
  dimensions: [dimensionSchema],
  sharing: {
    type: sharingSchema,
    default: () => ({}),
  },
  tags: [String],
}, { timestamps: true });

projectSchema.index({ user: 1, createdAt: -1 });
projectSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Project', projectSchema);
