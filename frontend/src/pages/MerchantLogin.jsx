import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, setSession } from "../services/api.js";

const MerchantLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await loginUser({ email, password, role: "merchant" });
      setSession({ token: data.token, role: data.role });
      navigate("/merchant-dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 via-white to-slate-200 min-h-screen flex items-center justify-center p-4 font-sans text-slate-900">
      <div className="w-full max-w-[420px]">
        {/* Header / Logo */}
        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 mb-4 hover:opacity-80 transition"
          >
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white text-sm shadow-lg shadow-slate-500/30">
              <i className="fas fa-store"></i>
            </div>
            <span className="text-xl font-bold text-slate-900">
              GreenReceipt
            </span>
          </Link>
          <div className="inline-block px-3 py-1 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-full mt-2 ml-2">
            Merchant Portal
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-300/60 p-8 md:p-10 border border-slate-100 relative overflow-hidden">
          {/* Decorative Top Bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-slate-900"></div>

          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Merchant Login
          </h2>
          <p className="text-slate-500 text-sm mb-8">
            Generate receipts and manage store locations.
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && <div className="text-sm text-red-600">{error}</div>}
            <div>
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 ml-1">
                Business Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <i className="fas fa-briefcase text-slate-400"></i>
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/30 focus:bg-white transition-all placeholder-slate-400"
                  placeholder="admin@business.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 ml-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <i className="fas fa-lock text-slate-400"></i>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/30 focus:bg-white transition-all placeholder-slate-400"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex justify-end mt-2">
              <Link
                to="/forgot-password"
                state={{ role: "merchant" }} // 👈 THIS IS THE MAGIC KEY
                className="text-xs font-semibold text-slate-900 hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg shadow-slate-900/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 text-sm tracking-wide disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Access Dashboard"}
            </button>

            {/* Inside MerchantLogin.jsx form */}

            {/* NEW LINK BELOW BUTTON */}
            <div className="text-center mt-4">
              <span className="text-xs text-slate-400">
                Registering a new business?{" "}
              </span>
              <Link
                to="/merchant-signup"
                className="text-xs font-bold text-slate-900 hover:underline"
              >
                Sign Up
              </Link>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">Not a merchant?</p>
            <Link
              to="/customer-login"
              className="inline-block mt-1 text-sm font-bold text-emerald-600 hover:text-green-700 transition-colors"
            >
              &larr; Switch to Customer Login
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-8">
          &copy; 2025 GreenReceipt. Merchant Services.
        </p>
      </div>
    </div>
  );
};

export default MerchantLogin;
