const Property = require("../models/Property");

// Get all provinces that have at least one property
async function getProvincesWithProperties(req, res, next) {
  try {
    const provinces = await Property.distinct("province");
    res.json(provinces.filter(Boolean).sort());
  } catch (err) {
    console.error("Error fetching provinces:", err);
    res.status(500).json({ message: "Failed to fetch provinces" });
  }
}

// Get all cities under a specific province
async function getCitiesByProvince(req, res, next) {
  try {
    const { province } = req.params;
    const cities = await Property.distinct("city", { province });
    res.json(cities.filter(Boolean).sort());
  } catch (err) {
    console.error("Error fetching cities:", err);
    res.status(500).json({ message: "Failed to fetch cities" });
  }
}

module.exports = {
  getProvincesWithProperties,
  getCitiesByProvince,
};
