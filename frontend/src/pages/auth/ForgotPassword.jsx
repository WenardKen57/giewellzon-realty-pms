import { useState } from "react";
import AuthAPI from "../../api/auth";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  async function submit(e) {
    e.preventDefault();
    setStatus("");
    try { await AuthAPI.forgot(email); setStatus("If the email exists, a reset link was sent."); }
    catch (e2) { setStatus(e2?.response?.data?.message || "Failed to request reset"); }
  }
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <form onSubmit={submit} className="w-full max-w-md p-8 space-y-4 card">
        <h2 className="text-2xl font-semibold text-center">Forgot Password</h2>
        <input className="input" type="email" placeholder="Email" value={email} onChange={(e)=> setEmail(e.target.value)} required />
        <button className="w-full btn btn-primary">Send Reset Link</button>
        {status && <div className="text-sm text-center">{status}</div>}
      </form>
    </div>
  );
}