import React, { useState } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, ShieldAlert, Sparkles, Receipt, ArrowRight} from "lucide-react"; // 👈 Used Lucide for consistent icons
import useForceLightMode from "../hooks/useForceLightMode";
import GoogleLoginButton from "../components/auth/GoogleLoginButton";

const CustomerLogin = () => {
  useForceLightMode();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [roleMismatch, setRoleMismatch] = useState(null); // { actualRole, message }

  // 👁️ VISIBILITY STATE
  const [showPassword, setShowPassword] = useState(false);
  
  // Get return URL from location state or query params (for redirecting after payment QR scan)
  const returnTo = location.state?.returnTo || searchParams.get('redirect');
  const isKhataRedirect = searchParams.get('khata') === 'true';

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setRoleMismatch(null);
    try {
      await login(email, password, "customer");
      
      // Redirect to return URL if provided (e.g., /pay/:billId), otherwise dashboard
      if (returnTo) {
        // If coming from khata flow, add showKhataApproval param to trigger approval screen
        const redirectUrl = isKhataRedirect 
          ? `${returnTo}${returnTo.includes('?') ? '&' : '?'}showKhataApproval=true` 
          : returnTo;
        navigate(redirectUrl);
      } else {
        navigate("/customer-dashboard");
      }
    } catch (error) {
      const responseData = error.response?.data;
      if (responseData?.code === "ROLE_MISMATCH") {
        setRoleMismatch({
          actualRole: responseData.actualRole,
          message: responseData.message,
        });
      } else {
        const message = responseData?.message || "Login failed";
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden font-sans">
      
      {/* 🎨 Mesmerizing Animated Background */}
      <div className="absolute inset-0 bg-slate-50 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-400/20 rounded-full blur-[120px] animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-400/20 rounded-full blur-[120px] animate-blob animation-delay-2000"></div>
        <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] bg-blue-400/10 rounded-full blur-[100px] animate-blob animation-delay-4000"></div>
        {/* Fine mesh pattern overlay for texture */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      </div>

      {/* 🔙 Floating Back Button */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 z-20 p-2.5 bg-white/70 backdrop-blur-md rounded-full text-slate-500 hover:text-emerald-600 hover:bg-white shadow-sm hover:shadow-md transition-all duration-300 group"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform"/>
      </Link>

      {/* 💎 Main Glass Card */}
      <div className="relative z-10 w-full max-w-[400px] bg-white/70 backdrop-blur-2xl rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-white/50 overflow-hidden animate-fade-in-up">
        
        {/* Content Container */}
        <div className="px-8 py-10">
          
          {/* Header: Logo & Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 mb-4 animate-float">
              <Receipt size={24} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight mb-1">Welcome Back</h1>
            <p className="text-slate-500 text-sm font-medium">Log in to manage your receipts</p>
          </div>

          {/* ⚠️ Role Mismatch Error */}
          {roleMismatch && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-100/50 flex flex-col gap-2 animate-fade-in">
              <div className="flex items-center gap-2 text-amber-700 font-bold text-xs uppercase tracking-wide">
                <ShieldAlert size={14} /> Account Warning
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                {roleMismatch.message}
              </p>
              <Link to="/merchant-login" className="text-xs font-bold text-slate-800 hover:text-black underline decoration-slate-300 underline-offset-2 self-start">
                Switch to Merchant Portal &rarr;
              </Link>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 text-red-500 text-xs font-bold text-center border border-red-100 animate-shake">
                {error}
              </div>
            )}

            {/* Input Group: Compact & Clean */}
            <div className="space-y-4">
              <div className="group relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm"
                />
              </div>

              <div className="group relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-11 pr-11 py-3.5 bg-white/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              <div className="flex justify-end">
                <Link 
                  to="/forgot-password" 
                  state={{ role: "customer" }}
                  className="text-xs font-semibold text-slate-500 hover:text-emerald-600 transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>

            {/* Main Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-xl"></div>
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} className="opacity-70 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200/60"></div></div>
              <span className="relative bg-white/40 backdrop-blur-sm px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Or
              </span>
            </div>

            {/* Google Login - Centered & Symmetric */}
            <div className="flex justify-center">
              <GoogleLoginButton
                role="customer"
                onSuccess={(data) => {
                  if (returnTo) navigate(returnTo);
                  else navigate("/customer-dashboard");
                }}
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
            </div>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center space-y-4">
            <p className="text-sm text-slate-600">
              Don't have an account?{" "}
              <Link to="/customer-signup" className="font-bold text-emerald-600 hover:text-teal-600 transition-colors hover:underline decoration-emerald-200 underline-offset-4">
                Sign up for free
              </Link>
            </p>
            
            <div className="pt-4 border-t border-slate-100">
              <Link to="/merchant-login" className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center gap-1">
                Are you a Merchant? <ArrowRight size={12} />
              </Link>
            </div>
          </div>
          
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};

export default CustomerLogin;