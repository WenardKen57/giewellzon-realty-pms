import { useState } from "react";
import AuthAPI from "../../api/auth";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function ResetPassword() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const [newPassword, setNP] = useState("");
  const email = sp.get("email") || "";
  const token = sp.get("token") || "";
  const [status, setStatus] = useState("");

  async function submit(e) {
    e.preventDefault();
    try { await AuthAPI.reset({ email, token, newPassword }); setStatus("Password updated! Redirecting..."); setTimeout(()=> nav("/admin/login"), 1200); }
    catch (e2) { setStatus(e2?.response?.data?.message || "Failed to reset"); }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <form onSubmit={submit} className="w-full max-w-md p-8 space-y-4 card">
        <h2 className="text-2xl font-semibold text-center">Reset Password</h2>
        <input className="input" type="password" placeholder="New password" value={newPassword} onChange={(e)=> setNP(e.target.value)} required />
        <button className="w-full btn btn-primary">Reset</button>
        {status && <div className="text-sm text-center">{status}</div>}
      </form>
    </div>
  );
}