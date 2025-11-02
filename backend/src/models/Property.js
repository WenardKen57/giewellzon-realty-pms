const mongoose = require("mongoose");
const SiteMapSchema = require("./schemas/SiteMapSchema.js");

// Note: This model describes the *building* or *complex*
const PropertySchema = new mongoose.Schema(
  {
    propertyName: { type: String, required: true, index: true }, // e.g., "The Grand Residences"
    description: { type: String }, // Description of the building/complex
    location: { type: String }, // General location/address
    street: { type: String, index: true },
    city: { type: String, index: true },
    province: { type: String, index: true },

    // Media for the *building* (lobby, pool, exterior)
    thumbnail: { type: String },
    photos: { type: [String], default: [] },
    videoTours: { type: [String], default: [] },

    featured: { type: Boolean, default: false }, // Feature the whole building

    // Describes the *building type*
    propertyType: {
      type: String,
      enum: [
        "house",
        "condo", // e.g., "Condo Building"
        "apartment", // e.g., "Apartment Complex"
        "townhouse",
        "villa",
        "compound",
      ],
      default: "house",
      index: true,
    },

    // Shared amenities for all units (pool, gym, etc.)
    amenities: { type: [String], default: [] },
    siteMap: { type: SiteMapSchema, default: null }, // e.g., complex layout

    // Agent for the *whole property*
    assignedAgentName: { type: String },
    assignedAgentEmail: { type: String },
    assignedAgentPhone: { type: String },

    viewCount: { type: Number, default: 0 }, // Views on the building page
    listedDate: { type: Date, default: () => new Date() },

    // --- REMOVED FIELDS ---
    // price (moved to Unit)
    // status (moved to Unit)
    // specifications (moved to Unit)
    // numberOfUnit (will be a dynamic count of Units)
    // soldDate (moved to Unit)
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Virtual field to get all units for this property
PropertySchema.virtual("units", {
  ref: "Unit",
  localField: "_id",
  foreignField: "property",
});

// CRITICAL: When a Property is deleted, delete all its associated Units
PropertySchema.pre("findOneAndDelete", async function (next) {
  try {
    const doc = await this.model.findOne(this.getFilter());
    if (doc) {
      await mongoose.model("Unit").deleteMany({ property: doc._id });
    }
    next();
  } catch (err) {
    next(err);
  }
});

PropertySchema.index({
  propertyName: "text",
  description: "text",
  city: "text",
  province: "text",
});

module.exports = mongoose.model("Property", PropertySchema);
