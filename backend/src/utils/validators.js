import { z } from "zod";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format");

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  rememberMe: z.boolean().optional().default(false)
});

const strongPassword = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[0-9]/, "Password must include a number");

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(120),
    password: strongPassword,
    confirmPassword: z.string(),
    role: z.enum(["Admin", "Employee"])
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match"
  });

export const employeeSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(120),
  department: z.string().trim().min(2).max(80),
  designation: z.string().trim().min(2).max(80),
  phone: z.string().trim().max(20).optional().nullable(),
  status: z.enum(["Active", "Inactive"]).default("Active")
});

export const taskSchema = z.object({
  title: z.string().trim().min(3).max(150),
  description: z.string().trim().max(2000).optional().nullable(),
  employeeId: z.coerce.number().int().positive(),
  priority: z.enum(["Low", "Medium", "High", "Critical"]).default("Medium"),
  status: z.enum(["Pending", "In Progress", "Completed"]).default("Pending"),
  startDate: isoDate,
  dueDate: isoDate,
  attachment: z
    .object({
      name: z.string().trim().max(255),
      type: z.enum(["application/pdf", "image/jpeg", "image/png"]),
      size: z.number().int().positive().max(5 * 1024 * 1024),
      data: z.string().min(1)
    })
    .optional()
    .nullable()
})
.refine((value) => value.dueDate >= value.startDate, {
  path: ["dueDate"],
  message: "Due date must not be earlier than start date"
});

export const taskStatusSchema = z.object({
  status: z.enum(["Pending", "In Progress", "Completed"])
});

export const reportQuerySchema = z.object({
  type: z.enum(["completed", "pending", "employee-wise"]).default("completed"),
  format: z.enum(["json", "csv", "excel"]).default("json")
});

export function validate(schema, source = "body") {
  return (req, res, next) => {
    const parsed = schema.safeParse(req[source]);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors
      });
    }
    req[source] = parsed.data;
    next();
  };
}
