import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import "./config/env.js";
import { authenticate } from "./middleware/auth.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { login, register } from "./controllers/authController.js";
import { authRoutes } from "./routes/authRoutes.js";
import { employeeRoutes } from "./routes/employeeRoutes.js";
import { notificationRoutes } from "./routes/notificationRoutes.js";
import { reportRoutes } from "./routes/reportRoutes.js";
import { taskRoutes } from "./routes/taskRoutes.js";
import { asyncHandler } from "./utils/asyncHandler.js";
import { loginSchema, registerSchema, validate } from "./utils/validators.js";

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  }),
);
app.use(express.json({ limit: "1mb" }));

const authPaths = new Set([
  "/api/auth/login",
  "/api/auth/register",
  "/api/login",
  "/api/register",
  "/login",
  "/register",
]);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: Number(process.env.RATE_LIMIT_MAX || 10000),
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => authPaths.has(req.path),
  }),
);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "employee-task-management-api" });
});

app.use("/api/auth", authRoutes);
app.post("/api/register", validate(registerSchema), asyncHandler(register));
app.post("/api/login", validate(loginSchema), asyncHandler(login));
app.post("/register", validate(registerSchema), asyncHandler(register));
app.post("/login", validate(loginSchema), asyncHandler(login));
app.use("/api/employees", authenticate, employeeRoutes);
app.use("/api/tasks", authenticate, taskRoutes);
app.use("/api/notifications", authenticate, notificationRoutes);
app.use("/api/reports", authenticate, reportRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use(errorHandler);
