import { Router } from "express";
import {
  createTask,
  deleteTask,
  getDashboard,
  getTaskAttachment,
  listTasks,
  updateTask,
  updateTaskStatus
} from "../controllers/taskController.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { taskSchema, taskStatusSchema, validate } from "../utils/validators.js";

export const taskRoutes = Router();

taskRoutes.get("/dashboard", asyncHandler(getDashboard));
taskRoutes.get("/", asyncHandler(listTasks));
taskRoutes.get("/:id/attachment", asyncHandler(getTaskAttachment));
taskRoutes.post("/", validate(taskSchema), asyncHandler(createTask));
taskRoutes.put("/:id", validate(taskSchema), asyncHandler(updateTask));
taskRoutes.patch("/:id/status", validate(taskStatusSchema), asyncHandler(updateTaskStatus));
taskRoutes.delete("/:id", asyncHandler(deleteTask));
