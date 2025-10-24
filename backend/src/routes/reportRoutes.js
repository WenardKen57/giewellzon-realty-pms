const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const ctrl = require("../controllers/reportController");

// Existing CSV downloads (auth required)
router.get("/sales", requireAuth, ctrl.salesCsv);
router.get("/properties", requireAuth, ctrl.propertiesCsv); // Reports on buildings
router.get("/inquiries", requireAuth, ctrl.inquiriesCsv);

// New route for Units CSV report
router.get("/units", requireAuth, ctrl.unitsCsv);

// New route for Agent Performance CSV report
router.get("/agents", requireAuth, ctrl.agentPerformanceCsv);

module.exports = router;
