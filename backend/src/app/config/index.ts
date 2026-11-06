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
};
