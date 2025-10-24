const mongoose = require("mongoose");

const SaleSchema = new mongoose.Schema(
  {
    // Property & Unit Links
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },
    unitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      required: true,
      index: true,
    },
    propertyName: { type: String, required: true },
    unitNumber: { type: String },
    propertyLocation: { type: String },

    // Buyer Info
    buyerName: { type: String, required: true },
    buyerEmail: { type: String },
    buyerPhone: { type: String },

    // Sale Details
    salePrice: { type: Number, required: true },
    saleDate: { type: Date, default: () => new Date(), index: true },
    closingDate: { type: Date, index: true },
    status: {
      type: String,
      enum: ["pending", "closed", "cancelled"],
      default: "pending",
      index: true,
    },
    financingType: {
      type: String,
      enum: ["pag_ibig", "in_house", "cash"],
      default: "cash",
      index: true,
    },

    // Derived Date Fields
    month: { type: Number, index: true },
    year: { type: Number, index: true },
    quarter: { type: Number, index: true },

    // Agent Info (Stored Directly)
    agentName: { type: String, index: true }, // Store name directly
    agentEmail: { type: String },
    agentPhone: { type: String },

    // Commission (Still useful to store if calculated manually)
    commissionRate: { type: Number },
    commissionAmount: { type: Number },

    // Other
    notes: { type: String },
    source: {
      type: String,
      enum: ["website", "referral", "walk_in", "advertisement"],
      index: true,
    },
    softDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

SaleSchema.pre("save", function (next) {
  let dateToUse = null; // Initialize

  // Prioritize closingDate if status is closed
  if (this.status === "closed" && this.closingDate) {
    dateToUse = this.closingDate;
  }
  // Fallback to saleDate, then createdAt (from timestamps: true), then now
  else {
    dateToUse = this.saleDate || this.createdAt || new Date();
  }

  // Check if we have a valid Date object before calculating derived fields
  if (dateToUse instanceof Date && !isNaN(dateToUse)) {
    const dt = new Date(dateToUse);
    this.month = dt.getMonth() + 1;
    this.year = dt.getFullYear();
    this.quarter = Math.floor(dt.getMonth() / 3) + 1;
  } else {
    // Clear derived fields if no valid date is found
    this.month = undefined;
    this.year = undefined;
    this.quarter = undefined;
  }

  // Calculate commission
  if (this.salePrice != null && this.commissionRate != null) {
    this.commissionAmount = this.salePrice * (this.commissionRate / 100);
  } else {
    this.commissionAmount = undefined; // Clear if inputs missing
  }

  next(); // Proceed with saving
});
module.exports = mongoose.model("Sale", SaleSchema);
