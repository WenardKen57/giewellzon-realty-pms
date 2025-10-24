import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const { register, handleSubmit } = useForm();
  const { login } = useAuth();
  const nav = useNavigate();

  async function onSubmit(values) {
    try {
      await login(values);
      nav("/admin/dashboard");
    } catch (e) {
      alert(e?.response?.data?.message || "Login failed");
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-gray-50">
      {/* LEFT SIDE */}
      <div className="flex flex-col justify-center bg-brand-primary text-white p-10">
        <div className="max-w-md mx-auto space-y-6">
          <h1 className="text-4xl font-bold">Welcome Back!</h1>
          <p className="text-white/90 text-lg">
            GIEWELLZON Realty — your trusted partner in finding your dream home.
          </p>
          <div className="h-1 w-20 bg-white/60 rounded-full"></div>
          <p className="text-sm text-white/70 mt-4">
            Admin access only. Please log in to continue.
          </p>
        </div>
        {/* Subtle footer note */}
        <div className="mt-auto text-xs text-center text-white/70 pt-10">
          © 2025 GIEWELLZON Realty. All rights reserved.
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center justify-center bg-white shadow-inner">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="w-full max-w-md p-8 space-y-5"
        >
          <h2 className="text-3xl font-bold text-center text-brand-primary">
            Admin Login
          </h2>
          <p className="text-sm text-center text-gray-500">
            Sign in to manage your properties and clients
          </p>

          <div>
            <label className="label text-gray-700">Username or Email</label>
            <input
              className="input border-gray-300"
              {...register("emailOrUsername", { required: true })}
              placeholder="Username or Email"
            />
          </div>
          <div>
            <label className="label text-gray-700">Password</label>
            <input
              className="input border-gray-300"
              type="password"
              {...register("password", { required: true })}
              placeholder="Password"
            />
          </div>

          <button className="w-full btn btn-primary">Login Now</button>

          <div className="flex items-center justify-between pt-3 text-sm">
            <Link
              to="/admin/forgot-password"
              className="text-brand-primary hover:underline"
            >
              Forgot password?
            </Link>
            <Link
              to="/admin/register"
              className="text-brand-primary hover:underline"
            >
              Create an account
            </Link>
          </div>

          {/* Decorative or informational footer */}
          <div className="pt-8 text-center text-xs text-gray-400">
            Need help? Contact{" "}
            <a
              href="mailto:support@giewellzon.com"
              className="underline hover:text-brand-primary"
            >
              support@giewellzon.com
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
