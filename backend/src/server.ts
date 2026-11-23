import app from "./app";
import config from "./app/config";
import { transporter } from "./app/lib/nodemailer";
import { prisma } from "./app/lib/prisma";
import { redisClient } from "./app/lib/redis";
import {
	seedSuperAdmin,
	seedTestAdmin,
	seedTestDoctor,
} from "./app/utils/seed";

const PORT = config.port;

const main = async () => {
	try {
		await prisma.$connect();
		await redisClient.connect();
		await seedSuperAdmin();
		await seedTestAdmin();
		await seedTestDoctor();
		await transporter.verify();
		console.log("Connected to the database successfully.");
		console.log("Redis connected successfully");
		console.log("Nodemailer connected successfully");
		app.listen(PORT, () => {
			console.log(`Server is running on port ${PORT}`);
		});
	} catch (error) {
		console.error("Error starting the server:", error);
		await prisma.$disconnect();
		await redisClient.disconnect();
		process.exit(1);
	}
};

main();
