import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function VerifyEmail() {
  const { verifyEmail, resendOtp } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || new URLSearchParams(location.search).get("email") || "";
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (!email) navigate("/admin/login"); }, [email]);

  async function onVerify(e) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try { await verifyEmail({ email, otp }); setStatus("Verified! Redirecting to login..."); setTimeout(() => navigate("/admin/login"), 1200); }
    catch (e2) { setStatus(e2?.response?.data?.message || "Verification failed"); }
    finally { setLoading(false); }
  }

  async function onResend() {
    try { await resendOtp(email); setStatus("OTP resent. Check your inbox or backend logs."); }
    catch { setStatus("Failed to resend OTP."); }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <form onSubmit={onVerify} className="w-full max-w-sm p-8 space-y-4 card">
        <h2 className="text-2xl font-semibold text-center">Verify Email</h2>
        <p className="text-sm text-center text-neutral-600">Enter the OTP sent to <strong>ADMIN</strong></p>
        <input className="tracking-widest text-center input" placeholder="OTP Code" value={otp} onChange={(e) => setOtp(e.target.value)} required />
        <button className="w-full btn btn-primary" disabled={loading}>{loading ? "Verifying..." : "Verify"}</button>
        <button className="w-full btn btn-outline" type="button" onClick={onResend}>Resend OTP</button>
        {status && <div className="text-sm text-center">{status}</div>}
      </form>
    </div>
  );
}