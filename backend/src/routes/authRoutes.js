import express from "express";
import rateLimit from "express-rate-limit";
import {
	login,
	registerCustomer,
	registerMerchant,
	requestOtp,
	verifyEmail,
	verifyOtp,
	forgotPassword, // <--- Import the new function
  	resetPassword   // <--- Import the new function
} from "../controllers/authController.js";
import { validate } from "../middleware/validate.js";
import {
	loginSchema,
	customerSignupSchema,
	merchantSignupSchema,
	otpRequestSchema,
	otpVerifySchema,
	forgotPasswordSchema,
	resetPasswordSchema,
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

router.use(authLimiter);

router.post("/signup/customer", validate(customerSignupSchema), registerCustomer);
router.post("/signup/merchant", validate(merchantSignupSchema), registerMerchant);
router.post("/login", validate(loginSchema), login);
router.post("/otp/request", otpLimiter, validate(otpRequestSchema), requestOtp);
router.post("/otp/verify", otpLimiter, validate(otpVerifySchema), verifyOtp);
router.get("/verify/:token", verifyEmail);
router.post('/forgot-password', otpLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', otpLimiter, validate(resetPasswordSchema), resetPassword);

export default router;
