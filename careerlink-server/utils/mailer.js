const nodemailer = require("nodemailer");

function getTransporter() {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;
    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = Number(process.env.SMTP_PORT || 587);

    if (!user || !pass) {
        throw new Error("Gmail SMTP is not configured");
    }

    return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        family: 4,
        connectionTimeout: 20000,
        greetingTimeout: 20000,
        socketTimeout: 30000,
        auth: { user, pass },
    });
}

async function sendOtpEmail({ to, code, purpose }) {
    const transporter = getTransporter();
    const isReset = purpose === "password_reset";
    const subject = isReset ? "CareerLink password recovery code" : "CareerLink email verification code";
    const action = isReset ? "reset your password" : "verify your email address";

    await transporter.sendMail({
        from: `"CareerLink" <${process.env.GMAIL_USER}>`,
        to,
        subject,
        text: `Your CareerLink code is ${code}. Use it to ${action}. This code expires soon.`,
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.5;">
                <h2>CareerLink verification</h2>
                <p>Use this 6-digit code to ${action}:</p>
                <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px;">${code}</p>
                <p>This code expires soon. If you did not request this, you can ignore this email.</p>
            </div>
        `,
    });
}

module.exports = { sendOtpEmail };
