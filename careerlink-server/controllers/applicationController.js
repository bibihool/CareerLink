const db = require("../config/db");
const { query } = require("../utils/schema");

const allowedStatuses = ["Submitted", "Under Review", "Interview", "Offered", "Rejected"];

function mapApplication(row) {
    return {
        id: row.id,
        jobId: row.job_id,
        userId: row.user_id,
        applicant: row.applicant || "",
        email: row.email || "",
        resume: row.resume || "",
        status: row.status || "Submitted",
        note: row.note || "",
    };
}

function applicationQuery(whereClause = "") {
    return `SELECT applications.*, users.name AS applicant, users.email
            FROM applications
            LEFT JOIN users ON users.id = applications.user_id
            LEFT JOIN jobs ON jobs.id = applications.job_id
            ${whereClause}
            ORDER BY applications.id DESC`;
}

async function getApplications(req, res) {
    let rows;
    if (req.user.role === "admin") {
        rows = await query(db, applicationQuery());
    } else if (req.user.role === "employer") {
        rows = await query(db, applicationQuery("WHERE jobs.employer_id = ?"), [req.user.id]);
    } else {
        rows = await query(db, applicationQuery("WHERE applications.user_id = ?"), [req.user.id]);
    }
    res.json(rows.map(mapApplication));
}

async function createApplication(req, res) {
    const { jobId } = req.body;
    const jobs = await query(db, "SELECT id, status FROM jobs WHERE id = ?", [jobId]);
    if (!jobs.length || jobs[0].status !== "Open") return res.status(400).json({ message: "This job is not open for applications" });

    const existing = await query(db, "SELECT id FROM applications WHERE job_id = ? AND user_id = ?", [jobId, req.user.id]);
    if (existing.length) return res.status(409).json({ message: "You already applied for this job" });

    const users = await query(db, "SELECT resume, headline FROM users WHERE id = ?", [req.user.id]);
    const result = await query(
        db,
        "INSERT INTO applications (job_id, user_id, status, resume, note) VALUES (?, ?, 'Submitted', ?, ?)",
        [jobId, req.user.id, users[0]?.resume || "", users[0]?.headline || ""],
    );
    const rows = await query(db, applicationQuery("WHERE applications.id = ?"), [result.insertId]);
    res.status(201).json(mapApplication(rows[0]));
}

async function updateApplicationStatus(req, res) {
    const { status } = req.body;
    if (!allowedStatuses.includes(status)) return res.status(400).json({ message: "Invalid application status" });

    const rows = await query(
        db,
        `SELECT applications.id, applications.user_id, jobs.employer_id, jobs.title
         FROM applications JOIN jobs ON jobs.id = applications.job_id
         WHERE applications.id = ?`,
        [req.params.id],
    );
    const application = rows[0];
    if (!application) return res.status(404).json({ message: "Application not found" });
    if (req.user.role !== "admin" && Number(application.employer_id) !== Number(req.user.id)) {
        return res.status(403).json({ message: "You can only update applicants for your own jobs" });
    }

    await query(db, "UPDATE applications SET status = ? WHERE id = ?", [status, req.params.id]);
    await query(db, "INSERT INTO notifications (user_id, message) VALUES (?, ?)", [
        application.user_id,
        `Your application for ${application.title} is now ${status}.`,
    ]);
    res.json({ message: "Application status updated", userId: application.user_id });
}

module.exports = { createApplication, getApplications, updateApplicationStatus };
