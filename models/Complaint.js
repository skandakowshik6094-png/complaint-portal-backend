const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  user:           { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  guestName:      { type: String },
  guestPhone:     { type: String },
  isGuest:        { type: Boolean, default: false },
  title:          { type: String, required: true },
  description:    { type: String, required: true },
  category:       { type: String, enum: ['garbage', 'pollution', 'water', 'noise', 'other'], required: true },
  location:       { type: String, required: true },
  photo:          { type: String },
  status:         { type: String, enum: ['pending', 'in-progress', 'resolved'], default: 'pending' },
  assignedWorker: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' },
  workerNote:     { type: String },
  deadline:       { type: Date },
  reReported:     { type: Boolean, default: false },
  reReportedAt:   { type: Date },
  reReportCount:  { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);
