const express = require("express");
const db = require("../config/db");
const { query } = require("../utils/schema");

const router = express.Router();

function mapJob(row) {
    return {
        id: row.id,
        title: row.title || "",
        company: row.company || row.company_name || row.employer_name || "CareerLink Employer",
        location: row.location || "",
        salary: Number(row.salary || 0),
        type: row.employment_type || "Full-time",
        status: row.status || "Open",
        description: row.description || "",
        employerId: row.employer_id,
    };
}

router.get("/", async (req, res) => {
    const rows = await query(
        db,
        `SELECT jobs.*, users.name AS employer_name, users.company_name
         FROM jobs
         LEFT JOIN users ON users.id = jobs.employer_id
         ORDER BY jobs.id DESC`,
    );

    res.json(rows.map(mapJob));
});

router.post("/", async (req, res) => {
    const { title, company, location, salary, type, description, employerId } = req.body;
    const result = await query(
        db,
        `INSERT INTO jobs (title, company, location, salary, employment_type, description, status, employer_id)
         VALUES (?, ?, ?, ?, ?, ?, 'Open', ?)`,
        [title, company, location, salary || 0, type || "Full-time", description, employerId || null],
    );

    const rows = await query(db, "SELECT * FROM jobs WHERE id = ?", [result.insertId]);
    res.status(201).json(mapJob(rows[0]));
});

router.put("/:id", async (req, res) => {
    const { title, company, location, salary, type, description } = req.body;

    await query(
        db,
        `UPDATE jobs
         SET title = ?, company = ?, location = ?, salary = ?, employment_type = ?, description = ?
         WHERE id = ?`,
        [title, company, location, salary || 0, type || "Full-time", description, req.params.id],
    );

    const rows = await query(db, "SELECT * FROM jobs WHERE id = ?", [req.params.id]);
    res.json(mapJob(rows[0]));
});

router.patch("/:id/close", async (req, res) => {
    await query(db, "UPDATE jobs SET status = 'Closed' WHERE id = ?", [req.params.id]);
    res.json({ message: "Job closed" });
});

router.delete("/:id", async (req, res) => {
    await query(db, "DELETE FROM applications WHERE job_id = ?", [req.params.id]);
    await query(db, "DELETE FROM jobs WHERE id = ?", [req.params.id]);
    res.json({ message: "Job deleted" });
});

module.exports = router;
