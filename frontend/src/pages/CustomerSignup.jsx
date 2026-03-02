// import React, { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { signupCustomer } from "../services/api.js";
// import { Receipt, Mail, Lock, Eye, EyeOff } from "lucide-react"; 

// const CustomerSignup = () => {
//   const navigate = useNavigate();
//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     password: "",
//     confirmPassword: "",
//   });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [info, setInfo] = useState("");
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleSignup = async (e) => {
//     e.preventDefault();
//     if (formData.password !== formData.confirmPassword) {
//       setError("Passwords do not match!");
//       return;
//     }
//     setLoading(true);
//     setError("");
//     setInfo("");
//     try {
//       await signupCustomer({
//         name: formData.name,
//         email: formData.email,
//         password: formData.password,
//         confirmPassword: formData.confirmPassword,
//       });
//       navigate("/verify-customer", { state: { email: formData.email } });
//     } catch (error) {
//       const message = error.response?.data?.message || "Signup failed";
//       setError(message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="bg-gradient-to-br from-slate-50 via-white to-green-50 min-h-screen flex items-center justify-center p-4 font-sans text-slate-900 relative">
//       {/* Back to Home Button */}
//       <Link
//         to="/"
//         className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md rounded-full text-sm font-bold text-slate-600 hover:text-emerald-600 hover:bg-white shadow-sm hover:shadow-md transition-all group"
//       >
//         <i className="fas fa-arrow-left group-hover:-translate-x-1 transition-transform"></i>
//         <span>Home</span>
//       </Link>

//       <div className="w-full max-w-[420px]">
//         {/* Header */}
//         <div className="text-center mb-8">
//           <div className="inline-flex items-center gap-2 mb-4">
//             <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white text-sm shadow-lg shadow-green-500/30">
//               <i className="fas fa-user-plus"></i>
//             </div>
//             <span className="text-xl font-bold text-slate-900">
//               GreenReceipt
//             </span>
//           </div>
//         </div>

//         {/* Signup Card */}
//         <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/60 p-8 md:p-10 border border-slate-100 relative overflow-hidden">
//           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 to-green-300"></div>

//           <h2 className="text-2xl font-bold text-slate-900 mb-2">
//             Create Account
//           </h2>
//           <p className="text-slate-500 text-sm mb-6">
//             Join us to go paperless today.
//           </p>

//           <form onSubmit={handleSignup} className="space-y-4">
//             {error && <div className="text-sm text-red-600">{error}</div>}
//             {info && <div className="text-sm text-emerald-700">{info}</div>}

//             {/* Full Name */}
//             <div>
//               <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1 ml-1">
//                 Full Name
//               </label>
//               <input
//                 name="name"
//                 type="text"
//                 required
//                 onChange={handleChange}
//                 className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
//                 placeholder="Your Name"
//               />
//             </div>

//             {/* Email */}
//             <div>
//               <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1 ml-1">
//                 Email
//               </label>
//               <input
//                 name="email"
//                 type="email"
//                 required
//                 onChange={handleChange}
//                 className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
//                 placeholder="you@example.com"
//               />
//               {/* 👁️ TOGGLE */}
//                 <button
//                   type="button"
//                   onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//                   className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
//                 >
//                   {showConfirmPassword ? (
//                     <EyeOff size={20} />
//                   ) : (
//                     <Eye size={20} />
//                   )}
//                 </button>
//             </div>

//             {/* Password */}
//             <div>
//               <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1 ml-1">
//                 Password
//                 <span className="font-normal normal-case text-slate-400 ml-2">
//                   (min. 6 characters)
//                 </span>
//               </label>
//               <input
//                 name="password"
//                 type="password"
//                 required
//                 onChange={handleChange}
//                 className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
//                 placeholder="••••••••"
//               />

//             </div>

//             {/* Confirm Password */}
//             <div>
//               <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1 ml-1">
//                 Confirm Password
//                 <span className="font-normal normal-case text-slate-400 ml-2">
//                   (min. 6 characters)
//                 </span>
//               </label>
//               <input
//                 name="confirmPassword"
//                 type="password"
//                 required
//                 onChange={handleChange}
//                 className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
//                 placeholder="••••••••"
//               />
//               {/* 👁️ TOGGLE */}
//                 <button
//                   type="button"
//                   onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//                   className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
//                 >
//                   {showConfirmPassword ? (
//                     <EyeOff size={20} />
//                   ) : (
//                     <Eye size={20} />
//                   )}
//                 </button>
//             </div>

//             <button
//               type="submit"
//               disabled={loading}
//               className="w-full py-3.5 mt-2 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:-translate-y-0.5 transition-all disabled:opacity-60"
//             >
//               {loading ? "Creating account..." : "Sign Up"}
//             </button>
//           </form>

//           {/* Toggle to Login */}
//           <div className="mt-6 pt-6 border-t border-slate-100 text-center">
//             <p className="text-sm text-slate-500">Already have an account?</p>
//             <Link
//               to="/customer-login"
//               className="inline-block mt-1 text-sm font-bold text-emerald-600 hover:text-green-700 transition-colors"
//             >
//               Log In here &rarr;
//             </Link>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CustomerSignup;


import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signupCustomer } from "../services/api.js";
import { User, Mail, Lock, Eye, EyeOff, ArrowLeft, UserPlus, Sparkles, ShieldCheck } from "lucide-react"; 
import useForceLightMode from "../hooks/useForceLightMode";
import GoogleLoginButton from "../components/auth/GoogleLoginButton";

const CustomerSignup = () => {
  useForceLightMode();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  
  // 👁️ VISIBILITY STATES
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }
    setLoading(true);
    setError("");
    setInfo("");
    try {
      await signupCustomer({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });
      navigate("/signup-success", { 
        state: { 
          userType: "customer",
          email: formData.email,
          name: formData.name 
        } 
      });
    } catch (error) {
      const message = error.response?.data?.message || "Signup failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-slate-50">
      
      {/* 🎨 Clean Background (Glow removed) */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-slate-50 via-white to-slate-100"></div>
      </div>

      {/* 🔙 Minimal Back Button */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 z-20 p-2 bg-white/80 backdrop-blur-md rounded-full shadow-sm text-slate-500 hover:text-emerald-600 hover:bg-white transition-all hover:scale-105 active:scale-95"
      >
        <ArrowLeft size={20} />
      </Link>

      {/* 📄 Main Card */}
      <div className="relative z-10 w-full max-w-[400px] bg-white/90 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 overflow-hidden animate-fade-in-up">
        
        {/* Top Decorative Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500"></div>

        <div className="p-6 md:p-8">
          
          {/* Header Section (Sparkle removed) */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-800">
              Join GreenReceipt
            </h1>
            <p className="text-slate-500 text-sm mt-1">Start your paperless journey today.</p>
          </div>

          {/* Social Sign Up */}
          <div className="mb-6">
            <GoogleLoginButton 
              onSuccess={() => navigate('/customer-dashboard')}
              onError={(e) => setError(e)}
            />
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
            <span className="relative bg-white/50 backdrop-blur-sm px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Or continue with email
            </span>
          </div>

          {/* 📝 Form Section */}
          <form onSubmit={handleSignup} className="space-y-4">
            
            {error && (
              <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs font-medium text-center border border-red-100 animate-shake">
                {error}
              </div>
            )}

            <div className="space-y-3">
              {/* Name Input */}
              <div className="group relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                <input
                  name="name"
                  type="text"
                  placeholder="Full Name"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-slate-400"
                  onChange={handleChange}
                />
              </div>

              {/* Email Input */}
              <div className="group relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                <input
                  name="email"
                  type="email"
                  placeholder="Email Address"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-slate-400"
                  onChange={handleChange}
                />
              </div>

              {/* Password Group */}
              <div className="space-y-3">
                <div className="group relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create Password"
                    required
                    className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-slate-400"
                    onChange={handleChange}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <div className="group relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    required
                    className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-slate-400"
                    onChange={handleChange}
                  />
                   <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                  <span>Creating Account...</span>
                </div>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              Already have an account?{" "}
              <Link to="/customer-login" className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors underline decoration-emerald-200 underline-offset-2">
                Log In
              </Link>
            </p>
          </div>
          
        </div>
      </div>

      {/* Optional CSS for animations if you don't have them globally */}
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default CustomerSignup;