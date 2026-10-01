const express = require('express');
console.log('PASSWORD ROUTES LOADED');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const sendOTP = require('../config/email');

// STEP 1: Send OTP to email
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No account found with this email' });

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.resetOTP = otp;
    user.resetOTPExpiry = expiry;
    await user.save();

    await sendOTP(email, otp);

    res.json({ message: 'OTP sent to your email successfully!' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send OTP: ' + err.message });
  }
});

// STEP 2: Verify OTP
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.resetOTP || user.resetOTP !== otp)
      return res.status(400).json({ message: 'Invalid OTP' });
    if (user.resetOTPExpiry < new Date())
      return res.status(400).json({ message: 'OTP has expired. Please request again.' });

    res.json({ message: 'OTP verified successfully!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// STEP 3: Reset Password
router.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.resetOTP || user.resetOTP !== otp)
      return res.status(400).json({ message: 'Invalid OTP' });
    if (user.resetOTPExpiry < new Date())
      return res.status(400).json({ message: 'OTP expired. Please request again.' });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetOTP = undefined;
    user.resetOTPExpiry = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;