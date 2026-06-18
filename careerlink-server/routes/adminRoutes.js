const express = require("express");
const { authenticate, requireRole } = require("../middleware/authMiddleware");
const { getUsers, setUserSuspended } = require("../controllers/adminController");
const { deleteJob } = require("../controllers/jobController");

const router = express.Router();

router.use(authenticate, requireRole("admin"));
router.get("/users", getUsers);
router.patch("/users/:id/suspension", setUserSuspended);
router.delete("/jobs/:id", deleteJob);

module.exports = router;
