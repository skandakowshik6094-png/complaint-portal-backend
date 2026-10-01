const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const Worker = require('../models/Worker');
const { protect, authorityOnly } = require('../middleware/authMiddleware');
const nodemailer = require('nodemailer');

// Helper: send email to worker
const sendWorkerEmail = async (worker, complaint, deadline) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const deadlineStr = new Date(deadline).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: worker.email,
      subject: `🔔 New Work Assigned to You: ${complaint.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1B4332; padding: 25px 20px; border-radius: 10px 10px 0 0;">
            <h2 style="color: white; margin: 0; font-size: 22px;">🔔 New Work Assigned!</h2>
            <p style="color: #74C69D; margin: 6px 0 0 0; font-size: 14px;">
              EcoComplaints — Work Assignment Notice
            </p>
          </div>

          <div style="background: #f8f9fa; padding: 25px 20px; border: 1px solid #e9ecef; border-top: none; border-radius: 0 0 10px 10px;">

            <p style="color: #333; font-size: 16px; margin-top: 0;">
              Hello <strong>${worker.name}</strong>,
            </p>
            <p style="color: #555; font-size: 15px;">
              You have been assigned a new environment complaint. Please review the details below and resolve it before the deadline.
            </p>

            <!-- Complaint Details -->
            <div style="background: white; padding: 18px; border-radius: 10px; border-left: 4px solid #1B4332; margin: 20px 0;">
              <h3 style="margin: 0 0 12px 0; color: #1B4332; font-size: 16px;">📋 Complaint Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; color: #888; font-size: 13px; width: 35%;">Title</td>
                  <td style="padding: 6px 0; color: #333; font-size: 13px; font-weight: bold;">${complaint.title}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #888; font-size: 13px;">Description</td>
                  <td style="padding: 6px 0; color: #333; font-size: 13px;">${complaint.description}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #888; font-size: 13px;">Category</td>
                  <td style="padding: 6px 0; color: #333; font-size: 13px; text-transform: capitalize;">${complaint.category}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #888; font-size: 13px;">📍 Location</td>
                  <td style="padding: 6px 0; color: #333; font-size: 13px;">${complaint.location}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #888; font-size: 13px;">👤 Citizen</td>
                  <td style="padding: 6px 0; color: #333; font-size: 13px;">
                    ${complaint.isGuest
                      ? `${complaint.guestName} (Guest) — 📞 ${complaint.guestPhone}`
                      : `${complaint.user?.name || 'N/A'} — 📞 ${complaint.user?.phone || 'N/A'}`
                    }
                  </td>
                </tr>
              </table>
            </div>

            <!-- Deadline Box -->
            <div style="background: #fff8e1; padding: 18px; border-radius: 10px; border-left: 4px solid #f59e0b; margin: 20px 0; text-align: center;">
              <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: bold;">⏰ DEADLINE TO COMPLETE</p>
              <p style="margin: 8px 0 0 0; color: #78350f; font-size: 22px; font-weight: bold;">
                ${deadlineStr}
              </p>
              <p style="margin: 8px 0 0 0; color: #92400e; font-size: 13px;">
                Please complete this work before the deadline!
              </p>
            </div>

            <!-- Worker Info -->
            <div style="background: #e8f4fd; padding: 15px; border-radius: 10px; margin: 20px 0;">
              <p style="margin: 0; color: #1e40af; font-size: 13px;">
                <strong>Your Department:</strong> ${worker.department}
              </p>
            </div>

            <p style="color: #555; font-size: 14px;">
              Please visit the location as soon as possible and update the status once resolved.
            </p>

            <p style="color: #555; font-size: 14px;">
              Thank you for your service! 🌿
            </p>

            <div style="border-top: 1px solid #e9ecef; margin-top: 20px; padding-top: 15px;">
              <p style="color: #aaa; font-size: 12px; margin: 0; text-align: center;">
                EcoComplaints — Smart Environment Complaint Management System
              </p>
            </div>
          </div>
        </div>
      `,
    });

    console.log('✅ Email sent to worker:', worker.email);
    return true;
  } catch (err) {
    console.log('❌ Worker email error:', err.message);
    return false;
  }
};

// GET ALL COMPLAINTS
router.get('/complaints', protect, authorityOnly, async (req, res) => {
  const complaints = await Complaint.find({})
    .populate('user', 'name email phone')
    .populate('assignedWorker', 'name phone email department')
    .sort({ createdAt: -1 });
  res.json(complaints);
});

// ASSIGN WORKER WITH DEADLINE + EMAIL
router.put('/assign/:id', protect, authorityOnly, async (req, res) => {
  const { workerId, deadline } = req.body;
  try {
    const worker = await Worker.findById(workerId);
    if (!worker) return res.status(404).json({ message: 'Worker not found' });

    const complaintDeadline = deadline
      ? new Date(deadline)
      : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      {
        assignedWorker: workerId,
        status: 'in-progress',
        deadline: complaintDeadline,
      },
      { new: true }
    )
      .populate('user', 'name email phone')
      .populate('assignedWorker', 'name phone email department');

    // Send email if worker has email
    let emailSent = false;
    if (worker.email) {
      emailSent = await sendWorkerEmail(worker, complaint, complaintDeadline);
    }

    res.json({
      complaint,
      emailSent,
      message: emailSent
        ? `Worker assigned and email sent to ${worker.email}!`
        : worker.email
        ? 'Worker assigned but email failed!'
        : 'Worker assigned! (No email on file)',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE STATUS
router.put('/status/:id', protect, authorityOnly, async (req, res) => {
  const complaint = await Complaint.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status, workerNote: req.body.workerNote },
    { new: true }
  );
  res.json(complaint);
});

// GET ALL WORKERS
router.get('/workers', protect, authorityOnly, async (req, res) => {
  const workers = await Worker.find({});
  res.json(workers);
});

// ADD WORKER
router.post('/workers', protect, authorityOnly, async (req, res) => {
  const worker = await Worker.create(req.body);
  res.status(201).json(worker);
});

// DELETE WORKER
router.delete('/workers/:id', protect, authorityOnly, async (req, res) => {
  await Worker.findByIdAndDelete(req.params.id);
  res.json({ message: 'Worker deleted' });
});

module.exports = router;