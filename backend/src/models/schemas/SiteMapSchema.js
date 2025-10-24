const mongoose = require("mongoose");

const SiteMapSchema = new mongoose.Schema(
  {
    url: { type: String },
    mimeType: { type: String },
    originalName: { type: String },
  },
  { _id: false }
);

module.exports = SiteMapSchema;
