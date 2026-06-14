const express = require("express");
const router = express.Router();

const {
    loginUser,
    registerUser,
    resetPassword,
    sendPasswordResetCode,
    verifyRegistration,
} = require("../controllers/authController");

router.post("/register", registerUser);
router.post("/register/verify", verifyRegistration);
router.post("/login", loginUser);
router.post("/password/send-code", sendPasswordResetCode);
router.post("/password/reset", resetPassword);

module.exports = router;
