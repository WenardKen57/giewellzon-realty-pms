const express = require("express");
const router = express.Router();
const {
  getProvincesWithProperties,
  getCitiesByProvince,
} = require("../controllers/locationController");

// GET /api/locations/provinces
router.get("/provinces", getProvincesWithProperties);

// GET /api/locations/provinces/:province/cities
router.get("/provinces/:province/cities", getCitiesByProvince);

module.exports = router;
