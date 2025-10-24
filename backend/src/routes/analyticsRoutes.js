const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/analyticsController");
const { requireAuth } = require("../middleware/auth");

// Existing routes
router.get("/dashboard", requireAuth, ctrl.dashboard);
router.get("/sales-trends", requireAuth, ctrl.salesTrends);

// Updated route name to match controller function
router.get("/property-performance", requireAuth, ctrl.propertyPerformance);

// New route for agent performance
router.get("/agent-performance", requireAuth, ctrl.agentPerformance);

// Snapshot routes (no change needed)
router.post("/snapshots", requireAuth, ctrl.createSnapshot);
router.get("/snapshots", requireAuth, ctrl.listSnapshots);

module.exports = router;
