const db = require("../config/db");
const { query } = require("../utils/schema");

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

async function getJobs(req, res) {
    const rows = await query(
        db,
        `SELECT jobs.*, users.name AS employer_name, users.company_name
         FROM jobs LEFT JOIN users ON users.id = jobs.employer_id
         ORDER BY jobs.id DESC`,
    );
    res.json(rows.map(mapJob));
}

async function getEmployerName(userId) {
    const rows = await query(db, "SELECT name, company_name FROM users WHERE id = ?", [userId]);
    return rows[0]?.company_name || rows[0]?.name || "CareerLink Employer";
}

async function findOwnedJob(req, res) {
    const rows = await query(db, "SELECT * FROM jobs WHERE id = ?", [req.params.id]);
    const job = rows[0];
    if (!job) {
        res.status(404).json({ message: "Job not found" });
        return null;
    }
    if (req.user.role !== "admin" && Number(job.employer_id) !== Number(req.user.id)) {
        res.status(403).json({ message: "You can only manage your own job postings" });
        return null;
    }
    return job;
}

async function createJob(req, res) {
    const { title, location, salary, type, description } = req.body;
    if (!title || !location || !description) return res.status(400).json({ message: "Please complete all required job fields" });

    const company = await getEmployerName(req.user.id);
    const result = await query(
        db,
        `INSERT INTO jobs (title, company, location, salary, employment_type, description, status, employer_id)
         VALUES (?, ?, ?, ?, ?, ?, 'Open', ?)`,
        [title, company, location, Number(salary) || 0, type || "Full-time", description, req.user.id],
    );
    const rows = await query(db, "SELECT * FROM jobs WHERE id = ?", [result.insertId]);
    res.status(201).json(mapJob(rows[0]));
}

async function updateJob(req, res) {
    if (!await findOwnedJob(req, res)) return;
    const { title, location, salary, type, description } = req.body;
    const company = await getEmployerName(req.user.id);
    await query(
        db,
        `UPDATE jobs SET title = ?, company = ?, location = ?, salary = ?, employment_type = ?, description = ? WHERE id = ?`,
        [title, company, location, Number(salary) || 0, type || "Full-time", description, req.params.id],
    );
    const rows = await query(db, "SELECT * FROM jobs WHERE id = ?", [req.params.id]);
    res.json(mapJob(rows[0]));
}

async function closeJob(req, res) {
    if (!await findOwnedJob(req, res)) return;
    await query(db, "UPDATE jobs SET status = 'Closed' WHERE id = ?", [req.params.id]);
    res.json({ message: "Job closed" });
}

async function deleteJob(req, res) {
    if (!await findOwnedJob(req, res)) return;
    await query(db, "DELETE FROM applications WHERE job_id = ?", [req.params.id]);
    await query(db, "DELETE FROM jobs WHERE id = ?", [req.params.id]);
    res.json({ message: "Job deleted" });
}

module.exports = { closeJob, createJob, deleteJob, getJobs, mapJob, updateJob };
