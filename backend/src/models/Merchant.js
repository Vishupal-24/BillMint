import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Operating hours sub-schema
const operatingHoursSchema = new mongoose.Schema(
	{
		day: {
			type: String,
			enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
			required: true,
		},
		isOpen: {
			type: Boolean,
			default: true,
		},
		openTime: {
			type: String,
			default: "09:00",
		},
		closeTime: {
			type: String,
			default: "21:00",
		},
	},
	{ _id: false }
);

// Address sub-schema for detailed location
const addressSchema = new mongoose.Schema(
	{
		street: { type: String, trim: true },
		city: { type: String, trim: true },
		state: { type: String, trim: true },
		postalCode: { type: String, trim: true },
		country: { type: String, trim: true, default: "India" },
	},
	{ _id: false }
);

const merchantSchema = new mongoose.Schema(
	{
		// Basic Auth Fields
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
		},
		password: {
			type: String,
			required: true,
			minlength: 6,
		},
		// Google OAuth fields
		googleId: {
			type: String,
			sparse: true,
			index: true,
		},
		authProvider: {
			type: String,
			enum: ["email", "google", "both"],
			default: "email",
		},
		avatar: {
			type: String,
			trim: true,
		},
		merchantCode: {
			type: String,
			unique: true,
			trim: true,
			sparse: true,
		},
		role: {
			type: String,
			enum: ["merchant"],
			default: "merchant",
			immutable: true,
		},
		isVerified: {
			type: Boolean,
			default: false,
		},
		// Email verification OTP (for signup)
		isEmailVerified: {
			type: Boolean,
			default: false,
		},
		emailOtp: {
			type: String,
			select: false,
		},
		emailOtpExpires: {
			type: Date,
			select: false,
		},
		// Password reset OTP
		resetPasswordOtp: {
			type: String,
			select: false,
		},
		resetPasswordExpires: {
			type: Date,
			select: false,
		},

		// Onboarding
		isProfileComplete: {
			type: Boolean,
			default: false,
		},
		onboardingStep: {
			type: Number,
			default: 0,
		},

		// Business profile
		shopName: {
			type: String,
			trim: true,
			default: "",
		},
		businessCategory: {
			type: String,
			trim: true,
			maxlength: 100,
		},
		businessDescription: {
			type: String,
			trim: true,
			maxlength: 500,
		},
		ownerName: {
			type: String,
			trim: true,
		},
		phone: {
			type: String,
			trim: true,
		},
		
		// Structured address
		address: addressSchema,
		
		// Simple address (legacy)
		addressLine: {
			type: String,
			trim: true,
		},

		// Weekly schedule
		operatingHours: {
			type: [operatingHoursSchema],
			default: [
				{ day: "monday", isOpen: true, openTime: "09:00", closeTime: "21:00" },
				{ day: "tuesday", isOpen: true, openTime: "09:00", closeTime: "21:00" },
				{ day: "wednesday", isOpen: true, openTime: "09:00", closeTime: "21:00" },
				{ day: "thursday", isOpen: true, openTime: "09:00", closeTime: "21:00" },
				{ day: "friday", isOpen: true, openTime: "09:00", closeTime: "21:00" },
				{ day: "saturday", isOpen: true, openTime: "09:00", closeTime: "21:00" },
				{ day: "sunday", isOpen: false, openTime: "09:00", closeTime: "21:00" },
			],
		},

		// Receipt branding
		receiptFooter: {
			type: String,
			trim: true,
			default: "Thank you! Visit again.",
		},
		receiptHeader: {
			type: String,
			trim: true,
			default: "",
		},
		brandColor: {
			type: String,
			trim: true,
			default: "#10b981",
		},
		currency: {
			type: String,
			trim: true,
			default: "INR",
		},
		logoUrl: {
			type: String,
			trim: true,
		},

		// UPI Payment Settings (for POS system)
		upiId: {
			type: String,
			trim: true,
			lowercase: true,
			default: null,
		},
		upiType: {
			type: String,
			enum: ["MERCHANT", "PERSONAL"],
			default: "PERSONAL",
		},
		upiName: {
			type: String,
			trim: true,
			default: null,
		},
		isUpiVerified: {
			type: Boolean,
			default: false,
		},
		// Personal UPI QR Image (base64 data URL)
		// This is a static image of the merchant's personal UPI QR code
		// Used for P2P payments to avoid merchant verification errors
		personalUpiQrImage: {
			type: String,
			trim: true,
			default: null,
		},

		// OTP fields
		otpCodeHash: {
			type: String,
			select: false,
		},
		otpExpiresAt: {
			type: Date,
			select: false,
		},
		otpAttempts: {
			type: Number,
			default: 0,
			select: false,
		},
		otpLastSentAt: {
			type: Date,
			select: false,
		},
		// Session tokens
		refreshToken: {
			type: String,
			select: false,
		},
		refreshTokenExpiry: {
			type: Date,
			select: false,
		},
		lastLoginAt: {
			type: Date,
		},
		tokenVersion: {
			type: Number,
			default: 0,
			select: false,
		},
	},
	{ timestamps: true }
);

merchantSchema.pre("save", async function hashPassword(next) {
	if (!this.isModified("password")) return next();
	this.password = await bcrypt.hash(this.password, 10);
	next();
});

// Generate unique 6-char merchant code
merchantSchema.pre("save", async function generateMerchantCode(next) {
	if (this.merchantCode) return next();

	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	let code;
	let exists = true;

	// Keep trying until unique
	while (exists) {
		code = "";
		for (let i = 0; i < 6; i++) {
			code += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		exists = await mongoose.model("Merchant").findOne({ merchantCode: code });
	}

	this.merchantCode = code;
	next();
});

merchantSchema.methods.comparePassword = function comparePassword(candidate) {
	return bcrypt.compare(candidate, this.password);
};

// Indexes - only using schema.index() to avoid duplicates with unique: true fields
merchantSchema.index({ shopName: "text" });
merchantSchema.index({ isVerified: 1 });
merchantSchema.index({ isProfileComplete: 1 });
merchantSchema.index({ businessCategory: 1 });
merchantSchema.index({ createdAt: -1 });
merchantSchema.index({ refreshToken: 1 }); // For token lookup during refresh

const Merchant = mongoose.model("Merchant", merchantSchema);

export default Merchant;
