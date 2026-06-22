const mongoose = require('mongoose');

const lightingSchema = new mongoose.Schema({
  timeOfDay: { type: String, enum: ['dawn', 'day', 'dusk', 'night'], default: 'day' },
  intensity: { type: Number, default: 1, min: 0, max: 3 },
  sunPosition: {
    azimuth: { type: Number, default: 45 },
    altitude: { type: Number, default: 60 },
  },
  shadows: { type: Boolean, default: true },
}, { _id: false });

const materialSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    unique: true,
  },
  walls: {
    color: { type: String, default: '#e8e0d8' },
    texture: { type: String, default: '' },
  },
  floors: {
    color: { type: String, default: '#c4b8a8' },
    texture: { type: String, default: '' },
  },
  ceiling: {
    color: { type: String, default: '#ffffff' },
    texture: { type: String, default: '' },
  },
  furniture: {
    color: { type: String, default: '#8B7355' },
    texture: { type: String, default: '' },
  },
  lighting: {
    type: lightingSchema,
    default: () => ({}),
  },
  theme: {
    type: String,
    enum: ['light', 'dark', 'warm', 'cool'],
    default: 'light',
  },
}, { timestamps: true });

module.exports = mongoose.model('Material', materialSchema);
