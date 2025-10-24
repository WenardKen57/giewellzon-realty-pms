const User = require("../models/User");
const { hashPassword, comparePassword } = require("../utils/password"); // Assuming these utils exist

// Get current user profile (excluding sensitive fields)
async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.sub).select(
      "-passwordHash -loginSecurity"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (e) {
    next(e);
  }
}

// Update current user's profile (username, fullName, contactNumber, profileImage)
async function updateMe(req, res, next) {
  try {
    const { fullName, contactNumber, profileImage, username } = req.body;

    // Basic validation for username
    if (!username || username.trim().length < 3) {
      return res
        .status(400)
        .json({
          message: "Username is required and must be at least 3 characters.",
        });
    }

    const updateData = {
      fullName: fullName || "",
      contactNumber: contactNumber || "",
      profileImage: profileImage || "",
      username: username.trim(), // Update username
    };

    // Perform update, return new doc, run validators, exclude sensitive fields
    const user = await User.findByIdAndUpdate(req.user.sub, updateData, {
      new: true,
      runValidators: true,
    }).select("-passwordHash -loginSecurity");

    if (!user) {
      return res.status(404).json({ message: "User not found during update" });
    }

    res.json(user);
  } catch (e) {
    // Handle potential duplicate username error
    if (e.code === 11000 && e.keyPattern && e.keyPattern.username) {
      return res.status(400).json({ message: "Username is already taken." });
    }
    console.error("Error updating profile:", e);
    next(e); // Pass other errors to handler
  }
}

// Change current user's password
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current and new passwords are required." });
    }
    if (newPassword.length < 6) {
      // Enforce minimum length
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters long." });
    }

    // Fetch user *including* password hash for comparison
    const user = await User.findById(req.user.sub);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Verify current password
    const isMatch = await comparePassword(currentPassword, user.passwordHash);
    if (!isMatch)
      return res.status(400).json({ message: "Current password incorrect." });

    // Hash and save the new password
    user.passwordHash = await hashPassword(newPassword);
    await user.save();

    res.json({ message: "Password updated successfully." });
  } catch (e) {
    console.error("Error changing password:", e);
    next(e);
  }
}

module.exports = { me, updateMe, changePassword };
