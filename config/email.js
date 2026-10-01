const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  family: 4,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOTP = async (toEmail, otp) => {
  await transporter.sendMail({
    from: `"EcoComplaints Portal" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Your Password Reset OTP - EcoComplaints',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #16a34a;">🌿 EcoComplaints</h2>
        </div>
        <h3 style="color: #333;">Password Reset Request</h3>
        <p style="color: #666;">You requested to reset your password. Use the OTP below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 40px; font-weight: bold; letter-spacing: 10px; color: #16a34a; background: #f0fdf4; padding: 15px 30px; border-radius: 12px; border: 2px dashed #16a34a;">
            ${otp}
          </span>
        </div>
        <p style="color: #666;">This OTP is valid for <strong>10 minutes</strong> only.</p>
        <p style="color: #999; font-size: 12px;">If you did not request this, please ignore this email.</p>
      </div>
    `,
  });
};

module.exports = sendOTP;