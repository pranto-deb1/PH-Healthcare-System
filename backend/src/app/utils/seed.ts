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
