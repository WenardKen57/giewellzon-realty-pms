const mongoose = require("mongoose");

const InquirySchema = new mongoose.Schema(
  {
    firstName: { type: String },
    lastName: { type: String },
    customerEmail: { type: String, required: true, index: true },
    customerPhone: { type: String },
    message: { type: String },

    inquiryType: {
      type: String,
      enum: ["general", "pricing", "schedule viewing", "financing", "others"],
      default: "general",
      index: true,
    },

    // 👇 Expanded status options
    status: {
      type: String,
      enum: [
        "pending",
        "new", // newly submitted, not yet opened
        "viewed", // opened but not acted on
        "contacted", // agent responded or called
        "interested", // customer shows further interest
        "not_interested", // customer declined or dropped
        "closed", // inquiry resolved
        "archived", // manually hidden or expired
      ],
      default: "pending",
      index: true,
    },

    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property" },
    propertyName: { type: String },

    handledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    handledByName: { type: String },

    emailNotificationSent: { type: Boolean, default: false },
    emailSentAt: { type: Date },

    handledAt: { type: Date },
    statusUpdatedAt: { type: Date }, // 👈 track when status changed
  },
  { timestamps: true }
);

module.exports = mongoose.model("Inquiry", InquirySchema);
