import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { requestOtp, verifyOtpCode } from '../services/api.js';
import useForceLightMode from "../hooks/useForceLightMode";

const MerchantVerify = () => {
  useForceLightMode();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "business email";

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;
    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);
    if (element.nextSibling && element.value) {
      element.nextSibling.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const code = otp.join("");

    if (code.length < 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }

    if (!email) {
      setError("Missing email. Go back to sign up and try again.");
      return;
    }

    setLoading(true);
    setError('');
    setInfo('');

    try {
      await verifyOtpCode({ email, code, role: 'merchant' });
      toast.success("Verification Successful! Please log in.");
      navigate('/merchant-login');
    } catch (error) {
      const message = error.response?.data?.message || "Invalid Code. Try again.";
      setError(message);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError('Missing email. Go back to sign up and try again.');
      return;
    }
    setResending(true);
    setError('');
    setInfo('');
    try {
      await requestOtp({ email, role: 'merchant' });
      setInfo('New code sent to your email.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not resend code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 via-white to-slate-200 min-h-screen flex items-center justify-center p-4 font-sans text-slate-900">
      <div className="w-full max-w-[420px]">
        
        <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-300/60 p-8 md:p-10 border border-slate-100 relative overflow-hidden text-center">
          <div className="absolute top-0 left-0 w-full h-1 bg-slate-900"></div>

          <div className="w-16 h-16 bg-slate-100 text-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
            <i className="fas fa-lock"></i>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-2">Merchant Verification</h2>
          <p className="text-slate-500 text-sm mb-4">
            Enter the OTP sent to <span className="font-bold text-slate-700">{email}</span>.
          </p>
          {error && <div className="text-sm text-red-600 mb-4">{error}</div>}
          {info && <div className="text-sm text-emerald-700 mb-4">{info}</div>}

          <form onSubmit={handleVerify}>
            <div className="flex justify-center gap-2 mb-8">
              {otp.map((data, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength="1"
                  className="w-10 h-12 border-2 border-slate-200 rounded-lg text-center text-xl font-bold focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300 transition-all bg-slate-50 text-slate-900"
                  value={data}
                  onChange={(e) => handleChange(e.target, index)}
                  onFocus={(e) => e.target.select()}
                />
              ))}
            </div>

            <button type="submit" disabled={loading} className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg shadow-slate-900/20 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-60">
              {loading ? 'Verifying...' : 'Verify Business'}
            </button>
          </form>

          <div className="mt-8 text-sm text-slate-500">
            Issue with code? <br />
            <button type="button" onClick={handleResend} disabled={resending} className="font-bold text-slate-900 hover:underline mt-2 disabled:opacity-60">
              {resending ? 'Sending...' : 'Resend Code'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantVerify;
