const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const runtimeSecret = crypto.randomBytes(64).toString("hex");

function getJwtSecret() {
    if (process.env.JWT_SECRET) return process.env.JWT_SECRET;

    console.warn("JWT_SECRET is not configured. Sessions will reset when the server restarts.");
    return runtimeSecret;
}

function signToken(user) {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        getJwtSecret(),
        { expiresIn: process.env.JWT_EXPIRES_IN || "8h" },
    );
}

module.exports = { getJwtSecret, signToken };
