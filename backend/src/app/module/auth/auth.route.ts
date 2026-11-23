import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { AuthController } from "./auth.controller";
import { validateSchema } from "../../middleware/validateSchema";
import { authValidation } from "./auth.validation";

const router = Router();

router.post(
	"/register",
	validateSchema(authValidation.zodPatientRegisterSchema),
	AuthController.registerPatient,
);
router.post(
	"/login",
	validateSchema(authValidation.zodLoginSchema),
	AuthController.loginUser,
);
router.get(
	"/me",
	auth(Role.ADMIN, Role.DOCTOR, Role.PATIENT, Role.SUPER_ADMIN),
	AuthController.getMe,
);
router.post("/refresh-token", AuthController.refreshToken);
router.post("/google", AuthController.googleLogin);

router.post(
	"/forgot-password",
	validateSchema(authValidation.zodForgotPasswordSchema),
	AuthController.forgotPassword,
);
router.post(
	"/reset-password",
	validateSchema(authValidation.zodResetPasswordSchema),
	AuthController.resetPassword,
);

export const AuthRoutes = router;
