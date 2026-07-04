import { Router } from "express";
import {
  createEmployee,
  deleteEmployee,
  listEmployees,
  updateEmployee
} from "../controllers/employeeController.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireRole } from "../middleware/auth.js";
import { employeeSchema, validate } from "../utils/validators.js";

export const employeeRoutes = Router();

employeeRoutes.get("/", requireRole("Admin"), asyncHandler(listEmployees));
employeeRoutes.post("/", requireRole("Admin"), validate(employeeSchema), asyncHandler(createEmployee));
employeeRoutes.put("/:id", requireRole("Admin"), validate(employeeSchema), asyncHandler(updateEmployee));
employeeRoutes.delete("/:id", requireRole("Admin"), asyncHandler(deleteEmployee));
