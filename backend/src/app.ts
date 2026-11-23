import cookieParser from "cookie-parser";
import cors from "cors";
import express, {
	type Application,
	type Request,
	type Response,
} from "express";
import httpStatus from "http-status";
import config from "./app/config";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { notFound } from "./app/middleware/notFound";
import { AuthRoutes } from "./app/module/auth/auth.route";
import { redisClient } from "./app/lib/redis";
import crypto from "crypto";

const app: Application = express();

app.use(
	cors({
		origin: config.frontend_url,
		credentials: true,
	}),
);

// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/auth", AuthRoutes);

// Basic route
app.get("/", async (req: Request, res: Response) => {
	res.status(httpStatus.OK).json({
		success: true,
		message: "Welcome to PH Healthcare System Backend",
	});
});

app.get("/redis", async (req: Request, res: Response) => {
	const data = crypto.randomInt(99999, 1000000);

	// await redisClient.set("forgot-password-otp:prizmine123@gmail.com", "123456", {
	// 	expiration: {
	// 		type: "EX",
	// 		value: 60
	// 	}
	// })

	return res.status(200).json({
		status: 200,
		message: "Redis otp send success",
		data,
	});
});

app.use(globalErrorHandler);
app.use(notFound);

export default app;
