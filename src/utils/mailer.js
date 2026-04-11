const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for port 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS // Gmail App Password
    }
});

const sendOTPEmail = async (email, otp) => {
    const mailOptions = {
        from: '"CreatorsHQ" <noreply@creatorshq.ai>',
        to: email,
        subject: 'Neural Access Code - CreatorsHQ',
        html: `
            <div style="background-color: #050810; color: #ffffff; padding: 40px; font-family: sans-serif; border-radius: 20px;">
                <h1 style="color: #6366f1; text-align: center;">CreatorsHQ</h1>
                <p style="text-align: center; color: #94a3b8;">Establish your neural link by entering the code below:</p>
                <div style="background: rgba(99, 102, 241, 0.1); border: 1px solid #6366f1; border-radius: 12px; padding: 20px; text-align: center; margin: 30px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 10px; color: #ffffff;">${otp}</span>
                </div>
                <p style="font-size: 12px; color: #475569; text-align: center;">This code will expire in 10 minutes. Do not share this with anyone.</p>
            </div>
        `
    };

    try {
        console.log("Sending email to:", email);
        await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${email}`);
    } catch (error) {
        console.error("Email error:", error);
        throw error;
    }
};

module.exports = { sendOTPEmail };
