const nodemailer = require("nodemailer");

function buildEmail({ code, purpose }) {
    const isReset = purpose === "password_reset";
    const subject = isReset ? "CareerLink password recovery code" : "CareerLink email verification code";
    const action = isReset ? "reset your password" : "verify your email address";

    return {
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
    };
}

async function sendWithResend({ to, code, purpose }) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return false;

    const email = buildEmail({ code, purpose });
    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from: process.env.RESEND_FROM || "CareerLink <onboarding@resend.dev>",
            to,
            subject: email.subject,
            text: email.text,
            html: email.html,
        }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.message || "Resend email failed");
    }

    console.log("OTP email sent through Resend");
    return true;
}

function getTransporter({ port }) {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;
    const host = process.env.SMTP_HOST || "smtp.gmail.com";

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
    const sentWithResend = await sendWithResend({ to, code, purpose });
    if (sentWithResend) return;

    const email = buildEmail({ code, purpose });
    const preferredPort = Number(process.env.SMTP_PORT || 587);
    const ports = [...new Set([preferredPort, 465, 587])];
    let lastError;

    for (const port of ports) {
        try {
            const transporter = getTransporter({ port });
            await transporter.sendMail({
                from: `"CareerLink" <${process.env.GMAIL_USER}>`,
                to,
                subject: email.subject,
                text: email.text,
                html: email.html,
            });
            console.log(`OTP email sent through Gmail SMTP port ${port}`);
            return;
        } catch (error) {
            lastError = error;
            console.log(`Gmail SMTP port ${port} failed: ${error.code || error.message}`);
        }
    }

    throw lastError;
}

module.exports = { sendOtpEmail };
