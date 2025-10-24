const express = require("express");
const router = express.Router();

const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const propertyRoutes = require("./propertyRoutes");
const unitRoutes = require("./unitRoutes");
const saleRoutes = require("./saleRoutes");
const inquiryRoutes = require("./inquiryRoutes");
const analyticsRoutes = require("./analyticsRoutes");
const reportRoutes = require("./reportRoutes"); // ensure this filename exists exactly
const locationRoutes = require("./locationRoutes");

// Mount API routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/properties", propertyRoutes);
router.use("/units", unitRoutes);
router.use("/sales", saleRoutes);
router.use("/inquiries", inquiryRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/reports", reportRoutes);
router.use("/locations", locationRoutes);

module.exports = router;
