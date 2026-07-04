import { pool } from "../config/db.js";

function escapeCsv(value) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function toCsv(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  return [headers.map(escapeCsv).join(","), ...rows.map((row) => headers.map((key) => escapeCsv(row[key])).join(","))].join("\n");
}

function toExcelHtml(rows) {
  if (!rows.length) return "<table><tr><td>No data</td></tr></table>";
  const headers = Object.keys(rows[0]);
  const headerHtml = headers.map((key) => `<th>${key}</th>`).join("");
  const rowsHtml = rows
    .map((row) => `<tr>${headers.map((key) => `<td>${row[key] ?? ""}</td>`).join("")}</tr>`)
    .join("");
  return `<table><thead><tr>${headerHtml}</tr></thead><tbody>${rowsHtml}</tbody></table>`;
}

async function getReportRows(type) {
  if (type === "employee-wise") {
    const [rows] = await pool.execute(
      `SELECT e.name AS employeeName, e.department, e.designation,
              COUNT(t.id) AS totalTasks,
              SUM(t.status = 'Completed') AS completedTasks,
              SUM(t.status != 'Completed') AS pendingTasks,
              SUM(t.due_date < CURDATE() AND t.status != 'Completed') AS overdueTasks
         FROM employees e
         LEFT JOIN tasks t ON t.employee_id = e.id
        GROUP BY e.id
        ORDER BY e.name ASC`
    );
    return rows;
  }

  const status = type === "completed" ? "Completed" : "Pending";
  const [rows] = await pool.execute(
    `SELECT t.id, t.title, t.priority, t.status,
            t.start_date AS startDate, t.due_date AS dueDate,
            e.name AS employeeName, e.department
       FROM tasks t
       JOIN employees e ON e.id = t.employee_id
      WHERE ${type === "completed" ? "t.status = :status" : "t.status != 'Completed'"}
      ORDER BY t.due_date ASC`,
    type === "completed" ? { status } : {}
  );
  return rows;
}

export async function getReports(req, res) {
  const type = req.query.type || "completed";
  const format = req.query.format || "json";
  const rows = await getReportRows(type);

  if (format === "csv") {
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${type}-tasks.csv"`);
    return res.send(toCsv(rows));
  }

  if (format === "excel") {
    res.setHeader("Content-Type", "application/vnd.ms-excel");
    res.setHeader("Content-Disposition", `attachment; filename="${type}-tasks.xls"`);
    return res.send(toExcelHtml(rows));
  }

  res.json({ type, rows });
}
