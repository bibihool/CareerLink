const express = require("express");
const { authenticate, requireRole } = require("../middleware/authMiddleware");
const { createApplication, getApplications, updateApplicationStatus } = require("../controllers/applicationController");

const router = express.Router();

router.use(authenticate);
router.get("/", getApplications);
router.post("/", requireRole("jobseeker"), createApplication);
router.patch("/:id/status", requireRole("employer", "admin"), updateApplicationStatus);

module.exports = router;
