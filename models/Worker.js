const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  phone:      { type: String, required: true },
  email:      { type: String },
  department: { type: String, required: true },
  available:  { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Worker', workerSchema);