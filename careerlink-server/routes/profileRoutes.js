const express = require("express");
const multer = require("multer");
const db = require("../config/db");
const { query, uploadDir } = require("../utils/schema");

const router = express.Router();

const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
        cb(null, `${Date.now()}-${safeName}`);
    },
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        cb(null, file.mimetype === "application/pdf");
    },
});

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

router.get("/seeker/:userId", async (req, res) => {
    const rows = await query(db, "SELECT * FROM users WHERE id = ?", [req.params.userId]);
    if (!rows.length) return res.status(404).json({ message: "User not found" });
    res.json(mapSeeker(rows[0]));
});

router.put("/seeker/:userId", async (req, res) => {
    const { headline, location, resume, skills, education, experience } = req.body;

    await query(
        db,
        `UPDATE users
         SET headline = ?, location = ?, resume = ?, skills = ?, education = ?, experience = ?
         WHERE id = ?`,
        [
            headline || "",
            location || "",
            resume || "",
            JSON.stringify(skills || []),
            JSON.stringify(education || []),
            JSON.stringify(experience || []),
            req.params.userId,
        ],
    );

    res.json({ message: "Profile saved" });
});

router.post("/seeker/:userId/resume", upload.single("resume"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "Please upload a PDF file" });
    }

    await query(db, "UPDATE users SET resume = ? WHERE id = ?", [req.file.filename, req.params.userId]);
    res.json({ message: "Resume uploaded", resume: req.file.filename });
});

router.get("/employer/:userId", async (req, res) => {
    const rows = await query(db, "SELECT * FROM users WHERE id = ?", [req.params.userId]);
    if (!rows.length) return res.status(404).json({ message: "User not found" });
    res.json(mapEmployer(rows[0]));
});

router.put("/employer/:userId", async (req, res) => {
    const { name, industry, description } = req.body;

    await query(
        db,
        "UPDATE users SET company_name = ?, industry = ?, company_description = ? WHERE id = ?",
        [name || "", industry || "", description || "", req.params.userId],
    );

    res.json({ message: "Company profile saved" });
});

module.exports = router;
