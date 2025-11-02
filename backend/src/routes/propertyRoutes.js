// routes/propertyRoutes.js
// Filename: routes/property.routes.js

const express = require("express");
const router = express.Router();
const propertyCtrl = require("../controllers/propertyController.js");
const unitCtrl = require("../controllers/unitController.js"); // Import unit controller
const { uploadImage, uploadSiteMap } = require("../middleware/upload");
const { requireAuth } = require("../middleware/auth");

// ===================================
// 🏠 PROPERTY ROUTES
// (Mounted at /api/properties)
// ===================================

// --- Public Property Routes ---
router.get("/", propertyCtrl.listProperties); // List all buildings/complexes
router.get("/featured", propertyCtrl.getFeaturedProperties); // List featured buildings
router.get("/:id", propertyCtrl.getProperty); // Get one building (and all its units)
router.post("/:id/view", propertyCtrl.incrementView); // Increment building view count

// --- Admin Property Routes ---
router.post("/", requireAuth, propertyCtrl.createProperty);
router.patch("/:id", requireAuth, propertyCtrl.updateProperty);
router.delete("/:id", requireAuth, propertyCtrl.deleteProperty);
router.patch("/:id/feature", requireAuth, propertyCtrl.toggleFeatured);

// --- Property Upload Routes (for the building) ---
router.post(
  "/:id/upload-thumbnail",
  requireAuth,
  uploadImage.single("thumbnail"),
  propertyCtrl.uploadThumbnail
);
router.post(
  "/:id/upload-photos",
  requireAuth,
  uploadImage.array("photos", 15),
  propertyCtrl.uploadPhotos // Uploads photos for the BUILDING
);
router.post(
  "/:id/upload-sitemap",
  requireAuth,
  uploadSiteMap.single("sitemap"),
  propertyCtrl.uploadSiteMap
);

// --- NEW: Property Media Deletion Routes ---
router.delete("/:id/thumbnail", requireAuth, propertyCtrl.deleteThumbnail);
router.delete("/:id/photo", requireAuth, propertyCtrl.deletePhoto);

// ===================================
// 🚪 UNIT ROUTES (relative to a Property)
// (e.g., /api/properties/:propertyId/units)
// ===================================

// Create a new unit FOR a specific property
router.post("/:propertyId/units", requireAuth, unitCtrl.createUnit);

// Get all units FOR a specific property
router.get(
  "/:propertyId/units",
  requireAuth, // You could make this public if needed
  unitCtrl.listUnitsForProperty
);

// --- DEPRECATED ROUTES (REMOVED) ---
// router.patch("/:id/mark-sold", ...);
// router.get("/:id/units", ...);
// router.post("/:id/units/increment", ...);
// router.post("/:id/units/decrement", ...);

module.exports = router;
