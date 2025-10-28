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
    description: { type: String, trim: true }, // Description specific to this unit
    amenities: { type: [String], default: [] }, // Amenities inside this unit
  },
  { timestamps: true }
);

// Optional: Text index for unit-specific search
UnitSchema.index({ unitNumber: "text" });

// --- NEW MIDDLEWARE ---
// When a Unit is hard-deleted (via findByIdAndDelete),
// find all associated Sales and soft-delete them.
UnitSchema.pre("findOneAndDelete", async function (next) {
  try {
    // 'this.getFilter()' gets the query, e.g., { _id: 'unitId' }
    const doc = await this.model.findOne(this.getFilter());
    if (doc) {
      // Use mongoose.model('Sale') to avoid circular dependency issues
      // Soft-delete sales matching the logic in saleController.js
      await mongoose.model("Sale").updateMany(
        { unitId: doc._id },
        { $set: { softDeleted: true, status: "cancelled" } } // Also set status to 'cancelled'
      );
    }
    next(); // Continue with the deletion
  } catch (err) {
    next(err); // Pass error to Express
  }
});
// --- END OF NEW MIDDLEWARE ---

module.exports = mongoose.model("Unit", UnitSchema);
