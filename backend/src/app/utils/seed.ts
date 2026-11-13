import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { Role } from "../../generated/prisma/enums";
import config from "../config";

export const seedSuperAdmin = async () => {
	try {
		const name = config.super_admin_name;
		const email = config.super_admin_email;
		const password = config.super_admin_password;

		if (!name || !email || !password) {
			throw new Error("Super admin name, email, password missing");
		}

		const existingAdmin = await prisma.user.findFirst({
			where: {
				role: Role.SUPER_ADMIN,
			},
		});

		if (existingAdmin) {
			console.log("Super admin already exists");
			return;
		}

		const hashedPassword = await bcrypt.hash(
			password,
			Number(config.bcrypt_salt_rounds),
		);

		const superAdmin = await prisma.user.create({
			data: {
				name,
				email,
				password: hashedPassword,
				role: Role.SUPER_ADMIN,
				emailVerified: true,
			},
		});

		console.log("Super admin seeded:", superAdmin);
		return superAdmin;
	} catch (error) {
		const email = config.super_admin_email;

		if (email) {
			await prisma.user.delete({
				where: {
					email,
				},
			});

			console.log("Super admin deleted");
		}

		console.error("Error seeding super admin:", error);
		throw error;
	}
};

export const seedTestAdmin = async () => {
	try {
		const email = config.test_admin_email;
		const password = config.test_admin_password;
		const name = config.test_admin_name;

		if (!email || !password || !name) {
			throw new Error("Test admin name, email, password missing");
		}

		const existingAdmin = await prisma.user.findUnique({
			where: { email },
		});

		if (existingAdmin) {
			console.log("test admin already exists");
			return;
		}

		const hashedPassword = await bcrypt.hash(
			password,
			Number(config.bcrypt_salt_rounds),
		);

		const newTestAdmin = await prisma.user.create({
			data: {
				name,
				email,
				password: hashedPassword,
				role: Role.ADMIN,
				emailVerified: true,
			},
		});

		console.log("test admin seeded : ", newTestAdmin);
		return newTestAdmin;
	} catch (error) {
		const email = config.test_admin_email;

		if (email) {
			await prisma.user.delete({
				where: {
					email,
				},
			});

			console.log("Test admin deleted");
		}

		console.error("Error seeding test admin:", error);
		throw error;
	}
};

export const seedTestDoctor = async () => {
	try {
		const email = config.test_doctor_email;
		const password = config.test_doctor_password;
		const name = config.test_doctor_name;

		if (!email || !password || !name) {
			throw new Error("Test doctor name, email, password missing");
		}

		const testDoctor = await prisma.user.findUnique({
			where: {
				email,
			},
		});

		if (testDoctor) {
			console.log("Test doctor already exists");

			return;
		}

		const hashedPassword = await bcrypt.hash(
			password,
			Number(config.bcrypt_salt_rounds),
		);

		const newTestDoctor = await prisma.user.create({
			data: {
				name,
				email,
				password: hashedPassword,
				role: Role.DOCTOR,
				emailVerified: true,
			},
		});

		console.log("test admin seeded : ", newTestDoctor);
		return newTestDoctor;
	} catch (error) {
		const email = config.test_doctor_email;

		if (email) {
			await prisma.user.delete({
				where: {
					email,
				},
			});

			console.log("test doctor deleted");
		}

		console.error("Error seeding test doctor:", error);
		throw error;
	}
};
