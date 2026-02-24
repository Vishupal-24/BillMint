import { z } from "zod";

const emailSchema = z.string().email();
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");
const roleSchema = z.enum(["customer", "merchant"], { required_error: "Role is required" });

export const loginSchema = {
	body: z.object({
		email: emailSchema,
		password: z.string().min(1, "Password is required"),
		role: roleSchema.default("customer"),
	}),
};

export const customerSignupSchema = {
	body: z.object({
		name: z.string().min(1, "Name is required"),
		email: emailSchema,
		password: passwordSchema,
		confirmPassword: passwordSchema.optional(),
	}).refine((data) => !data.confirmPassword || data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	}),
};

export const merchantSignupSchema = {
	body: z.object({
		shopName: z.string().min(1, "Shop name is required"),
		email: emailSchema,
		password: passwordSchema,
		confirmPassword: passwordSchema.optional(),
	}).refine((data) => !data.confirmPassword || data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	}),
};

export const otpRequestSchema = {
	body: z.object({
		email: emailSchema,
		role: roleSchema.default("customer"),
	}),
};

export const otpVerifySchema = {
	body: z.object({
		email: emailSchema,
		role: roleSchema.default("customer"),
		code: z.string().trim().length(6, "Code must be 6 digits"),
	}),
};

export const forgotPasswordSchema = {
	body: z.object({
		email: emailSchema,
		role: roleSchema.default("customer"),
	}),
};

export const resetPasswordSchema = {
	body: z.object({
		email: emailSchema,
		role: roleSchema.default("customer"),
		otp: z.string().trim().length(6, "Code must be 6 digits"),
		newPassword: passwordSchema,
	}),
};
