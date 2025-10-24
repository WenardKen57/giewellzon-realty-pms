import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Register() {
  const { register: reg, handleSubmit } = useForm();
  const { register: doRegister } = useAuth();
  const nav = useNavigate();

  async function onSubmit(values) {
    try {
      const r = await doRegister(values); // calls /api/auth/register via AuthContext -> AuthAPI
      // If admin-only OTP flow is enabled, show info and redirect to login
      alert(r?.message || "Registered. Check email or wait for admin approval.");
      // If your flow sends OTP only to admins, go to login:
      nav("/admin/login");
      // If your flow sends OTP to the registrant, you can instead:
      // nav(`/verify-email?email=${encodeURIComponent(values.email)}`, { state: { email: values.email } });
    } catch (e) {
      alert(e?.response?.data?.message || "Registration failed");
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md p-8 space-y-4 card">
        <h2 className="text-2xl font-semibold text-center">Register Admin</h2>
        <div><label className="label">Username</label><input className="input" {...reg("username", { required: true })} /></div>
        <div><label className="label">Email</label><input className="input" type="email" {...reg("email", { required: true })} /></div>
        <div><label className="label">Full Name</label><input className="input" {...reg("fullName")} /></div>
        <div><label className="label">Password</label><input className="input" type="password" {...reg("password", { required: true })} /></div>
        <button className="w-full btn btn-primary">Register</button>
        <div className="text-sm text-center">
          Have an account? <Link to="/admin/login" className="text-brand-primary hover:underline">Login</Link>
        </div>
      </form>
    </div>
  );
}