const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  connectionTimeout: 5000,
  greetingTimeout: 5000,
  socketTimeout: 5000
});

/**
 * Sends an OTP to the specified email.
 * @param {string} email 
 * @param {string} otp 
 */
const sendOTP = async (email, otp) => {
  await transporter.sendMail({
    from: `"CreatorsHQ" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your OTP Code",
    html: `<h2>Your OTP: ${otp}</h2>`
  });
};

module.exports = { sendOTP };
