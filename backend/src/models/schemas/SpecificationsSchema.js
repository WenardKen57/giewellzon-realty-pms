const mongoose = require("mongoose");

const SpecificationsSchema = new mongoose.Schema(
  {
    lotArea: { type: Number },
    floorArea: { type: Number },
    bedrooms: { type: Number },
    bathrooms: { type: Number },
    parking: { type: Number },
    yearBuilt: { type: Number },
  },
  { _id: false }
);

module.exports = SpecificationsSchema;
