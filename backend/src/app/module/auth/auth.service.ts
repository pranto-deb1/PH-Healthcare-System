import bcrypt from "bcryptjs";
import type { JwtPayload, SignOptions } from "jsonwebtoken";
import {
	AuthProvider,
	Role,
	UserStatus,
} from "../../../generated/prisma/enums";
import config from "../../config";
import { prisma } from "../../lib/prisma";
import { jwtUtils } from "../../utils/jwt";
import type {
	IForgotPasswordPayload,
	IGoogleLoginPayload,
	ILoginUserPayload,
	IRegisterPatientPayload,
	IRequestUser,
	IResetPassword,
	IVerifyEmailPayload,
} from "./auth.interface";
import googleClient from "../../lib/googleAuth";
import type { TokenPayload } from "google-auth-library";
import crypto from "crypto";
import { redisClient } from "../../lib/redis";
import { transporter } from "../../lib/nodemailer";
import ejs from "ejs";
import path from "path";

const registerPatient = async (payload: IRegisterPatientPayload) => {
	const { name, password } = payload;
	const email = payload.email.trim().toLowerCase();

	const isUserExists = await prisma.user.findUnique({
		where: { email },
	});

	if (isUserExists) {
		throw new Error("User with this email already exists");
	}

	const hashedPassword = await bcrypt.hash(password, 8);
	const temporaryUserDataPayload = {
		name,
		email,
		password: hashedPassword,
	};
	const otp = crypto.randomInt(99999, 1000000);
	const userDataKey = `user-registration-data:${email}`;
	const otpKey = `user-register-otp:${email}`;

	await redisClient.set(userDataKey, JSON.stringify(temporaryUserDataPayload), {
		expiration: {
			type: "EX",
			value: 5 * 60,
		},
	});

	await redisClient.set(otpKey, otp, {
		expiration: {
			type: "EX",
			value: 5 * 60,
		},
	});

	const registerOtpEmailTemplate = path.join(
		process.cwd(),
		"src/app/templates/register.ejs",
	);

	const html = await ejs.renderFile(registerOtpEmailTemplate, {
		userName: name,
		OTP: otp,
	});

	await transporter.sendMail({
		from: config.smtp_user,
		to: email,
		subject: "Registration OTP - Healthcare System",
		html,
	});
};

const verifyUser = async (payload: IVerifyEmailPayload) => {
	const { otp } = payload;
	const email = payload.email.trim().toLowerCase();

	const otpKey = `user-register-otp:${email}`;
	const userDataKey = `user-registration-data:${email}`;

	const redisOtp = await redisClient.get(otpKey);
	const userTemporaryData = await redisClient.get(userDataKey);

	if (!redisOtp || !userTemporaryData) {
		throw new Error("Request is not valid");
	}

	if (redisOtp !== otp) {
		throw new Error("OTP does not match");
	}

	const isUserExists = await prisma.user.findUnique({ where: { email } });

	if (isUserExists?.emailVerified) {
		throw new Error("Email is already verified");
	}

	const userDataPayload: IRegisterPatientPayload =
		JSON.parse(userTemporaryData);

	const createdUser = await prisma.user.create({
		data: {
			name: userDataPayload.name,
			email: userDataPayload.email,
			password: userDataPayload.password,
			role: Role.PATIENT,
			status: UserStatus.ACTIVE,
			emailVerified: true,
			patient: {
				create: { name: userDataPayload.name, email: userDataPayload.email },
			},
		},
		omit: { password: true },
		include: { patient: true },
	});

	const { patient, ...user } = createdUser;

	const jwtPayload = {
		userId: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
	};

	const refreshToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_refresh_secret,
		config.jwt_refresh_expires_in as SignOptions,
	);

	const accessToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_access_secret,
		config.jwt_access_expires_in as SignOptions,
	);

	await redisClient.del(otpKey);
	await redisClient.del(userDataKey);

	const welcomeEmailTemplatePath = path.join(
		process.cwd(),
		"src/app/templates/welcome.ejs",
	);
	const date = new Date().toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});

	const html = await ejs.renderFile(welcomeEmailTemplatePath, {
		userName: user.name,
		date,
	});

	await transporter.sendMail({
		from: config.smtp_user,
		to: user.email,
		subject: "Welcome to Healthcare - System",
		html,
	});

	return {
		user,
		patient,
		refreshToken,
		accessToken,
	};
};

const loginUser = async (payload: ILoginUserPayload) => {
	const { password } = payload;
	const email = payload.email.trim().toLowerCase();

	const user = await prisma.user.findUnique({
		where: { email },
	});

	if (!user) {
		throw new Error("User not found");
	}

	if (user.status === UserStatus.BLOCKED) {
		throw new Error("User is blocked");
	}

	if (user.isDeleted || user.status === UserStatus.DELETED) {
		throw new Error("User is deleted");
	}

	if (!user.password && user.googleId !== null) {
		throw new Error(
			"User has already registered with google. Try login with google",
		);
	}

	// if()

	const isPasswordMatched = await bcrypt.compare(
		password,
		user.password as string,
	);

	if (!isPasswordMatched) {
		throw new Error("Invalid credentials");
	}

	const jwtPayload = {
		userId: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
	};

	const accessToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_access_secret,
		config.jwt_access_expires_in as SignOptions,
	);

	const refreshToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_refresh_secret,
		config.jwt_refresh_expires_in as SignOptions,
	);

	return {
		accessToken,
		refreshToken,
	};
};

const getMe = async (user: IRequestUser) => {
	const isUserExists = await prisma.user.findUnique({
		where: {
			id: user.userId,
		},
		include: {
			patient: true,
		},
		omit: {
			password: true,
		},
	});

	if (!isUserExists) {
		throw new Error("User not found");
	}

	return isUserExists;
};

const refreshToken = async (token: string) => {
	const verifiedRefreshToken = jwtUtils.verifyToken(
		token,
		config.jwt_refresh_secret,
	);

	if (!verifiedRefreshToken.success || !verifiedRefreshToken.data) {
		throw new Error(
			config.node_env === "development"
				? verifiedRefreshToken.error
				: "Invalid refresh token",
		);
	}

	const data = verifiedRefreshToken.data as JwtPayload;

	const user = await prisma.user.findUnique({
		where: { id: data.userId },
	});

	if (!user || user.isDeleted || user.status !== UserStatus.ACTIVE) {
		throw new Error("User is inactive or not found");
	}

	const jwtPayload = {
		userId: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
	};

	const accessToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_access_secret,
		config.jwt_access_expires_in as SignOptions,
	);

	const refreshToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_refresh_secret,
		config.jwt_refresh_expires_in as SignOptions,
	);

	return {
		accessToken,
		refreshToken,
	};
};

const googleLogin = async (payload: IGoogleLoginPayload) => {
	// define google id token payload
	let googleIdTokenPayload: TokenPayload | null | undefined = null;

	try {
		// call google client to verify the id token
		const ticket = await googleClient.verifyIdToken({
			idToken: payload.idToken,
			audience: config.google_client_id,
		});

		// set the ticket value to googleIdTokenPayload
		googleIdTokenPayload = ticket.getPayload();
	} catch (error) {
		console.log("google id token verification failed", error);
		throw new Error("invalid or expired google id token");
	}

	// check if google id token payload exists
	if (!googleIdTokenPayload)
		throw new Error("invalid or expired google id token");

	// dubble check if the email exists (not exactly necessary cus there can't be a google account without an email)
	if (!googleIdTokenPayload.email) throw new Error("Google email not found");

	// check if the name exists
	const Name = googleIdTokenPayload.name ? googleIdTokenPayload.name : "USER";

	// check if the patient already exists
	const ifPatientExistWithGoogleAuth = await prisma.user.findUnique({
		where: {
			email: googleIdTokenPayload.email,
			role: Role.PATIENT,
			googleId: googleIdTokenPayload.sub,
		},
	});

	let user = ifPatientExistWithGoogleAuth;

	if (!user) {
		// check if the user also exits with credentials
		const ifPatientExistWithCredentials = await prisma.user.findUnique({
			where: {
				email: googleIdTokenPayload.email,
				role: Role.PATIENT,
				authProvider: AuthProvider.CREDENTIAL,
			},
		});

		if (ifPatientExistWithCredentials) {
			if (!ifPatientExistWithCredentials.emailVerified) {
				throw new Error("Email not verified");
			}

			// check if the patient already blocked or deleted
			if (ifPatientExistWithCredentials.status === UserStatus.BLOCKED) {
				throw new Error("Your account is blocked. Pleas contact support");
			}

			if (
				ifPatientExistWithCredentials.isDeleted ||
				ifPatientExistWithCredentials.status === UserStatus.DELETED
			) {
				throw new Error("Your account is been deleted");
			}

			// update the user so the user can login with both credentials and google
			await prisma.user.update({
				where: {
					id: ifPatientExistWithCredentials.id,
				},
				data: {
					googleId: googleIdTokenPayload.sub,
				},
			});
		} else {
			// create the user if not exists

			user = await prisma.user.create({
				data: {
					name: Name,
					email: googleIdTokenPayload.email,
					role: Role.PATIENT,
					googleId: googleIdTokenPayload.sub,
					authProvider: AuthProvider.GOOGLE,
					emailVerified: true,
					patient: {
						create: {
							name: Name,
							email: googleIdTokenPayload.email,
						},
					},
				},
			});
		}
	}

	if (!user) {
		throw new Error("User not fount");
	}

	if (user.status === UserStatus.BLOCKED || user.isDeleted) {
		throw new Error("User is deleted");
	}

	// crete payload for jwt token
	const jwtPayload = {
		userId: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
	};

	// create access and refresh token
	const accessToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_access_secret,
		config.jwt_access_expires_in as SignOptions,
	);

	const refreshToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_refresh_secret,
		config.jwt_refresh_expires_in as SignOptions,
	);

	// return access and refresh token
	return {
		accessToken,
		refreshToken,
	};
};

const forgotPassword = async (payload: IForgotPasswordPayload) => {
	const { email } = payload;

	const user = await prisma.user.findUnique({ where: { email } });

	if (!user) {
		throw new Error("User does not exists");
	}

	if (user.status === UserStatus.BLOCKED) {
		throw new Error("User is blocked");
	}

	if (user.isDeleted || user.status === UserStatus.DELETED) {
		throw new Error("User is deleted");
	}

	if (user.googleId && user.authProvider !== AuthProvider.CREDENTIAL) {
		throw new Error("User has account with google");
	}

	const OTP = crypto.randomInt(99999, 1000000);

	const key = `forgot-password-otp:${user.email}`;

	const expiresIn = 60 * 10;

	redisClient.set(key, OTP, {
		expiration: {
			type: "EX",
			value: expiresIn,
		},
	});

	const emailTemplatePath = path.join(
		process.cwd(),
		"src/app/templates/forgotPassword.ejs",
	);

	const html = await ejs.renderFile(emailTemplatePath, {
		userName: user.name,
		time: expiresIn / 60,
		OTP: OTP,
	});

	await transporter.sendMail({
		from: config.smtp_user,
		to: user.email,
		subject: "Forgot Password - Healthcare System",
		// text: `Your OTP is ${OTP}`,
		html,
	});
};

const resetPassword = async (payload: IResetPassword) => {
	const { email, otp, newPassword } = payload;

	const user = await prisma.user.findUnique({ where: { email } });

	if (!user) {
		throw new Error("User does not exists");
	}

	if (user.status === UserStatus.BLOCKED) {
		throw new Error("User is blocked");
	}

	if (user.isDeleted || user.status === UserStatus.DELETED) {
		throw new Error("User is deleted");
	}

	if (user.googleId && user.authProvider !== AuthProvider.CREDENTIAL) {
		throw new Error("User has account with google");
	}

	if (!otp) {
		throw new Error("Invalid OTP");
	}

	const key = `forgot-password-otp:${user.email}`;
	const redisOtp = await redisClient.get(key);

	if (!redisOtp) {
		throw new Error("Can't find OTP");
	}

	if (redisOtp !== otp) {
		throw new Error("OTP does not match");
	}

	const newHashedPassword = await bcrypt.hash(
		newPassword,
		Number(config.bcrypt_salt_rounds),
	);

	await prisma.user.update({
		where: {
			email,
		},
		data: {
			password: newHashedPassword,
			emailVerified: true,
		},
	});

	await redisClient.del([key]);

	const passwordResetEmailTemplate = path.join(
		process.cwd(),
		"src/app/templates/passwordChanged.ejs",
	);

	const date = new Date().toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});

	const html = await ejs.renderFile(passwordResetEmailTemplate, {
		userName: user.name,
		date,
	});

	await transporter.sendMail({
		from: config.smtp_user,
		to: user.email,
		subject: "Password Changed - Healthcare System",
		html,
	});
};

export const AuthService = {
	registerPatient,
	loginUser,
	getMe,
	refreshToken,
	googleLogin,
	forgotPassword,
	resetPassword,
	verifyUser,
};
