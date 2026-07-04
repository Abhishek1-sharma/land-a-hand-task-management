import { pool } from "../config/db.js";

export async function listNotifications(req, res) {
  const params = {};
  let where = "";
  if (req.user.role !== "Admin") {
    where = "WHERE n.employee_id = :employeeId";
    params.employeeId = req.user.employeeId || 0;
  }

  const [rows] = await pool.execute(
    `SELECT n.id, n.type, n.message, n.is_read AS isRead, n.created_at AS createdAt,
            t.title AS taskTitle
       FROM notifications n
       LEFT JOIN tasks t ON t.id = n.task_id
       ${where}
      ORDER BY n.created_at DESC
      LIMIT 25`,
    params
  );
  res.json(rows);
}

export async function markNotificationRead(req, res) {
  const params = { id: Number(req.params.id) };
  let employeeGuard = "";
  if (req.user.role !== "Admin") {
    employeeGuard = " AND employee_id = :employeeId";
    params.employeeId = req.user.employeeId || 0;
  }
  await pool.execute(`UPDATE notifications SET is_read = TRUE WHERE id = :id${employeeGuard}`, params);
  res.json({ message: "Notification marked as read" });
}

export async function listEmailLogs(req, res) {
  const [rows] = await pool.execute(
    `SELECT id, recipient_email AS recipientEmail, subject, status, created_at AS createdAt
       FROM email_logs
      ORDER BY created_at DESC
      LIMIT 50`
  );
  res.json(rows);
}
