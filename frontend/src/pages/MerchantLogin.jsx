import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Mail, Lock, Eye, EyeOff, Briefcase, ArrowRight, Store, ArrowLeft, ShieldAlert } from "lucide-react";
import useForceLightMode from "../hooks/useForceLightMode";
import GoogleLoginButton from "../components/auth/GoogleLoginButton";

const MerchantLogin = () => {
  useForceLightMode();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [roleMismatch, setRoleMismatch] = useState(null); // { actualRole, message }

  // 👁️ VISIBILITY STATE
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setRoleMismatch(null);
    try {
      await login(email, password, "merchant");
      // Always go to overview - MerchantDashboard will handle onboarding redirect
      navigate('/merchant/overview');
    } catch (err) {
      const responseData = err.response?.data;
      if (responseData?.code === "ROLE_MISMATCH") {
        setRoleMismatch({
          actualRole: responseData.actualRole,
          message: responseData.message,
        });
      } else {
        setError(responseData?.message || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-slate-100">
      
      {/* 🎨 Professional Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-slate-100 to-slate-200"></div>
        {/* Abstract business shape */}
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-slate-300/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
      </div>

      {/* 🔙 Minimal Back Button */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 z-20 p-2 bg-white/80 backdrop-blur-md rounded-full shadow-sm text-slate-500 hover:text-slate-900 hover:bg-white transition-all hover:scale-105 active:scale-95"
      >
        <ArrowLeft size={20} />
      </Link>

      {/* 🏢 Main Card */}
      <div className="relative z-10 w-full max-w-[420px] bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white/60 overflow-hidden animate-fade-in-up">
        
        {/* Top Decorative Line */}
        <div className="h-1.5 w-full bg-slate-800"></div>

        <div className="p-8 md:p-10">
          
          {/* Header Section */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex flex-col items-center gap-2 group">
              <div className="inline-flex items-center gap-2">
                <span className="bg-slate-200 p-2 rounded-xl text-slate-700 group-hover:bg-slate-300 transition-colors shadow-sm">
                  <Store size={20} />
                </span>
                <span className="text-2xl font-bold text-slate-800 tracking-tight">GreenReceipt</span>
              </div>
              <div className="px-3 py-1 bg-slate-800 text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg shadow-slate-800/20">
                Merchant Portal
              </div>
            </Link>
            <p className="text-slate-500 text-sm mt-4">Welcome back. Manage your digital store.</p>
          </div>

          {/* ⚠️ Role Mismatch Banner */}
          {roleMismatch && (
            <div className="mb-6 bg-emerald-50 border border-emerald-100 rounded-2xl p-4 animate-fade-in">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-100 rounded-full text-emerald-600 shrink-0">
                  <ShieldAlert size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-900 mb-1">Wrong Portal</h4>
                  <p className="text-xs text-emerald-700 mb-3 leading-relaxed">
                    {roleMismatch.message}
                  </p>
                  <Link
                    to="/customer-login"
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-all shadow-sm hover:shadow-emerald-500/30"
                  >
                    Go to Customer Login <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs font-medium text-center border border-red-100 animate-shake">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Email Field */}
              <div className="group relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-800 transition-colors" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Business Email"
                  className="w-full pl-10 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-slate-800 focus:ring-4 focus:ring-slate-800/5 transition-all placeholder:text-slate-400 text-slate-800 shadow-sm"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <div className="group relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-800 transition-colors" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full pl-10 pr-12 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-slate-800 focus:ring-4 focus:ring-slate-800/5 transition-all placeholder:text-slate-400 text-slate-800 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className="flex justify-end">
                  <Link
                    to="/forgot-password"
                    state={{ role: "merchant" }}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    Forgot Password?
                  </Link>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-slate-800 text-white font-bold rounded-xl shadow-lg shadow-slate-800/20 hover:shadow-slate-800/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                 <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                  <span>Verifying Credentials...</span>
                </div>
              ) : "Access Dashboard"}
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
              <span className="relative bg-white/50 backdrop-blur-sm px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Or continue with
              </span>
            </div>

            {/* Google Login */}
            <GoogleLoginButton
              role="merchant"
              onSuccess={(data) => navigate('/merchant/overview')}
              onError={(err) => {
                if (err.code === "ROLE_MISMATCH") {
                  setRoleMismatch({
                    actualRole: err.error?.response?.data?.actualRole,
                    message: err.message,
                  });
                } else {
                  setError(err.message);
                }
              }}
            />
          </form>

          {/* Footer Links */}
          <div className="mt-8 pt-6 border-t border-slate-100 space-y-4 text-center">
            
            <p className="text-sm text-slate-600">
              New business?{" "}
              <Link to="/merchant-signup" className="font-bold text-slate-900 hover:underline decoration-slate-400 underline-offset-2">
                Register here
              </Link>
            </p>

            <div className="inline-block bg-slate-50 px-4 py-2 rounded-full">
              <p className="text-xs text-slate-500 flex items-center gap-1">
                Looking for receipts? 
                <Link to="/customer-login" className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
                  Customer Login &rarr;
                </Link>
              </p>
            </div>
          </div>
          
        </div>
      </div>

      {/* Animation Styles */}
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </div>
  );
};

export default MerchantLogin;