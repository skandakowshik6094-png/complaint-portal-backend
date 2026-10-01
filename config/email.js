const sendOTP = async (toEmail, otp) => {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'EcoComplaints <onboarding@resend.dev>',
      to: [toEmail],
      subject: 'Your Password Reset OTP - EcoComplaints',
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>EcoComplaints Password Reset</h2>
          <p>Your OTP for password reset is:</p>

          <h1>${otp}</h1>

          <p>This OTP is valid for 10 minutes.</p>
          <p>If you did not request this, please ignore this email.</p>
        </div>
      `
    })
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Resend error:', data);
    throw new Error(data.message || 'Failed to send email');
  }

  console.log('OTP email sent successfully:', data.id);
  return data;
};

module.exports = sendOTP;