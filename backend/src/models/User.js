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
		role: {
			type: String,
			enum: ["customer"],
			default: "customer",
			immutable: true,
		},
		isVerified: {
			type: Boolean,
			default: false,
		},
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

const User = mongoose.model("User", userSchema);

export default User;
