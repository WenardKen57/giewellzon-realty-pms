// Filename: routes/unit.routes.js

const express = require("express");
const router = express.Router();
const unitCtrl = require("../controllers/unitController.js");
const { uploadImage } = require("../middleware/upload");
const { requireAuth } = require("../middleware/auth");

// ===================================
// 🚪 UNIT ROUTES
// (Mounted at /api/units)
// ===================================

// --- Public Unit Routes ---

// THIS IS YOUR NEW MAIN SEARCH ENDPOINT
// GET /api/units?city=Metropolis&bedrooms=2&maxPrice=500000
router.get("/", unitCtrl.listUnits);

// Get a single, specific unit by its ID
router.get("/:id", unitCtrl.getUnit);

// --- Admin Unit Routes ---

// Update a specific unit (e.g., mark as "sold", change price)
router.patch("/:id", requireAuth, unitCtrl.updateUnit);

// Delete a specific unit
router.delete("/:id", requireAuth, unitCtrl.deleteUnit);

// --- Unit Upload Routes (for a specific unit) ---
router.post(
  "/:id/upload-photos",
  requireAuth,
  uploadImage.array("photos", 15),
  unitCtrl.uploadUnitPhotos // Uploads photos for the UNIT
);

// --- NEW ---
router.delete(
  "/:id/photo",
  requireAuth,
  unitCtrl.deleteUnitPhoto // Deletes one photo
);

module.exports = router;
