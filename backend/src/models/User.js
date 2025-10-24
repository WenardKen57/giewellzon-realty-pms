const mongoose = require("mongoose");

const LoginSecuritySchema = new mongoose.Schema(
  {
    count: { type: Number, default: 0 },
    lastAttempt: { type: Date },
    lockedUntil: { type: Date },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true, // Automatically remove whitespace
      minlength: 3, // Example minimum length
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true, // Store emails consistently
    },
    passwordHash: { type: String, required: true },
    role: { type: String, default: "admin", enum: ["admin"] }, // Assuming only admin role for now
    fullName: { type: String, trim: true },
    contactNumber: { type: String, trim: true },
    profileImage: { type: String }, // URL to profile image

    isActive: { type: Boolean, default: true },
    emailVerified: { type: Boolean, default: false },
    loginSecurity: { type: LoginSecuritySchema, default: {}, select: false }, // Exclude by default

    lastLogin: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
