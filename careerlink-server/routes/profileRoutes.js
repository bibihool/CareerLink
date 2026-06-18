const express = require("express");
const { authenticate, requireRole, requireSelf } = require("../middleware/authMiddleware");
const resumeUpload = require("../middleware/resumeUpload");
const {
    getEmployerProfile,
    getSeekerProfile,
    downloadResume,
    updateEmployerProfile,
    updateSeekerProfile,
    uploadResume,
} = require("../controllers/profileController");

const router = express.Router();

router.use(authenticate);
router.get("/resumes/:filename", downloadResume);
router.get("/seeker/:userId", requireRole("jobseeker", "admin"), getSeekerProfile);
router.put("/seeker/:userId", requireRole("jobseeker"), requireSelf(), updateSeekerProfile);
router.post("/seeker/:userId/resume", requireRole("jobseeker"), requireSelf(), resumeUpload.single("resume"), uploadResume);
router.get("/employer/:userId", requireRole("employer", "admin"), getEmployerProfile);
router.put("/employer/:userId", requireRole("employer"), requireSelf(), updateEmployerProfile);

module.exports = router;
