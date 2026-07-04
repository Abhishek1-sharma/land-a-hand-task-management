import { Router } from "express";
import { listEmailLogs, listNotifications, markNotificationRead } from "../controllers/notificationController.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireRole } from "../middleware/auth.js";

export const notificationRoutes = Router();

notificationRoutes.get("/", asyncHandler(listNotifications));
notificationRoutes.get("/emails", requireRole("Admin"), asyncHandler(listEmailLogs));
notificationRoutes.patch("/:id/read", asyncHandler(markNotificationRead));
