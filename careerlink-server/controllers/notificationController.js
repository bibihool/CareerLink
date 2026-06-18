const db = require("../config/db");
const { query } = require("../utils/schema");

async function getNotifications(req, res) {
    const rows = await query(db, `SELECT * FROM notifications WHERE user_id IS NULL OR user_id = ? ORDER BY id DESC LIMIT 30`, [req.user.id]);
    res.json(rows.map((row) => row.message));
}

async function createNotification(req, res) {
    const { userId, message } = req.body;
    if (!message?.trim()) return res.status(400).json({ message: "Notification message is required" });
    const targetUserId = req.user.role === "admin" && userId ? userId : req.user.id;
    await query(db, "INSERT INTO notifications (user_id, message) VALUES (?, ?)", [targetUserId, message.trim()]);
    res.status(201).json({ message: "Notification saved" });
}

module.exports = { createNotification, getNotifications };
