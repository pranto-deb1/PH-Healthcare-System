import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
	node_env: process.env.NODE_ENV as string,
	port: process.env.PORT as string,
	database_url: process.env.DATABASE_URL as string,
	bak_url: process.env.APP_URL as string,
	frontend_url: process.env.FRONTEND_URL as string,
	bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS as string,
	jwt_access_secret: process.env.JWT_ACCESS_SECRET as string,
	jwt_refresh_secret: process.env.JWT_REFRESH_SECRET as string,
	jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN as string,
	jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN as string,
	google_client_id: process.env.GOOGLE_CLIENT_ID as string,
	super_admin_name: process.env.SUPER_ADMIN_NAME as string,
	super_admin_email: process.env.SUPER_ADMIN_EMAIL as string,
	super_admin_password: process.env.SUPER_ADMIN_PASSWORD as string,
	test_admin_name: process.env.TEST_ADMIN_NAME as string,
	test_admin_email: process.env.TEST_ADMIN_EMAIL as string,
	test_admin_password: process.env.TEST_ADMIN_PASSWORD as string,
	test_doctor_name: process.env.TEST_DOCTOR_NAME as string,
	test_doctor_email: process.env.TEST_DOCTOR_EMAIL as string,
	test_doctor_password: process.env.TEST_DOCTOR_PASSWORD as string,
	redis_user: process.env.REDIS_USER as string,
	redis_password: process.env.REDIS_PASSWORD as string,
	redis_host: process.env.REDIS_HOST as string,
	redis_port: process.env.REDIS_PORT as string,
	smtp_user: process.env.SMTP_USER as string,
	smtp_password: process.env.SMTP_PASSWORD as string,
};
