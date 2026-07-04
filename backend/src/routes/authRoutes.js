import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { login, me, register } from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";
import { loginSchema, registerSchema, validate } from "../utils/validators.js";

export const authRoutes = Router();

authRoutes.post("/login", validate(loginSchema), asyncHandler(login));
authRoutes.post("/register", validate(registerSchema), asyncHandler(register));
authRoutes.get("/me", authenticate, me);
