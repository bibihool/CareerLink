const express = require("express");
const { authenticate, requireRole } = require("../middleware/authMiddleware");
const { closeJob, createJob, deleteJob, getJobs, updateJob } = require("../controllers/jobController");

const router = express.Router();

router.get("/", getJobs);
router.post("/", authenticate, requireRole("employer"), createJob);
router.put("/:id", authenticate, requireRole("employer"), updateJob);
router.patch("/:id/close", authenticate, requireRole("employer"), closeJob);
router.delete("/:id", authenticate, requireRole("employer", "admin"), deleteJob);

module.exports = router;
