const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/userController");
const { requireAuth } = require("../middleware/auth"); // Ensure auth middleware is used

// Get current user profile
router.get("/me", requireAuth, ctrl.me);

// Update current user profile (username, fullName, contact, image)
router.patch("/me", requireAuth, ctrl.updateMe);

// Change current user password
router.patch("/me/change-password", requireAuth, ctrl.changePassword);

module.exports = router;
