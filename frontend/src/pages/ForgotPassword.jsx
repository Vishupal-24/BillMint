import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { forgotPassword } from '../services/api.js';
import useForceLightMode from "../hooks/useForceLightMode";

const ForgotPassword = () => {
  useForceLightMode();
  const navigate = useNavigate();
  // We check if we came from Merchant or Customer login to know which role to reset
  const location = useLocation();
  const role = location.state?.role || 'customer'; // Default to customer

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSendCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await forgotPassword({ email, role });
      setMessage("Code sent! Redirecting...");
      setTimeout(() => {
        navigate('/reset-password', { state: { email, role } });
      }, 1500);
    } catch (err) {
      const message = err.response?.data?.message || "Could not find account.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 via-white to-green-50 min-h-screen flex items-center justify-center p-4 font-sans text-slate-900">
      <div className="w-full max-w-[400px]">
        <div className="bg-white rounded-[2rem] shadow-xl p-8 border border-slate-100 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>

          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">
            <i className="fas fa-key"></i>
          </div>

          <h2 className="text-xl font-bold text-slate-900 mb-2">Forgot Password?</h2>
          <p className="text-slate-500 text-sm mb-6">
            Enter your email and we will send you a reset code.
          </p>

          <form onSubmit={handleSendCode} className="space-y-4">
            {error && <div className="text-xs text-red-600 bg-red-50 p-2 rounded">{error}</div>}
            {message && <div className="text-xs text-emerald-700 bg-green-50 p-2 rounded">{message}</div>}

            <div className="text-left">
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1 ml-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                placeholder="name@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:-translate-y-0.5 transition-all disabled:opacity-60"
            >
              {loading ? 'Sending...' : 'Send Reset Code'}
            </button>
          </form>

          <div className="mt-6 text-sm">
            <Link to={role === 'merchant' ? "/merchant-login" : "/customer-login"} className="text-slate-400 hover:text-slate-600 font-medium">
              &larr; Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;