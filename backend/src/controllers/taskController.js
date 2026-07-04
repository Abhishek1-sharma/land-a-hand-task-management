import { pool } from "../config/db.js";
import { HttpError, notFound } from "../utils/httpError.js";

function isAdmin(req) {
  return req.user?.role === "Admin";
}

async function addNotification({
  userId = null,
  employeeId = null,
  taskId = null,
  type,
  message,
}) {
  await pool.execute(
    `INSERT INTO notifications (user_id, employee_id, task_id, type, message)
     VALUES (:userId, :employeeId, :taskId, :type, :message)`,
    { userId, employeeId, taskId, type, message },
  );

  const [[recipient]] = await pool.execute(
    `SELECT COALESCE(u.email, e.email) AS email
       FROM employees e
       LEFT JOIN users u ON u.employee_id = e.id
      WHERE e.id = :employeeId
      LIMIT 1`,
    { employeeId },
  );
  if (recipient?.email) {
    await pool.execute(
      `INSERT INTO email_logs (recipient_email, subject, body, status)
       VALUES (:email, :subject, :body, 'Queued')`,
      {
        email: recipient.email,
        subject: `Task ${type}: Employee Task Management`,
        body: message,
      },
    );
  }
}

function buildTaskFilters(query) {
  const filters = [];
  const params = {};

  if (query.status) {
    filters.push("t.status = :status");
    params.status = query.status;
  }
  if (query.priority) {
    filters.push("t.priority = :priority");
    params.priority = query.priority;
  }
  if (query.employeeId) {
    filters.push("t.employee_id = :employeeId");
    params.employeeId = Number(query.employeeId);
  }
  if (query.search) {
    filters.push("(t.title LIKE :search OR e.name LIKE :search)");
    params.search = `%${query.search}%`;
  }

  return {
    where: filters.length ? `WHERE ${filters.join(" AND ")}` : "",
    params,
  };
}

export async function listTasks(req, res) {
  const { where, params } = buildTaskFilters(req.query);
  const filters = [];
  if (where) filters.push(where.replace(/^WHERE /, ""));
  if (!isAdmin(req)) {
    filters.push("t.employee_id = :currentEmployeeId");
    params.currentEmployeeId = req.user.employeeId || 0;
  }
  const scopedWhere = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const [rows] = await pool.execute(
    `SELECT t.id, t.title, t.description, t.priority, t.status,
            t.start_date AS startDate, t.due_date AS dueDate,
            t.attachment_name AS attachmentName, t.attachment_type AS attachmentType,
            t.created_at AS createdAt, t.updated_at AS updatedAt,
            e.id AS employeeId, e.name AS employeeName, e.department
       FROM tasks t
       JOIN employees e ON e.id = t.employee_id
       ${scopedWhere}
      ORDER BY FIELD(t.status, 'Pending', 'In Progress', 'Completed'),
               t.due_date ASC,
               FIELD(t.priority, 'Critical', 'High', 'Medium', 'Low')`,
    params,
  );
  res.json(rows);
}

export async function createTask(req, res) {
  if (!isAdmin(req)) throw new HttpError(403, "Only admins can create tasks");
  const [employee] = await pool.execute(
    "SELECT id FROM employees WHERE id = :id",
    {
      id: req.body.employeeId,
    },
  );
  if (!employee.length) throw notFound("Assigned employee not found");

  const [result] = await pool.execute(
    `INSERT INTO tasks
      (title, description, employee_id, priority, status, start_date, due_date,
       attachment_name, attachment_type, attachment_size, attachment_data)
     VALUES
      (:title, :description, :employeeId, :priority, :status, :startDate, :dueDate,
       :attachmentName, :attachmentType, :attachmentSize, :attachmentData)`,
    {
      ...req.body,
      description: req.body.description || null,
      attachmentName: req.body.attachment?.name || null,
      attachmentType: req.body.attachment?.type || null,
      attachmentSize: req.body.attachment?.size || null,
      attachmentData: req.body.attachment?.data || null,
    },
  );
  await addNotification({
    employeeId: req.body.employeeId,
    taskId: result.insertId,
    type: "Assigned",
    message: `New task assigned: ${req.body.title}`,
  });
  const dueDate = new Date(`${req.body.dueDate}T00:00:00`);
  const tomorrow = new Date();
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (dueDate <= tomorrow) {
    await addNotification({
      employeeId: req.body.employeeId,
      taskId: result.insertId,
      type: "Due Soon",
      message: `Task is due within one day: ${req.body.title}`,
    });
  }
  const [rows] = await pool.execute("SELECT * FROM tasks WHERE id = :id", {
    id: result.insertId,
  });
  res.status(201).json(rows[0]);
}

export async function updateTask(req, res) {
  if (!isAdmin(req)) throw new HttpError(403, "Only admins can update tasks");
  const id = Number(req.params.id);
  const [[existing]] = await pool.execute(
    "SELECT status FROM tasks WHERE id = :id",
    { id },
  );
  if (!existing) throw notFound("Task not found");
  if (existing.status === "Completed") {
    throw new HttpError(400, "Completed tasks cannot be edited");
  }
  const [employee] = await pool.execute(
    "SELECT id FROM employees WHERE id = :id",
    {
      id: req.body.employeeId,
    },
  );
  if (!employee.length) throw notFound("Assigned employee not found");

  const [result] = await pool.execute(
    `UPDATE tasks
        SET title = :title, description = :description, employee_id = :employeeId,
            priority = :priority, status = :status, start_date = :startDate, due_date = :dueDate,
            attachment_name = COALESCE(:attachmentName, attachment_name),
            attachment_type = COALESCE(:attachmentType, attachment_type),
            attachment_size = COALESCE(:attachmentSize, attachment_size),
            attachment_data = COALESCE(:attachmentData, attachment_data)
      WHERE id = :id`,
    {
      ...req.body,
      description: req.body.description || null,
      id,
      attachmentName: req.body.attachment?.name || null,
      attachmentType: req.body.attachment?.type || null,
      attachmentSize: req.body.attachment?.size || null,
      attachmentData: req.body.attachment?.data || null,
    },
  );
  if (!result.affectedRows) throw notFound("Task not found");
  const [rows] = await pool.execute("SELECT * FROM tasks WHERE id = :id", {
    id,
  });
  res.json(rows[0]);
}

export async function updateTaskStatus(req, res) {
  const id = Number(req.params.id);
  const [[task]] = await pool.execute(
    "SELECT id, title, status, employee_id AS employeeId FROM tasks WHERE id = :id",
    { id },
  );
  if (!task) throw notFound("Task not found");
  if (task.status === "Completed") {
    throw new HttpError(400, "Completed tasks cannot be edited");
  }
  if (!isAdmin(req) && task.employeeId !== req.user.employeeId) {
    throw new HttpError(403, "Employees can update only their own tasks");
  }
  const [result] = await pool.execute(
    "UPDATE tasks SET status = :status WHERE id = :id",
    {
      id: Number(req.params.id),
      status: req.body.status,
    },
  );
  if (!result.affectedRows) throw notFound("Task not found");
  if (req.body.status === "Completed") {
    await addNotification({
      employeeId: task.employeeId,
      taskId: id,
      type: "Completed",
      message: `Task marked complete: ${task.title}`,
    });
  }
  res.json({ message: "Task status updated" });
}

export async function deleteTask(req, res) {
  if (!isAdmin(req)) throw new HttpError(403, "Only admins can delete tasks");
  const [[existing]] = await pool.execute(
    "SELECT status FROM tasks WHERE id = :id",
    {
      id: Number(req.params.id),
    },
  );
  if (!existing) throw notFound("Task not found");
  if (existing.status === "Completed") {
    throw new HttpError(400, "Completed tasks cannot be deleted");
  }
  const [result] = await pool.execute("DELETE FROM tasks WHERE id = :id", {
    id: Number(req.params.id),
  });
  if (!result.affectedRows) throw notFound("Task not found");
  res.status(204).send();
}

export async function getDashboard(req, res) {
  if (!isAdmin(req)) {
    const employeeId = req.user.employeeId || 0;
    const [[summary]] = await pool.execute(
      `SELECT COUNT(*) AS myTasks,
              SUM(status = 'Completed') AS completedTasks,
              SUM(status != 'Completed') AS pendingTasks,
              SUM(due_date < CURDATE() AND status != 'Completed') AS overdueTasks
         FROM tasks
        WHERE employee_id = :employeeId`,
      { employeeId },
    );
    return res.json(summary);
  }
  const [[summary]] = await pool.execute(
    `SELECT COUNT(*) AS totalTasks,
            SUM(status = 'Pending') AS pendingTasks,
            SUM(status = 'In Progress') AS inProgressTasks,
            SUM(status = 'Completed') AS completedTasks,
            SUM(due_date < CURDATE() AND status != 'Completed') AS overdueTasks
       FROM tasks`,
  );
  const [[employees]] = await pool.execute(
    "SELECT COUNT(*) AS totalEmployees, SUM(status = 'Active') AS activeEmployees FROM employees",
  );
  const [byDepartment] = await pool.execute(
    `SELECT e.department, COUNT(t.id) AS tasks
       FROM employees e
       LEFT JOIN tasks t ON t.employee_id = e.id
      GROUP BY e.department
      ORDER BY tasks DESC`,
  );

  res.json({ ...summary, ...employees, byDepartment });
}

export async function getTaskAttachment(req, res) {
  const id = Number(req.params.id);
  const [[task]] = await pool.execute(
    `SELECT attachment_name AS name, attachment_type AS type, attachment_data AS data, employee_id AS employeeId
       FROM tasks
      WHERE id = :id`,
    { id },
  );
  if (!task || !task.data) throw notFound("Attachment not found");
  if (!isAdmin(req) && task.employeeId !== req.user.employeeId) {
    throw new HttpError(403, "Employees can access only their own task files");
  }
  const buffer = Buffer.from(task.data, "base64");
  res.setHeader("Content-Type", task.type);
  res.setHeader("Content-Disposition", `attachment; filename="${task.name}"`);
  res.send(buffer);
}
