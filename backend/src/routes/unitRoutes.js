// routes/unitRoutes.js
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
router.get("/", unitCtrl.listUnits);
router.get("/:id", unitCtrl.getUnit);

// --- Admin Unit Routes ---
router.patch("/:id", requireAuth, unitCtrl.updateUnit);
router.delete("/:id", requireAuth, unitCtrl.deleteUnit);

// --- Unit Upload Routes (for a specific unit) ---
router.post(
  "/:id/upload-photos",
  requireAuth,
  uploadImage.array("photos", 15),
  unitCtrl.uploadUnitPhotos // Uploads GALLERY photos for the UNIT
);

// --- NEW: Unit Thumbnail Routes ---
router.post(
  "/:id/upload-thumbnail",
  requireAuth,
  uploadImage.single("thumbnail"), // Use single upload
  unitCtrl.uploadUnitThumbnail // New controller
);

router.delete(
  "/:id/thumbnail",
  requireAuth,
  unitCtrl.deleteUnitThumbnail // New controller
);

// --- Unit Photo Deletion ---
router.delete(
  "/:id/photo",
  requireAuth,
  unitCtrl.deleteUnitPhoto // Deletes one photo
);

module.exports = router;
