import z from "zod";

const zodPatientRegisterSchema = z.object({
	name: z.string().min(3).max(255),
	email: z.email(),
	password: z
		.string()
		.min(8, "Password must be at least 8 characters long")
		.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
		.regex(/[a-z]/, "Password must contain at least one lowercase letter")
		.regex(/[0-9]/, "Password must contain at least one number")
		.regex(
			/[^A-Za-z0-9]/,
			"Password must contain at least one special character",
		),
});

const zodLoginSchema = z.object({
	email: z.email(),
	password: z
		.string()
		.min(8, "Password must be at least 8 characters long")
		.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
		.regex(/[a-z]/, "Password must contain at least one lowercase letter")
		.regex(/[0-9]/, "Password must contain at least one number")
		.regex(
			/[^A-Za-z0-9]/,
			"Password must contain at least one special character",
		),
});

const zodForgotPasswordSchema = z.object({
	email: z.email(),
});

const zodResetPasswordSchema = z.object({
	email: z.email(),
	otp: z.string().length(6, "OTP must contain at least 6 digits"),
	newPassword: z
		.string()
		.min(8, "Password must be at least 8 characters long")
		.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
		.regex(/[a-z]/, "Password must contain at least one lowercase letter")
		.regex(/[0-9]/, "Password must contain at least one number")
		.regex(
			/[^A-Za-z0-9]/,
			"Password must contain at least one special character",
		),
});

const zodVerifyUserPayload = z.object({
	email: z.email(),
	otp: z.string().length(6, "OTP must contain at least 6 digits"),
});

export const authValidation = {
	zodPatientRegisterSchema,
	zodLoginSchema,
	zodForgotPasswordSchema,
	zodResetPasswordSchema,
	zodVerifyUserPayload,
};
