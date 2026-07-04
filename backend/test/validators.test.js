import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema, taskSchema } from "../src/utils/validators.js";

test("registration rejects weak password", () => {
  const result = registerSchema.safeParse({
    fullName: "Weak User",
    email: "weak@example.com",
    password: "weak",
    confirmPassword: "weak",
    role: "Employee"
  });
  assert.equal(result.success, false);
});

test("registration accepts strong matching password", () => {
  const result = registerSchema.safeParse({
    fullName: "Strong User",
    email: "strong@example.com",
    password: "Strong123",
    confirmPassword: "Strong123",
    role: "Employee"
  });
  assert.equal(result.success, true);
});

test("task rejects due date before start date", () => {
  const result = taskSchema.safeParse({
    title: "Invalid task",
    description: "Date rule",
    employeeId: 1,
    priority: "Medium",
    status: "Pending",
    startDate: "2026-07-04",
    dueDate: "2026-07-03"
  });
  assert.equal(result.success, false);
});

test("task accepts valid date range", () => {
  const result = taskSchema.safeParse({
    title: "Valid task",
    description: "Date rule",
    employeeId: 1,
    priority: "High",
    status: "Pending",
    startDate: "2026-07-04",
    dueDate: "2026-07-05"
  });
  assert.equal(result.success, true);
});
