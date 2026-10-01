import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaApple,
  FaArrowRight,
  FaCheck,
  FaGoogle,
  FaShieldAlt,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { apiUrl } from "../config/api";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    email: "demo@ecommerce.com",
    password: "demo123",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleDemoLogin = () => {
    const demoUser = {
      id: "demo-user",
      name: "Demo Shopper",
      email: "demo@ecommerce.com",
    };
    login({ user: demoUser, token: "demo-token" });
    navigate("/");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      login({ user: data.user, token: data.token });
      navigate("/");
    } catch (err) {
      if (form.email === "demo@ecommerce.com" && form.password === "demo123") {
        handleDemoLogin();
        return;
      }
      setError(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-6xl items-center justify-center px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid w-full overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[1.1fr_0.9fr]">
        <div className="hidden bg-gradient-to-br from-violet-600 via-indigo-600 to-sky-500 p-10 text-white md:flex md:flex-col md:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-100">
              Welcome back
            </div>
            <h1 className="mt-4 text-4xl font-black">Login to NovaCart</h1>
          </div>

          <div className="space-y-5 rounded-[24px] bg-white/10 p-5 backdrop-blur-sm">
            <div className="text-lg font-semibold">
              Your smart shopping dashboard
            </div>
            <div className="space-y-3 text-sm text-violet-100">
              {[
                "Track orders and wishlist in one place",
                "Get AI-powered product recommendations",
                "Fast checkout for premium essentials",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15">
                    <FaCheck className="text-xs" />
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-full bg-white/10 px-4 py-3 text-sm text-violet-100 backdrop-blur-sm">
            <FaShieldAlt /> Secure sign-in with your account
          </div>
        </div>

        <div className="p-8 sm:p-10">
          <div className="mb-8">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">
              Account access
            </div>
            <h2 className="mt-3 text-3xl font-black text-slate-900 dark:text-white">
              Sign in
            </h2>
          </div>

          <div className="mb-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-violet-300 hover:text-violet-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <FaGoogle /> Google
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-violet-300 hover:text-violet-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <FaApple /> Apple
            </button>
          </div>

          <div className="mb-6 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-400">
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            <span>or continue with email</span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Email
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none transition focus:border-violet-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs font-medium text-violet-600 hover:text-violet-500 dark:text-violet-300"
                >
                  Forgot password?
                </button>
              </div>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none transition focus:border-violet-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-violet-500 dark:text-slate-950 dark:hover:bg-violet-400"
            >
              {isLoading ? "Signing in..." : "Login"}
              {!isLoading && <FaArrowRight />}
            </button>

            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full rounded-full border border-violet-300 bg-violet-50 px-5 py-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-100 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-200"
            >
              Demo Login (demo@ecommerce.com / demo123)
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
