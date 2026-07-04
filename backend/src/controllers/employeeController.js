import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";
import { HttpError, notFound } from "../utils/httpError.js";

export async function listEmployees(req, res) {
  const search = `%${req.query.search || ""}%`;
  const page = Math.max(Number(req.query.page || 1), 1);
  const limit = Math.min(Math.max(Number(req.query.limit || 8), 1), 50);
  const offset = (page - 1) * limit;
  const allowedSort = {
    name: "e.name",
    email: "e.email",
    department: "e.department",
    designation: "e.designation",
    status: "e.status",
    createdAt: "e.created_at"
  };
  const sortBy = allowedSort[req.query.sortBy] || "e.created_at";
  const sortOrder = String(req.query.sortOrder || "DESC").toUpperCase() === "ASC" ? "ASC" : "DESC";

  const [rows] = await pool.execute(
    `SELECT e.id, e.name, e.email, e.department, e.designation, e.phone, e.status,
            COUNT(t.id) AS taskCount,
            SUM(t.status = 'Completed') AS completedTasks
       FROM employees e
       LEFT JOIN tasks t ON t.employee_id = e.id
      WHERE e.name LIKE :search OR e.email LIKE :search OR e.department LIKE :search
      GROUP BY e.id
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT :limit OFFSET :offset`,
    { search, limit, offset }
  );
  const [[count]] = await pool.execute(
    `SELECT COUNT(*) AS total
       FROM employees e
      WHERE e.name LIKE :search OR e.email LIKE :search OR e.department LIKE :search`,
    { search }
  );
  res.json({ data: rows, pagination: { page, limit, total: count.total, pages: Math.ceil(count.total / limit) } });
}

export async function createEmployee(req, res) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute(
      `INSERT INTO employees (name, email, department, designation, phone, status)
       VALUES (:name, :email, :department, :designation, :phone, :status)`,
      { ...req.body, phone: req.body.phone || null }
    );
    const passwordHash = await bcrypt.hash("Change@123", 10);
    await connection.execute(
      `INSERT INTO users (name, email, password_hash, role, employee_id)
       VALUES (:name, :email, :passwordHash, 'Employee', :employeeId)`,
      {
        name: req.body.name,
        email: req.body.email,
        passwordHash,
        employeeId: result.insertId
      }
    );
    await connection.commit();
    const [rows] = await pool.execute("SELECT * FROM employees WHERE id = :id", {
      id: result.insertId
    });
    res.status(201).json(rows[0]);
  } catch (error) {
    await connection.rollback();
    if (error.code === "ER_DUP_ENTRY") {
      throw new HttpError(409, "An employee with this email already exists");
    }
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateEmployee(req, res) {
  const id = Number(req.params.id);
  try {
    const [result] = await pool.execute(
      `UPDATE employees
          SET name = :name, email = :email, department = :department,
              designation = :designation, phone = :phone, status = :status
        WHERE id = :id`,
      { ...req.body, phone: req.body.phone || null, id }
    );
    if (!result.affectedRows) throw notFound("Employee not found");
    await pool.execute(
      "UPDATE users SET name = :name, email = :email WHERE employee_id = :id",
      { name: req.body.name, email: req.body.email, id }
    );
    const [rows] = await pool.execute("SELECT * FROM employees WHERE id = :id", { id });
    res.json(rows[0]);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      throw new HttpError(409, "An employee with this email already exists");
    }
    throw error;
  }
}

export async function deleteEmployee(req, res) {
  const [result] = await pool.execute("DELETE FROM employees WHERE id = :id", {
    id: Number(req.params.id)
  });
  if (!result.affectedRows) throw notFound("Employee not found");
  res.status(204).send();
}
