import React, { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../../contexts/AuthContext";
import * as api from "../../services/api";

/**
 * Google Login Button Component
 * 
 * Handles Google Sign-In flow:
 * 1. User clicks the Google button
 * 2. Google popup authenticates user
 * 3. Frontend receives ID token
 * 4. Backend verifies token and issues session
 * 
 * @param {Object} props
 * @param {string} props.role - User role: "customer" or "merchant"
 * @param {function} props.onSuccess - Callback after successful login
 * @param {function} props.onError - Callback after failed login
 * @param {string} props.buttonText - Custom button text
 */
const GoogleLoginButton = ({ 
  role = "customer", 
  onSuccess, 
  onError,
  buttonText = "Continue with Google",
  className = ""
}) => {
  const { handleVerification } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError(null);

    try {
      // Send Google credential to backend
      const response = await api.googleAuth({
        credential: credentialResponse.credential,
        role,
      });

      // Store session using the auth context
      api.setSession({
        accessToken: response.data.accessToken,
        expiresIn: response.data.expiresIn,
        role: response.data.role,
        user: response.data.user,
        isProfileComplete: response.data.user?.isProfileComplete,
      });

      // Update auth context
      handleVerification(response.data);

      // Call success callback
      if (onSuccess) {
        onSuccess(response.data);
      }
    } catch (err) {
      console.error("Google auth error:", err);
      
      const errorMessage = err.response?.data?.message || "Google sign-in failed";
      const errorCode = err.response?.data?.code;
      
      setError(errorMessage);
      
      if (onError) {
        onError({ message: errorMessage, code: errorCode, error: err });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    const errorMessage = "Google sign-in was cancelled or failed";
    setError(errorMessage);
    
    if (onError) {
      onError({ message: errorMessage, code: "GOOGLE_POPUP_CLOSED" });
    }
  };

  return (

<div className={`google-login-container w-full flex flex-col items-center gap-3 ${className}`}>
  
  {/* Error Message */}
  {error && (
    <div className="w-full px-4 py-2.5 bg-red-50 border border-red-100 text-red-600 text-sm font-medium rounded-2xl shadow-sm text-center flex items-center justify-center gap-2 animate-fade-in">
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {error}
    </div>
  )}

  {loading ? (
    // LOADING STATE: Matches the new short/pill dimensions
    <div className="w-[230px] h-[40px] flex items-center justify-center gap-3 bg-white border border-slate-200 rounded-full shadow-md cursor-wait transition-all">
      <div className="relative flex h-4 w-4">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-4 w-4 border-2 border-slate-300 border-t-slate-600 animate-spin"></span>
      </div>
      <span className="text-xs font-bold tracking-wide text-slate-600 animate-pulse">
        Signing in...
      </span>
    </div>
  ) : (
    // GOOGLE BUTTON WRAPPER
    // 1. w-fit + mx-auto: Centers the button and shrinks it to be "short"
    // 2. shadow-md: Adds the custom shadow you asked for
    // 3. rounded-full + overflow-hidden: Enforces the smooth curve
    <div className="w-fit mx-auto rounded-full shadow-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 relative overflow-hidden bg-white">
      
      {/* Optional: Subtle background hover effect */}
      <div className="absolute inset-0 bg-white hover:bg-slate-50 transition-colors duration-200 -z-10"></div>

      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        text="continue_with"
        shape="pill"
        theme="outline"
        size="large"
        width="200"            /* Forces the "short" length (~230px brings logo & text closer) */
        logo_alignment="center"
        useOneTap={false}
        locale="en"            /* Ensures text is consistent */
      />
    </div>
  )}
</div>
  );
};

export default GoogleLoginButton;