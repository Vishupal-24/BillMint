/**
 * OTP Utility for GreenReceipt
 * 
 * Provides secure OTP generation and hashing using crypto.
 * OTPs are never stored in plain text - always hashed before storage.
 */

import crypto from "crypto";

// OTP Configuration
export const OTP_CONFIG = {
  LENGTH: 6,                    // 6-digit OTP
  EXPIRY_MINUTES: 10,           // Valid for 10 minutes
  MAX_ATTEMPTS: 5,              // Max verification attempts
  RESEND_COOLDOWN_SECONDS: 60,  // Cooldown between resends
};

/**
 * Generate a cryptographically secure 6-digit numeric OTP
 * @returns {string} - 6-digit OTP as string (e.g., "123456")
 */
export const generateOtp = () => {
  // Generate random bytes and convert to a 6-digit number
  const randomBytes = crypto.randomBytes(4);
  const randomNumber = randomBytes.readUInt32BE(0);
  
  // Ensure we get exactly 6 digits (100000 to 999999)
  const otp = 100000 + (randomNumber % 900000);
  
  return otp.toString();
};

/**
 * Hash an OTP using SHA-256
 * @param {string} otp - Plain text OTP
 * @returns {string} - Hashed OTP (hex string)
 */
export const hashOtp = (otp) => {
  return crypto
    .createHash("sha256")
    .update(otp.toString())
    .digest("hex");
};

/**
 * Verify if a plain OTP matches its hash
 * @param {string} otp - Plain text OTP to verify
 * @param {string} hashedOtp - Stored hashed OTP
 * @returns {boolean} - True if OTP matches
 */
export const verifyOtp = (otp, hashedOtp) => {
  const inputHash = hashOtp(otp);
  return crypto.timingSafeEqual(
    Buffer.from(inputHash, "hex"),
    Buffer.from(hashedOtp, "hex")
  );
};

/**
 * Calculate OTP expiry timestamp
 * @param {number} minutes - Minutes until expiry (default: 10)
 * @returns {Date} - Expiry timestamp
 */
export const getOtpExpiry = (minutes = OTP_CONFIG.EXPIRY_MINUTES) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

/**
 * Check if OTP has expired
 * @param {Date} expiresAt - OTP expiry timestamp
 * @returns {boolean} - True if expired
 */
export const isOtpExpired = (expiresAt) => {
  if (!expiresAt) return true;
  return new Date() > new Date(expiresAt);
};

/**
 * Check if user can request a new OTP (cooldown check)
 * @param {Date} lastSentAt - Last OTP sent timestamp
 * @returns {{ canSend: boolean, waitSeconds: number }}
 */
export const canResendOtp = (lastSentAt) => {
  if (!lastSentAt) {
    return { canSend: true, waitSeconds: 0 };
  }
  
  const cooldownMs = OTP_CONFIG.RESEND_COOLDOWN_SECONDS * 1000;
  const elapsed = Date.now() - new Date(lastSentAt).getTime();
  
  if (elapsed >= cooldownMs) {
    return { canSend: true, waitSeconds: 0 };
  }
  
  return {
    canSend: false,
    waitSeconds: Math.ceil((cooldownMs - elapsed) / 1000),
  };
};
