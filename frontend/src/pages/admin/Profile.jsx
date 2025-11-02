import { useEffect, useState } from "react";
import { getProfile, updateProfile, changePassword } from "../../api/users";
import { toast } from "react-toastify";
import { User, Mail, Phone, Lock, Save, Loader2 } from "lucide-react";

/**
 * [ENHANCED] Rebuilt InputField to use standard 'input' class and support icons
 */
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
  icon: Icon, // New icon prop
}) {
  return (
    <div>
      <label
        htmlFor={id || name}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      <div className="relative mt-1">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        )}
        <input
          id={id || name}
          name={name}
          type={type}
          className={`input w-full ${Icon ? "pl-10" : ""}`} // Use standard input class
          placeholder={placeholder || label}
          value={value ?? ""}
          onChange={onChange}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
        />
      </div>
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
      toast.error(err?.response?.data?.message || "Profile update failed.");
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
      toast.error(err?.response?.data?.message || "Password change failed.");
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
    // [EDIT] New page layout
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* [EDIT] New Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500">
          Update your account details and password.
        </p>
      </div>

      {/* [EDIT] New 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* --- Profile Form Card --- */}
        <div className="p-6 bg-white border rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 border-b pb-3">
            Account Details
          </h2>
          <form onSubmit={saveProfile} className="space-y-4 mt-4">
            <InputField
              label="Username"
              name="username"
              value={profileForm.username}
              onChange={handleProfileChange}
              required
              icon={User}
            />
            <InputField
              label="Email"
              name="email"
              value={profile.email}
              disabled
              icon={Mail}
            />
            <InputField
              label="Full Name"
              name="fullName"
              value={profileForm.fullName}
              onChange={handleProfileChange}
              icon={User}
            />
            <InputField
              label="Contact Number"
              name="contactNumber"
              value={profileForm.contactNumber}
              onChange={handleProfileChange}
              icon={Phone}
            />

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="btn bg-gradient-to-br from-green-500 to-green-700 text-white hover:from-green-600 hover:to-green-800 w-full sm:w-auto"
              >
                {savingProfile ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Save className="w-5 h-5 mr-2" />
                )}
                <span>{savingProfile ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* --- Password Form Card --- */}
        <div className="p-6 bg-white border rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 border-b pb-3">
            Change Password
          </h2>
          <form onSubmit={savePassword} className="space-y-4 mt-4">
            <InputField
              label="Current Password"
              name="currentPassword"
              type="password"
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange}
              required
              icon={Lock}
            />
            <InputField
              label="New Password"
              name="newPassword"
              type="password"
              value={passwordForm.newPassword}
              onChange={handlePasswordChange}
              required
              icon={Lock}
            />
            <InputField
              label="Confirm New Password"
              name="confirmPassword"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={handlePasswordChange}
              required
              icon={Lock}
            />

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingPassword}
                className="btn bg-gradient-to-br from-red-500 to-red-700 text-white hover:from-red-600 hover:to-red-800 w-full sm:w-auto"
              >
                {savingPassword ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Save className="w-5 h-5 mr-2" />
                )}
                <span>{savingPassword ? "Changing..." : "Change Password"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

