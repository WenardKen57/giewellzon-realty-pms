import { useState } from "react";
import { InquiriesAPI } from "../../api/inquiries";

export default function InquiryForm({ propertyId }) {
  const [inq, setInq] = useState({
    inquiryType: "general",
    firstName: "",
    lastName: "",
    customerEmail: "",
    customerPhone: "", // optional
    message: "",
  });
  const [status, setStatus] = useState("");
  const [agree, setAgree] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Spam protection: cooldown
    if (inq._cooldown) return;

    // Honeypot detection
    if (inq._honeypot) {
      setStatus({
        type: "error",
        message: "❌ Spam detected. Submission rejected.",
      });
      return;
    }

    // Validation (phone is optional)
    if (!inq.firstName.trim() || !inq.lastName.trim()) {
      setStatus({ type: "error", message: "Please enter your full name." });
      return;
    }
    const phone = inq.customerPhone.trim();
    const phPattern = /^(09\d{9}|\+639\d{9})$/;

    if (phone && !phPattern.test(phone)) {
      setStatus({
        type: "error",
        message:
          "Please enter a valid Philippine phone number (e.g., 09123456789 or +639123456789).",
      });
      return;
    }

    // List of allowed/popular domains
    const allowedDomains = [
      "gmail.com",
      "yahoo.com",
      "outlook.com",
      "hotmail.com",
      "icloud.com",
      "aol.com",
      "protonmail.com",
      "live.com",
    ];

    const email = inq.customerEmail.trim();
    const emailParts = email.split("@");

    if (
      emailParts.length !== 2 ||
      !allowedDomains.includes(emailParts[1].toLowerCase())
    ) {
      setStatus({
        type: "error",
        message:
          "Please enter a valid email from a popular provider (e.g., Gmail, Yahoo, Outlook).",
      });
      return;
    }

    const MAX_MESSAGE_LENGTH = 500; // you can adjust this

    if (inq.message.trim().length < 10) {
      setStatus({
        type: "error",
        message: "Message should be at least 10 characters long.",
      });
      return;
    }

    if (inq.message.trim().length > MAX_MESSAGE_LENGTH) {
      setStatus({
        type: "error",
        message: `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters.`,
      });
      return;
    }
    if (!agree) {
      setStatus({
        type: "error",
        message: "You must agree before submitting your inquiry.",
      });
      return;
    }

    // Cooldown: block repeated requests for 10 seconds
    setInq((prev) => ({ ...prev, _cooldown: true }));
    setTimeout(() => setInq((prev) => ({ ...prev, _cooldown: false })), 10000);

    setStatus({ type: "info", message: "Sending your inquiry..." });

    try {
      await InquiriesAPI.submit({
        ...inq,
        firstName: inq.firstName.trim(),
        lastName: inq.lastName.trim(),
        customerEmail: inq.customerEmail.trim(),
        customerPhone: inq.customerPhone.trim() || "", // optional
        message: inq.message.trim(),
        propertyId,
      });

      setStatus({
        type: "success",
        message: "✅ Inquiry sent successfully! We’ll get back to you soon.",
      });
      // After successful submission
      setAgree(false);

      // Reset form
      setInq({
        inquiryType: "general",
        firstName: "",
        lastName: "",
        customerEmail: "",
        customerPhone: "",
        message: "",
      });

      setTimeout(() => setStatus(""), 5000);
    } catch (err) {
      setStatus({
        type: "error",
        message:
          err?.response?.data?.message ||
          "❌ Failed to send inquiry. Please try again later.",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Honeypot */}
      <input
        type="text"
        name="_honeypot"
        className="hidden"
        value={inq._honeypot || ""}
        onChange={(e) => setInq((s) => ({ ...s, _honeypot: e.target.value }))}
        autoComplete="off"
      />

      <div>
        <div className="mb-1 label">Inquiry Type</div>
        <select
          className="input"
          value={inq.inquiryType}
          onChange={(e) =>
            setInq((s) => ({ ...s, inquiryType: e.target.value }))
          }
        >
          <option value="general">General</option>
          <option value="pricing">Pricing</option>
          <option value="viewing">Scheduling of viewing</option>
          <option value="financing">Financing</option>
          <option value="others">Others</option>
        </select>
      </div>

      <input
        className="input"
        placeholder="First Name"
        value={inq.firstName}
        onChange={(e) => setInq((s) => ({ ...s, firstName: e.target.value }))}
      />
      <input
        className="input"
        placeholder="Last Name"
        value={inq.lastName}
        onChange={(e) => setInq((s) => ({ ...s, lastName: e.target.value }))}
      />
      <input
        className="input"
        type="email"
        placeholder="Email"
        value={inq.customerEmail}
        onChange={(e) =>
          setInq((s) => ({ ...s, customerEmail: e.target.value }))
        }
      />
      <input
        className="input"
        placeholder="Phone (optional)"
        value={inq.customerPhone}
        onChange={(e) =>
          setInq((s) => ({ ...s, customerPhone: e.target.value }))
        }
      />
      <textarea
        className="input min-h-32"
        placeholder="Message"
        value={inq.message}
        onChange={(e) => setInq((s) => ({ ...s, message: e.target.value }))}
      />

      <button
        className="w-full btn btn-primary"
        disabled={inq._cooldown}
        type="submit"
      >
        {inq._cooldown ? "Please wait..." : "Send Inquiry"}
      </button>

      {status?.message && (
        <div
          className={`text-sm text-center mt-2 p-2 rounded ${
            status.type === "success"
              ? "bg-green-100 text-green-700 border border-green-300"
              : status.type === "error"
              ? "bg-red-100 text-red-700 border border-red-300"
              : "bg-blue-100 text-blue-700 border border-blue-300"
          }`}
        >
          {status.message}
        </div>
      )}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="agree"
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
          className="w-4 h-4"
        />
        <label htmlFor="agree" className="text-sm text-neutral-700">
          I agree that my information and inquiry will be stored in the
          database.
        </label>
      </div>
    </form>
  );
}
