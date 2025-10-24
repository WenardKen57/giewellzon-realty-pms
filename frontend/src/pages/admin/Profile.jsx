import { useEffect, useState } from "react";
import { getProfile, updateProfile, changePassword } from "../../api/users";
import { toast } from "react-toastify";

function InputField({
  label,
  id,
  name,
  type = "text",
  value,
  onChange,
  disabled = false,
  required = false,
  placeholder = "",
  autoComplete = "off",
}) {
  return (
    <div className="space-y-1">
      <label
        htmlFor={id || name}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      <input
        id={id || name}
        name={name}
        type={type}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${
          disabled ? "bg-gray-100 cursor-not-allowed" : ""
        }`}
        placeholder={placeholder || label}
        value={value ?? ""}
        onChange={onChange}
        disabled={disabled}
        required={required}
        autoComplete={autoComplete}
      />
    </div>
  );
}

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    contactNumber: "",
    username: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    setLoading(true);
    getProfile()
      .then((data) => {
        if (!data) throw new Error("No profile data received");
        setProfile(data);
        setProfileForm({
          fullName: data.fullName || "",
          contactNumber: data.contactNumber || "",
          username: data.username || "",
        });
      })
      .catch((err) => {
        console.error("Failed to load profile:", err);
        toast.error("Failed to load profile.");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.username || profileForm.username.trim().length < 3) {
      toast.error("Username must be at least 3 characters.");
      return;
    }
    setSavingProfile(true);
    try {
      const updated = await updateProfile(profileForm);
      setProfile(updated);
      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Profile update failed.");
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.error("Please fill in all password fields.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setSavingPassword(true);
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success("Password changed successfully!");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      console.error(err);
      toast.error("Password change failed.");
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500 text-lg">
        Loading profile...
      </div>
    );

  if (!profile)
    return (
      <div className="p-8 text-center text-red-500 text-lg">
        Could not load profile data.
      </div>
    );

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-10 bg-white rounded-xl shadow border border-gray-200">
      <h1 className="text-3xl font-bold text-gray-800 border-b pb-3">
        My Profile
      </h1>

      {/* --- Profile Form --- */}
      <form onSubmit={saveProfile} className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">
          Account Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <InputField
            label="Username"
            name="username"
            value={profileForm.username}
            onChange={handleProfileChange}
            required
          />
          <InputField
            label="Email"
            name="email"
            value={profile.email}
            disabled
          />
          <InputField
            label="Full Name"
            name="fullName"
            value={profileForm.fullName}
            onChange={handleProfileChange}
          />
          <InputField
            label="Contact Number"
            name="contactNumber"
            value={profileForm.contactNumber}
            onChange={handleProfileChange}
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={savingProfile}
            className="px-5 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {savingProfile ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>

      {/* --- Password Form --- */}
      <form onSubmit={savePassword} className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">
          Change Password
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <InputField
            label="Current Password"
            name="currentPassword"
            type="password"
            value={passwordForm.currentPassword}
            onChange={handlePasswordChange}
            required
          />
          <InputField
            label="New Password"
            name="newPassword"
            type="password"
            value={passwordForm.newPassword}
            onChange={handlePasswordChange}
            required
          />
          <InputField
            label="Confirm New Password"
            name="confirmPassword"
            type="password"
            value={passwordForm.confirmPassword}
            onChange={handlePasswordChange}
            required
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={savingPassword}
            className="px-5 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {savingPassword ? "Changing..." : "Change Password"}
          </button>
        </div>
      </form>
    </div>
  );
}
