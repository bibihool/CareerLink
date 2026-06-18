const multer = require("multer");
const { uploadDir } = require("../utils/schema");

const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
        cb(null, `${Date.now()}-${safeName}`);
    },
});

const resumeUpload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype !== "application/pdf") {
            cb(new Error("Resume must be a PDF file"));
            return;
        }
        cb(null, true);
    },
});

module.exports = resumeUpload;
