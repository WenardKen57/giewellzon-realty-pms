const mongoose = require("mongoose");
const SpecificationsSchema = require("./schemas/SpecificationsSchema.js");

const UnitSchema = new mongoose.Schema(
  {
    // Link to the parent building/complex
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },

    // Fields moved from Property
    unitNumber: { type: String, index: true }, // e.g., "Apt 101", "Villa 5", "Main House"
    price: { type: Number, default: 0, index: true },
    status: {
      type: String,
      enum: ["available", "sold", "rented"], // Added 'rented'
      default: "available",
      index: true,
    },
    specifications: { type: SpecificationsSchema, default: {} },
    soldDate: { type: Date },

    // Unit-specific media
    photos: { type: [String], default: [] },
    videoTours: { type: [String], default: [] },
    // --- 👇 ADD THESE FIELDS ---
    description: { type: String, trim: true }, // Description specific to this unit
    amenities: { type: [String], default: [] }, // Amenities inside this unit (e.g., Balcony, Fireplace)

    // You could also move agent assignment here if agents are per-unit
    // assignedAgentName: { type: String },
  },
  { timestamps: true }
);

// Optional: Text index for unit-specific search
UnitSchema.index({ unitNumber: "text" });

module.exports = mongoose.model("Unit", UnitSchema);
