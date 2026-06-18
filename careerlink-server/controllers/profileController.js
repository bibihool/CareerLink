const db = require("../config/db");
const path = require("path");
const { query, uploadDir } = require("../utils/schema");

function parseJson(value, fallback = []) {
    if (!value) return fallback;
    if (Array.isArray(value)) return value;
    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
}

function mapSeeker(row) {
    return {
        headline: row.headline || "Fresh graduate seeking opportunities",
        location: row.location || "",
        resume: row.resume || "",
        skills: parseJson(row.skills),
        education: parseJson(row.education),
        experience: parseJson(row.experience),
    };
}

function mapEmployer(row) {
    return {
        name: row.company_name || row.name || "",
        industry: row.industry || "",
        description: row.company_description || "",
    };
}

function canAccessUser(req, userId) {
    return req.user.role === "admin" || Number(req.user.id) === Number(userId);
}

async function getSeekerProfile(req, res) {
    if (!canAccessUser(req, req.params.userId)) return res.status(403).json({ message: "Profile access denied" });
    const rows = await query(db, "SELECT * FROM users WHERE id = ? AND role = 'jobseeker'", [req.params.userId]);
    if (!rows.length) return res.status(404).json({ message: "Job seeker not found" });
    res.json(mapSeeker(rows[0]));
}

async function updateSeekerProfile(req, res) {
    if (Number(req.user.id) !== Number(req.params.userId)) return res.status(403).json({ message: "Profile access denied" });
    const { headline, location, resume, skills, education, experience } = req.body;
    await query(
        db,
        `UPDATE users SET headline = ?, location = ?, resume = ?, skills = ?, education = ?, experience = ?
         WHERE id = ? AND role = 'jobseeker'`,
        [headline || "", location || "", resume || "", JSON.stringify(skills || []), JSON.stringify(education || []), JSON.stringify(experience || []), req.user.id],
    );
    res.json({ message: "Profile saved" });
}

async function uploadResume(req, res) {
    if (Number(req.user.id) !== Number(req.params.userId)) return res.status(403).json({ message: "Profile access denied" });
    if (!req.file) return res.status(400).json({ message: "Please upload a PDF file" });
    await query(db, "UPDATE users SET resume = ? WHERE id = ? AND role = 'jobseeker'", [req.file.filename, req.user.id]);
    res.json({ message: "Resume uploaded", resume: req.file.filename });
}

async function downloadResume(req, res) {
    const filename = path.basename(req.params.filename);
    let allowed = req.user.role === "admin";

    if (req.user.role === "jobseeker") {
        const rows = await query(db, "SELECT id FROM users WHERE id = ? AND resume = ?", [req.user.id, filename]);
        allowed = rows.length > 0;
    } else if (req.user.role === "employer") {
        const rows = await query(
            db,
            `SELECT applications.id FROM applications
             JOIN jobs ON jobs.id = applications.job_id
             WHERE applications.resume = ? AND jobs.employer_id = ? LIMIT 1`,
            [filename, req.user.id],
        );
        allowed = rows.length > 0;
    }

    if (!allowed) return res.status(403).json({ message: "Resume access denied" });
    res.sendFile(path.join(uploadDir, filename));
}

async function getEmployerProfile(req, res) {
    if (!canAccessUser(req, req.params.userId)) return res.status(403).json({ message: "Profile access denied" });
    const rows = await query(db, "SELECT * FROM users WHERE id = ? AND role = 'employer'", [req.params.userId]);
    if (!rows.length) return res.status(404).json({ message: "Employer not found" });
    res.json(mapEmployer(rows[0]));
}

async function updateEmployerProfile(req, res) {
    if (Number(req.user.id) !== Number(req.params.userId)) return res.status(403).json({ message: "Profile access denied" });
    const { name, industry, description } = req.body;
    await query(
        db,
        "UPDATE users SET company_name = ?, industry = ?, company_description = ? WHERE id = ? AND role = 'employer'",
        [name || "", industry || "", description || "", req.user.id],
    );
    res.json({ message: "Company profile saved" });
}

module.exports = { downloadResume, getEmployerProfile, getSeekerProfile, updateEmployerProfile, updateSeekerProfile, uploadResume };
