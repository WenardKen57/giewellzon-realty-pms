const mongoose = require("mongoose");

const AnalyticsSnapshotSchema = new mongoose.Schema(
  {
    snapshotDate: { type: Date, default: () => new Date(), index: true },
    period: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly"],
      default: "monthly",
      index: true,
    }, // Added yearly
    metrics: {
      // Inventory Counts
      totalBuildings: { type: Number, default: 0 },
      totalUnits: { type: Number, default: 0 },
      availableUnits: { type: Number, default: 0 },
      soldUnits: { type: Number, default: 0 }, // Based on Unit status 'sold'
      rentedUnits: { type: Number, default: 0 }, // Based on Unit status 'rented'

      // Sales Performance (Based on 'closed' Sales in the period, if applicable)
      closedSalesCount: { type: Number, default: 0 },
      closedSalesRevenue: { type: Number, default: 0 },
      closedSalesAvgPrice: { type: Number, default: 0 },
      totalCommissionPaid: { type: Number, default: 0 }, // Sum of commissionAmount for closed sales

      // Lead/Inquiry Metrics
      newInquiries: { type: Number, default: 0 }, // Inquiries created in the period
      pendingInquiries: { type: Number, default: 0 }, // Inquiries not closed/cancelled/archived
    },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

module.exports = mongoose.model("AnalyticsSnapshot", AnalyticsSnapshotSchema);
