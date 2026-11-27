import type { Role } from "../../../generated/prisma/browser";

export interface ILoginUserPayload {
	email: string;
	password: string;
}

export interface IRegisterPatientPayload {
	name: string;
	email: string;
	password: string;
}

export interface IRequestUser {
	userId: string;
	email: string;
	name: string;
	role: Role;
}

export interface IGoogleLoginPayload {
	idToken: string;
}

export interface IUpdateUserPayload {
	email?: string;
	name?: string;
}

export interface IForgotPasswordPayload {
	email: string;
}

export interface IResetPassword {
	email: string;
	otp: string;
	newPassword: string;
}

export interface IVerifyEmailPayload {
	email: string;
	otp: string;
}
