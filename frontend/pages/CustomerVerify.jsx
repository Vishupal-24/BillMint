import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { requestOtp, verifyOtpCode } from '../services/api.js';

const CustomerVerify = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  
  // ⏱️ TIMER STATES
  const [timer, setTimer] = useState(30); 
  const [resending, setResending] = useState(false);
  
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  // 1. CLOCK LOGIC: Decrement timer every second
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

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
      setError("Please enter a valid 6-digit code.");
      return;
    }
    setLoading(true);
    setError('');
    setInfo('');

    try {
      await verifyOtpCode({ email, code, role: 'customer' });
      alert("Verification Successful! Please log in.");
      navigate('/customer-login');
    } catch (error) {
      const message = error.response?.data?.message || "Invalid Code. Try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // 2. RESEND LOGIC
  const handleResend = async () => {
    if (timer > 0) return; // Prevent clicking if time is left
    
    setResending(true);
    setError('');
    setInfo('');

    try {
      await requestOtp({ email, role: 'customer' });
      setInfo('New code sent successfully!');
      setTimer(30);
    } catch (err) {
      const message = err.response?.data?.message || 'Could not resend code.';
      setError(message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 via-white to-green-50 min-h-screen flex items-center justify-center p-4 font-sans text-slate-900">
      <div className="w-full max-w-[420px]">
        <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/60 p-8 md:p-10 border border-slate-100 relative overflow-hidden text-center">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 to-green-300"></div>

          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
            <i className="fas fa-shield-alt"></i>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-2">Verify your Email</h2>
          <p className="text-slate-500 text-sm mb-4">
            We sent a code to <span className="font-bold text-slate-700">{email}</span>.
          </p>
          
          {error && <div className="text-sm text-red-600 mb-4 bg-red-50 p-2 rounded">{error}</div>}
          {info && <div className="text-sm text-emerald-700 mb-4 bg-green-50 p-2 rounded">{info}</div>}

          <form onSubmit={handleVerify}>
            <div className="flex justify-center gap-2 mb-8">
              {otp.map((data, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength="1"
                  className="w-10 h-12 border-2 border-slate-200 rounded-lg text-center text-xl font-bold focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-all bg-slate-50"
                  value={data}
                  onChange={(e) => handleChange(e.target, index)}
                  onFocus={(e) => e.target.select()}
                />
              ))}
            </div>

            <button type="submit" disabled={loading} className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? 'Verifying...' : 'Verify Account'}
            </button>
          </form>

          <div className="mt-8 text-sm text-slate-500">
            Didn't receive code? <br />
            
            {/* 3. UPDATED RESEND BUTTON */}
            <button 
              type="button" 
              onClick={handleResend} 
              disabled={timer > 0 || resending} 
              className="mt-2 font-bold text-emerald-600 hover:underline disabled:text-slate-400 disabled:no-underline disabled:cursor-not-allowed transition-colors"
            >
              {resending 
                ? 'Sending...' 
                : timer > 0 
                  ? `Resend Code in ${timer}s` 
                  : 'Resend Code'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerVerify;
