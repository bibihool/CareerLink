const express = require("express");
const db = require("../config/db");
const { query } = require("../utils/schema");

const router = express.Router();

function mapApplication(row) {
    return {
        id: row.id,
        jobId: row.job_id,
        applicant: row.applicant || "",
        email: row.email || "",
        resume: row.resume || "",
        status: row.status || "Submitted",
        note: row.note || "",
    };
}

router.get("/", async (req, res) => {
    const rows = await query(
        db,
        `SELECT applications.*, users.name AS applicant, users.email
         FROM applications
         LEFT JOIN users ON users.id = applications.user_id
         ORDER BY applications.id DESC`,
    );

    res.json(rows.map(mapApplication));
});

router.post("/", async (req, res) => {
    const { jobId, userId, resume, note } = req.body;

    const existing = await query(
        db,
        "SELECT id FROM applications WHERE job_id = ? AND user_id = ?",
        [jobId, userId],
    );

    if (existing.length) {
        return res.status(409).json({ message: "You already applied for this job" });
    }

    const result = await query(
        db,
        "INSERT INTO applications (job_id, user_id, status, resume, note) VALUES (?, ?, 'Submitted', ?, ?)",
        [jobId, userId, resume || "", note || ""],
    );

    const rows = await query(
        db,
        `SELECT applications.*, users.name AS applicant, users.email
         FROM applications
         LEFT JOIN users ON users.id = applications.user_id
         WHERE applications.id = ?`,
        [result.insertId],
    );

    res.status(201).json(mapApplication(rows[0]));
});

router.patch("/:id/status", async (req, res) => {
    const { status } = req.body;

    await query(db, "UPDATE applications SET status = ? WHERE id = ?", [status, req.params.id]);
    res.json({ message: "Application status updated" });
});

module.exports = router;
