import { Router } from "express";
import { getReports } from "../controllers/reportController.js";
import { requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { reportQuerySchema, validate } from "../utils/validators.js";

export const reportRoutes = Router();

reportRoutes.get("/", requireRole("Admin"), validate(reportQuerySchema, "query"), asyncHandler(getReports));
