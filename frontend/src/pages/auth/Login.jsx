import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const { register, handleSubmit } = useForm();
  const { login } = useAuth();
  const nav = useNavigate();

  async function onSubmit(values) {
    try { await login(values); nav("/admin/dashboard"); }
    catch (e) { alert(e?.response?.data?.message || "Login failed"); }
  }

  return (
    <div className="min-h-[80vh] grid lg:grid-cols-2">
      <div className="flex items-center justify-center text-white bg-brand-primary">
        <div className="max-w-md p-8">
          <div className="p-6 mb-6 bg-white/10 rounded-xl">GIEWELLZON Realty</div>
          <h1 className="mb-4 text-4xl font-bold">Your dream home starts here.</h1>
          <p className="opacity-90">Sign in for admin only</p>
        </div>
      </div>
      <div className="flex items-center justify-center">
        <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md p-8 space-y-4 card">
          <h2 className="text-3xl font-semibold text-center">LOGIN</h2>
          <p className="text-sm text-center">Login as Admin</p>
          <div>
            <label className="label">Username or Email</label>
            <input className="input" {...register("emailOrUsername", { required: true })} placeholder="Username or Email" />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" {...register("password", { required: true })} placeholder="Password" />
          </div>
          <button className="w-full btn btn-primary">Login Now</button>

          <div className="flex items-center justify-between pt-2 text-sm">
            <Link to="/admin/forgot-password" className="text-brand-primary hover:underline">Forgot password?</Link>
            <Link to="/admin/register" className="text-brand-primary hover:underline">Create an account</Link>
          </div>
        </form>
      </div>
    </div>
  );
}