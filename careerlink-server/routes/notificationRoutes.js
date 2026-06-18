const express = require("express");
const { authenticate } = require("../middleware/authMiddleware");
const { createNotification, getNotifications } = require("../controllers/notificationController");

const router = express.Router();

router.use(authenticate);
router.get("/", getNotifications);
router.post("/", createNotification);

module.exports = router;
