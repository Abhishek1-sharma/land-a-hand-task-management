import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";
import { HttpError } from "../utils/httpError.js";

async function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== "string") return false;

  if (storedHash.startsWith("sha256:")) {
    const expected = storedHash.slice("sha256:".length);
    const actual = crypto.createHash("sha256").update(password).digest("hex");
    if (expected.length !== actual.length) return false;
    return crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
  }

  if (storedHash.startsWith("$2a$") || storedHash.startsWith("$2b$")) {
    return bcrypt.compare(password, storedHash);
  }

  if (password.length !== storedHash.length) return false;
  return crypto.timingSafeEqual(Buffer.from(password), Buffer.from(storedHash));
}

export async function login(req, res) {
  const { password, rememberMe } = req.body;
  const email = req.body.email.trim().toLowerCase();
  const [rows] = await pool.execute(
    "SELECT id, name, email, password_hash AS passwordHash, role, employee_id AS employeeId FROM users WHERE LOWER(email) = :email LIMIT 1",
    { email }
  );

  const user = rows[0];
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new HttpError(401, "Invalid email or password");
  }

  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role, employeeId: user.employeeId },
    process.env.JWT_SECRET || "dev-secret",
    { expiresIn: rememberMe ? "30d" : "8h" }
  );

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, employeeId: user.employeeId }
  });
}

export async function register(req, res) {
  const { fullName, email, password, role } = req.body;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const [existingUsers] = await connection.execute(
      "SELECT id FROM users WHERE email = :email LIMIT 1",
      { email }
    );
    const [existingEmployees] = await connection.execute(
      "SELECT id FROM employees WHERE email = :email LIMIT 1",
      { email }
    );
    if (existingUsers.length || existingEmployees.length) {
      throw new HttpError(409, "Email is already registered");
    }

    let employeeId = null;
    if (role === "Employee") {
      const [employeeResult] = await connection.execute(
        `INSERT INTO employees (name, email, department, designation, status)
         VALUES (:name, :email, 'Unassigned', 'Employee', 'Active')`,
        { name: fullName, email }
      );
      employeeId = employeeResult.insertId;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [userResult] = await connection.execute(
      `INSERT INTO users (name, email, password_hash, role, employee_id)
       VALUES (:name, :email, :passwordHash, :role, :employeeId)`,
      { name: fullName, email, passwordHash, role, employeeId }
    );

    await connection.commit();

    res.status(201).json({
      message: "Registration successful",
      user: { id: userResult.insertId, name: fullName, email, role, employeeId }
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export function me(req, res) {
  res.json({ user: req.user });
}
