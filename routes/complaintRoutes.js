const express = require('express'); 
const router = express.Router(); 
const Complaint = require('../models/Complaint'); 
const { protect } = require('../middleware/authMiddleware'); 
const upload = require('../middleware/uploadMiddleware'); 
const nodemailer = require('nodemailer'); 
 
// SUBMIT COMPLAINT (logged in user) 
router.post('/', protect, upload.single('photo'), async (req, res) => { 
  const { title, description, category, location } = req.body; 
  try { 
    const complaint = await Complaint.create({ 
      user: req.user._id, 
      title, description, category, location, 
      photo: req.file?.path || '', 
    }); 
    res.status(201).json(complaint); 
  } catch (err) { res.status(500).json({ message: err.message }); } 
}); 
 
// SUBMIT GUEST COMPLAINT (no login needed) 
router.post('/guest', upload.single('photo'), async (req, res) => { 
  const { guestName, guestPhone, title, description, category, location } = req.body; 
  try { 
    if (!guestName || !guestPhone || !title || !description || !category || !location) { 
      return res.status(400).json({ message: 'All fields are required' }); 
    } 
    const complaint = await Complaint.create({ 
      guestName, 
      guestPhone, 
      isGuest: true, 
      title, 
      description, 
      category, 
      location, 
      photo: req.file?.path || '', 
    }); 
    res.status(201).json({ message: 'Complaint submitted successfully!', complaint }); 
  } catch (err) { res.status(500).json({ message: err.message }); } 
}); 
 
// GET MY COMPLAINTS (logged in user) 
router.get('/my', protect, async (req, res) => { 
  const complaints = await Complaint.find({ user: req.user._id }) 
    .populate('assignedWorker', 'name phone department') 
    .sort({ createdAt: -1 }); 
  res.json(complaints); 
}); 
 
// RE-REPORT COMPLAINT 
router.put('/re-report/:id', protect, async (req, res) => { 
  try { 
    const complaint = await Complaint.findById(req.params.id) 
      .populate('user', 'name email'); 
 
    if (!complaint) 
      return res.status(404).json({ message: 'Complaint not found' }); 
 
    if (complaint.user._id.toString() !== req.user._id.toString()) 
      return res.status(403).json({ message: 'Not authorized' }); 
 
    if (complaint.status === 'resolved') 
      return res.status(400).json({ message: 'Complaint already resolved' }); 
 
    complaint.reReported = true; 
    complaint.reReportedAt = new Date(); 
    complaint.reReportCount = (complaint.reReportCount || 0) + 1; 
    await complaint.save(); 
 
    try { 
      const transporter = nodemailer.createTransport({ 
        host: 'smtp-relay.brevo.com', 
        port: 2525, 
        secure: false, 
        auth: { 
          user: process.env.EMAIL_USER, 
          pass: process.env.EMAIL_PASS, 
        }, 
      }); 
 
      await transporter.sendMail({ 
        from: `"EcoComplaints Portal" <ecocompliant8@gmail.com>`, 
        to: process.env.AUTHORITY_EMAIL, 
        subject: `⚠️ Re-Report Alert: "${complaint.title}" Still Unresolved!`, 
        html: ` 
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"> 
            <div style="background: #1B4332; padding: 20px; border-radius: 10px 10px 0 0;"> 
              <h2 style="color: white; margin: 0;">⚠️ Complaint Re-Reported!</h2> 
              <p style="color: #74C69D; margin: 5px 0 0 0;">EcoComplaints — Urgent Action Required</p> 
            </div> 
            <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;"> 
              <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 15px 0;"> 
                <p style="margin: 5px 0;"><strong>Title:</strong> ${complaint.title}</p> 
                <p style="margin: 5px 0;"><strong>Description:</strong> ${complaint.description}</p> 
                <p style="margin: 5px 0;"><strong>Location:</strong> ${complaint.location}</p> 
                <p style="margin: 5px 0;"><strong>Status:</strong> ${complaint.status}</p> 
                <p style="margin: 5px 0;"><strong>Citizen:</strong> ${complaint.user.name} (${complaint.user.email})</p> 
                <p style="margin: 5px 0;"><strong>Re-Reported:</strong> ${complaint.reReportCount} time(s)</p> 
              </div> 
              <p style="color: #dc2626; font-weight: bold;">🚨 Please take immediate action!</p> 
            </div> 
          </div> 
        `, 
      }); 
    } catch (emailErr) { 
      console.log('Email error:', emailErr.message); 
    } 
 
    res.json({ message: 'Re-report sent!', complaint }); 
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  } 
}); 
 
module.exports = router;