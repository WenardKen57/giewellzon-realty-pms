const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/inquiryController");
const { requireAuth } = require("../middleware/auth");

// Public
router.post("/", ctrl.submitInquiry);

// Admin
router.get("/", requireAuth, ctrl.listInquiries);
router.get("/config/types", requireAuth, ctrl.getInquiryTypes); // --- NEW ROUTE ---
router.get("/:id", requireAuth, ctrl.getInquiry);
router.patch("/:id/handle", requireAuth, ctrl.markHandled);
router.patch("/:id/status", requireAuth, ctrl.updateStatus);

module.exports = router;