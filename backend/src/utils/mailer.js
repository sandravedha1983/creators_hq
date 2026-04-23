const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendOTPEmail = async (email, otp) => {
    try {
        const { data, error } = await resend.emails.send({
            from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
            to: email,
            subject: 'Neural Access Code - CreatorsHQ',
            html: `
                <div style="background-color: #050810; color: #ffffff; padding: 40px; font-family: sans-serif; border-radius: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b;">
                    <h1 style="color: #6366f1; text-align: center; font-size: 32px; letter-spacing: -1px;">CreatorsHQ</h1>
                    <div style="height: 1px; background: linear-gradient(to right, transparent, #6366f1, transparent); margin: 20px 0;"></div>
                    <p style="text-align: center; color: #94a3b8; font-size: 16px;">Establish your neural link by entering the code below:</p>
                    <div style="background: rgba(99, 102, 241, 0.05); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 16px; padding: 30px; text-align: center; margin: 40px 0;">
                        <span style="font-size: 42px; font-weight: 800; letter-spacing: 12px; color: #ffffff; font-family: monospace;">${otp}</span>
                    </div>
                    <p style="font-size: 12px; color: #475569; text-align: center; line-height: 1.6;">
                        This code will expire in 5 minutes. <br/>
                        If you didn't request this, please ignore this email.
                    </p>
                    <div style="margin-top: 40px; text-align: center; border-top: 1px solid #1e293b; pt: 20px;">
                        <p style="font-size: 10px; color: #334155; text-transform: uppercase; letter-spacing: 2px;">Secured by CreatorsHQ Intelligence</p>
                    </div>
                </div>
            `
        });

        if (error) {
            console.error("Resend API Error:", error);
            throw new Error(error.message);
        }

        console.log(`Neural Access Code sent successfully to ${email}. ID: ${data.id}`);
        return data;
    } catch (error) {
        console.error("Critical Email Failure:", error);
        throw error;
    }
};

module.exports = { sendOTPEmail };
