const bcrypt = require("bcryptjs");
const db = require("../config/db");
const { query } = require("../utils/schema");
const { sendOtpEmail } = require("../utils/mailer");

function toDbRole(role) {
    if (role === "Employer" || role === "employer") return "employer";
    if (role === "Admin" || role === "admin") return "admin";
    return "jobseeker";
}

function toClientRole(role) {
    if (role === "admin") return "Admin";
    return role === "employer" ? "Employer" : "Job Seeker";
}

function mapUser(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: toClientRole(user.role),
    };
}

function createOtpCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
}

function getOtpExpiry() {
    const minutes = Number(process.env.OTP_EXPIRY_MINUTES || 10);
    return new Date(Date.now() + minutes * 60 * 1000);
}

async function saveOtp({ email, purpose, payload }) {
    const code = createOtpCode();
    const codeHash = await bcrypt.hash(code, 10);

    await query(
        db,
        "UPDATE email_otps SET used = 1 WHERE email = ? AND purpose = ? AND used = 0",
        [email, purpose],
    );

    await query(
        db,
        "INSERT INTO email_otps (email, code_hash, purpose, payload, expires_at) VALUES (?, ?, ?, ?, ?)",
        [email, codeHash, purpose, JSON.stringify(payload || {}), getOtpExpiry()],
    );

    await sendOtpEmail({ to: email, code, purpose });
}

async function findValidOtp({ email, code, purpose }) {
    const rows = await query(
        db,
        `SELECT * FROM email_otps
         WHERE email = ? AND purpose = ? AND used = 0 AND expires_at > NOW()
         ORDER BY id DESC
         LIMIT 1`,
        [email, purpose],
    );
    const otp = rows[0];

    if (!otp) return null;

    const isMatch = await bcrypt.compare(code, otp.code_hash);
    return isMatch ? otp : null;
}

const registerUser = async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({
            message: "Please fill in all fields"
        });
    }

    try {
        const existing = await query(db, "SELECT id FROM users WHERE email = ?", [email]);
        if (existing.length) {
            return res.status(409).json({
                message: "Email is already registered"
            });
        }

        await saveOtp({
            email,
            purpose: "register",
            payload: { name, email, password, role },
        });

        res.json({
            message: "Verification code sent to email",
            email,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: error.message === "Gmail SMTP is not configured"
                ? "Gmail SMTP is not configured on the server"
                : "Server error"
        });
    }
};

const verifyRegistration = async (req, res) => {
    const { email, code } = req.body;

    if (!email || !code) {
        return res.status(400).json({ message: "Please enter the verification code" });
    }

    try {
        const otp = await findValidOtp({ email, code, purpose: "register" });
        if (!otp) {
            return res.status(400).json({ message: "Invalid or expired verification code" });
        }

        const payload = JSON.parse(otp.payload || "{}");
        const existing = await query(db, "SELECT id FROM users WHERE email = ?", [email]);
        if (existing.length) {
            return res.status(409).json({ message: "Email is already registered" });
        }

        const hashedPassword = await bcrypt.hash(payload.password, 10);
        const result = await query(
            db,
            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
            [payload.name, payload.email, hashedPassword, toDbRole(payload.role)],
        );

        await query(db, "UPDATE email_otps SET used = 1 WHERE id = ?", [otp.id]);
        const rows = await query(db, "SELECT * FROM users WHERE id = ?", [result.insertId]);

        res.status(201).json({
            message: "Email verified and account created",
            user: mapUser(rows[0]),
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Please enter email and password"
        });
    }

    try {
        const rows = await query(db, "SELECT * FROM users WHERE email = ?", [email]);
        const user = rows[0];

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        res.json({
            message: "Login successful",
            user: mapUser(user),
        });
    } catch {
        res.status(500).json({
            message: "Server error"
        });
    }
};

const sendPasswordResetCode = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Please enter your email address" });
    }

    try {
        const rows = await query(db, "SELECT id FROM users WHERE email = ?", [email]);
        if (rows.length) {
            await saveOtp({ email, purpose: "password_reset", payload: { email } });
        }

        res.json({
            message: "If the email exists, a recovery code has been sent",
            email,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: error.message === "Gmail SMTP is not configured"
                ? "Gmail SMTP is not configured on the server"
                : "Server error"
        });
    }
};

const resetPassword = async (req, res) => {
    const { email, code, password } = req.body;

    if (!email || !code || !password) {
        return res.status(400).json({ message: "Please complete all reset fields" });
    }

    try {
        const otp = await findValidOtp({ email, code, purpose: "password_reset" });
        if (!otp) {
            return res.status(400).json({ message: "Invalid or expired verification code" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await query(db, "UPDATE users SET password = ? WHERE email = ?", [hashedPassword, email]);
        await query(db, "UPDATE email_otps SET used = 1 WHERE id = ?", [otp.id]);

        res.json({ message: "Password reset successful" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    registerUser,
    resetPassword,
    sendPasswordResetCode,
    loginUser,
    verifyRegistration,
};
