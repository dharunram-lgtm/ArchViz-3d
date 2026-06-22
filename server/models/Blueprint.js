const mongoose = require('mongoose');

const wallSchema = new mongoose.Schema({
  start: { x: Number, y: Number, z: Number },
  end: { x: Number, y: Number, z: Number },
  height: Number,
  thickness: Number,
  color: { type: String, default: '#e0e0e0' },
}, { _id: false });

const roomSchema = new mongoose.Schema({
  name: String,
  points: [{ x: Number, z: Number }],
  area: Number,
  color: { type: String, default: '#f5f5f5' },
}, { _id: false });

const doorSchema = new mongoose.Schema({
  position: { x: Number, y: Number, z: Number },
  width: Number,
  height: Number,
  rotation: Number,
}, { _id: false });

const windowSchema = new mongoose.Schema({
  position: { x: Number, y: Number, z: Number },
  width: Number,
  height: Number,
  sillHeight: Number,
  rotation: Number,
}, { _id: false });

const blueprintSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
    enum: ['png', 'jpg', 'jpeg', 'pdf', 'dxf', 'scad', 'obj', 'glb', 'gltf'],
    required: true,
  },
  layer: {
    type: String,
    enum: ['structural', 'furniture', 'electrical', 'plumbing', 'ceiling'],
    default: 'structural',
  },
  originalName: String,
  fileSize: Number,
  extractedData: {
    walls: [wallSchema],
    rooms: [roomSchema],
    doors: [doorSchema],
    windows: [windowSchema],
    scale: { type: Number, default: 1 },
  },
  metadata: {
    width: Number,
    height: Number,
    resolution: Number,
  },
}, { timestamps: true });

module.exports = mongoose.model('Blueprint', blueprintSchema);
