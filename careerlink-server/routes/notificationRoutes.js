const express = require("express");
const db = require("../config/db");
const { query } = require("../utils/schema");

const router = express.Router();

router.get("/", async (req, res) => {
    const userId = req.query.userId;
    const rows = await query(
        db,
        `SELECT * FROM notifications
         WHERE user_id IS NULL OR user_id = ?
         ORDER BY id DESC
         LIMIT 30`,
        [userId || null],
    );

    res.json(rows.map((row) => row.message));
});

router.post("/", async (req, res) => {
    const { userId, message } = req.body;

    await query(db, "INSERT INTO notifications (user_id, message) VALUES (?, ?)", [
        userId || null,
        message,
    ]);

    res.status(201).json({ message: "Notification saved" });
});

module.exports = router;
