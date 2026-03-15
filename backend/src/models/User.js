import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
		},
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
		role: {
			type: String,
			enum: ["customer"],
			default: "customer",
			immutable: true,
		},
		phone: {
			type: String,
			trim: true,
		},
		address: {
			line1: { type: String, trim: true },
			line2: { type: String, trim: true },
			city: { type: String, trim: true },
			state: { type: String, trim: true },
			postalCode: { type: String, trim: true },
			country: { type: String, trim: true },
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
		// Legacy OTP fields (kept for backward compat)
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

userSchema.pre("save", async function hashPassword(next) {
	if (!this.isModified("password")) return next();
	this.password = await bcrypt.hash(this.password, 10);
	next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
	return bcrypt.compare(candidate, this.password);
};

// Indexes - only using schema.index() to avoid duplicates
userSchema.index({ isVerified: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ refreshToken: 1 });

const User = mongoose.model("User", userSchema);

export default User;
