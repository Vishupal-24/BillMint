import express from "express";
import rateLimit from "express-rate-limit";
import {
	login,
	registerCustomer,
	registerMerchant,
	requestOtp,
	verifyEmail,
	verifyOtp,
	forgotPassword,
  	resetPassword,
	sendSignupOtp,
	verifySignupOtp,
	getProfile,
	updateProfile,
	changePassword,
	deleteAccount,
	refreshAccessToken,
	logout,
	logoutAll,
	getSession,
} from "../controllers/authController.js";
import { googleAuth, googleAuthStatus } from "../controllers/googleAuthController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import {
	loginSchema,
	customerSignupSchema,
	merchantSignupSchema,
	otpRequestSchema,
	otpVerifySchema,
	forgotPasswordSchema,
	resetPasswordSchema,
	sendSignupOtpSchema,
	verifySignupOtpSchema,
	updateProfileSchema,
	changePasswordSchema,
} from "../validators/authSchemas.js";

const router = express.Router();

const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 100,
	standardHeaders: true,
	legacyHeaders: false,
});

const otpLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 5,
	standardHeaders: true,
	legacyHeaders: false,
});

// Tighter limit for token refresh
const refreshLimiter = rateLimit({
	windowMs: 60 * 1000, // 1 minute
	max: 10, // 10 refresh attempts per minute
	standardHeaders: true,
	legacyHeaders: false,
});

router.use(authLimiter);


// NEW: OTP-based Email Verification Flow
// Step 1: Send OTP to email before signup
router.post("/send-signup-otp", otpLimiter, validate(sendSignupOtpSchema), sendSignupOtp);
// Step 2: Verify OTP and complete signup
router.post("/verify-signup-otp", otpLimiter, validate(verifySignupOtpSchema), verifySignupOtp);

// Legacy direct signup routes (auto-verified, no OTP)
router.post("/signup/customer", validate(customerSignupSchema), registerCustomer);
router.post("/signup/merchant", validate(merchantSignupSchema), registerMerchant);

// Login
router.post("/login", validate(loginSchema), login);

// Google OAuth
router.post("/google", googleAuth);
router.get("/google/status", googleAuthStatus);

// Legacy OTP routes (kept for backward compatibility)
router.post("/otp/request", otpLimiter, validate(otpRequestSchema), requestOtp);
router.post("/otp/verify", otpLimiter, validate(otpVerifySchema), verifyOtp);
router.get("/verify/:token", verifyEmail);

// Password Reset Flow (OTP-based)

router.post('/forgot-password', otpLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', otpLimiter, validate(resetPasswordSchema), resetPassword);

// Token refresh (uses cookie, no access token needed)
router.post('/refresh', refreshLimiter, refreshAccessToken);

// Logout (public)
router.post('/logout', logout);

// Session check (protected)
router.get('/session', protect, getSession);

// Profile routes (protected)
router.get('/me', protect, getProfile);
router.patch('/me', protect, validate(updateProfileSchema), updateProfile);
router.post('/change-password', protect, validate(changePasswordSchema), changePassword);
router.delete('/me', protect, deleteAccount);

// Logout all devices (protected)
router.post('/logout-all', protect, logoutAll);

export default router;
