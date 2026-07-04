import {
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  Download,
  LogOut,
  Bell,
  Pencil,
  Plus,
  FileText,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import React from "react";
import { useEffect, useMemo, useState } from "react";
import EmployeeForm from "./components/EmployeeForm.jsx";
import Login from "./components/Login.jsx";
import StatCard from "./components/StatCard.jsx";
import TaskForm from "./components/TaskForm.jsx";
import { api } from "./services/api.js";
import { authHeaders } from "./services/api.js";

const adminTabs = [
  { id: "tasks", label: "Tasks", icon: ClipboardList },
  { id: "employees", label: "Employees", icon: Users },
  { id: "reports", label: "Reports", icon: Download },
  { id: "notifications", label: "Alerts", icon: Bell },
];

const employeeTabs = [
  { id: "tasks", label: "My Tasks", icon: ClipboardList },
  { id: "notifications", label: "Alerts", icon: Bell },
];

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function isOverdue(task) {
  return (
    task.status !== "Completed" &&
    new Date(task.dueDate) < new Date(new Date().toDateString())
  );
}

function readAttachment(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    const allowed = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowed.includes(file.type))
      return reject(new Error("Only PDF, JPG and PNG files are allowed"));
    if (file.size > 5 * 1024 * 1024)
      return reject(new Error("File must be 5 MB or smaller"));
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        name: file.name,
        type: file.type,
        size: file.size,
        data: String(reader.result).split(",")[1],
      });
    reader.onerror = () => reject(new Error("Unable to read file"));
    reader.readAsDataURL(file);
  });
}

export default function App() {
  const [user, setUser] = useState(() => {
    const stored =
      localStorage.getItem("etms_user") || sessionStorage.getItem("etms_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [activeTab, setActiveTab] = useState("tasks");
  const [dashboard, setDashboard] = useState({});
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [taskFilters, setTaskFilters] = useState({
    search: "",
    status: "",
    priority: "",
  });
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [employeePage, setEmployeePage] = useState(1);
  const [employeeMeta, setEmployeeMeta] = useState({
    page: 1,
    pages: 1,
    total: 0,
  });
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("DESC");
  const [notifications, setNotifications] = useState([]);
  const [emailLogs, setEmailLogs] = useState([]);

  const activeEmployees = useMemo(
    () => employees.filter((employee) => employee.status === "Active"),
    [employees],
  );
  const unreadNotificationIds = useMemo(
    () =>
      notifications
        .filter((notification) => !notification.isRead)
        .map((notification) => notification.id),
    [notifications],
  );
  const unreadCount = unreadNotificationIds.length;

  async function loadData() {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const employeeParams = {
        search: employeeSearch,
        page: employeePage,
        limit: 8,
        sortBy,
        sortOrder,
      };
      const [stats, employeeRows, taskRows, notificationRows, emailRows] =
        await Promise.all([
          api.dashboard(),
          user.role === "Admin"
            ? api.employees(employeeParams)
            : Promise.resolve({ data: [], pagination: {} }),
          api.tasks(taskFilters),
          api.notifications(),
          user.role === "Admin" ? api.emailLogs() : Promise.resolve([]),
        ]);
      setDashboard(stats);
      setEmployees(employeeRows.data || employeeRows);
      setEmployeeMeta(
        employeeRows.pagination || { page: 1, pages: 1, total: 0 },
      );
      setTasks(taskRows);
      setNotifications(notificationRows);
      setEmailLogs(emailRows);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [
    user,
    employeeSearch,
    employeePage,
    sortBy,
    sortOrder,
    taskFilters.search,
    taskFilters.status,
    taskFilters.priority,
  ]);

  useEffect(() => {
    if (!user) return undefined;
    const refresh = setInterval(() => loadData(), 15000);
    const onFocus = () => loadData();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(refresh);
      window.removeEventListener("focus", onFocus);
    };
  }, [user, activeTab]);

  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => setMessage(""), 3000);
    return () => clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    if (!user || activeTab !== "notifications" || unreadCount === 0) return;

    Promise.all(
      unreadNotificationIds.map((id) => api.markNotificationRead(id)),
    )
      .then(() => {
        setNotifications((current) =>
          current.map((notification) => ({ ...notification, isRead: true })),
        );
      })
      .catch((err) => setError(err.message));
  }, [user, activeTab, unreadCount, unreadNotificationIds]);

  async function handleLogin(credentials) {
    const data = await api.login(credentials);
    const store = credentials.rememberMe ? localStorage : sessionStorage;
    localStorage.removeItem("etms_token");
    localStorage.removeItem("etms_user");
    sessionStorage.removeItem("etms_token");
    sessionStorage.removeItem("etms_user");
    store.setItem("etms_token", data.token);
    store.setItem("etms_user", JSON.stringify(data.user));
    setUser(data.user);
    setActiveTab("tasks");
  }

  async function handleRegister(payload) {
    await api.register(payload);
    setMessage("Registration successful. Please sign in.");
  }

  function logout() {
    localStorage.removeItem("etms_token");
    localStorage.removeItem("etms_user");
    sessionStorage.removeItem("etms_token");
    sessionStorage.removeItem("etms_user");
    setUser(null);
    setActiveTab("tasks");
  }

  async function saveEmployee(payload) {
    try {
      if (editingEmployee)
        await api.updateEmployee(editingEmployee.id, payload);
      else await api.createEmployee(payload);
      setMessage(editingEmployee ? "Employee updated" : "Employee added");
      setEditingEmployee(null);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveTask(payload) {
    try {
      const attachment = await readAttachment(payload.file);
      const taskPayload = { ...payload, attachment };
      delete taskPayload.file;
      if (editingTask) await api.updateTask(editingTask.id, taskPayload);
      else await api.createTask(taskPayload);
      setMessage(editingTask ? "Task updated" : "Task assigned");
      setEditingTask(null);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeEmployee(id) {
    if (!confirm("Delete this employee and their tasks?")) return;
    await api.deleteEmployee(id);
    setMessage("Employee deleted");
    await loadData();
  }

  async function removeTask(id) {
    if (!confirm("Delete this task?")) return;
    await api.deleteTask(id);
    setMessage("Task deleted");
    await loadData();
  }

  async function changeStatus(task, status) {
    try {
      await api.updateTaskStatus(task.id, status);
      setTasks((current) =>
        current.map((item) =>
          item.id === task.id ? { ...item, status } : item,
        ),
      );
      setMessage("Task status updated");
      await loadData();
    } catch (err) {
      setError(err.message);
      await loadData();
    }
  }

  function downloadReport(type, format) {
    const url = api.reportUrl(type, format);
    fetch(url, { headers: authHeaders() })
      .then((response) => response.blob())
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${type}-tasks.${format === "excel" ? "xls" : "csv"}`;
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch((err) => setError(err.message));
  }

  function downloadAttachment(task) {
    fetch(api.attachmentUrl(task.id), { headers: authHeaders() })
      .then((response) => response.blob())
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = task.attachmentName || "task-file";
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch((err) => setError(err.message));
  }

  if (!user) return <Login onLogin={handleLogin} onRegister={handleRegister} />;

  const tabs = user.role === "Admin" ? adminTabs : employeeTabs;

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <BriefcaseBusiness size={26} />
          <div>
            <strong>ETMS</strong>
            <span>Lend A Hand India</span>
          </div>
        </div>
        <nav>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={activeTab === tab.id ? "active" : ""}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={18} /> {tab.label}
                {tab.id === "notifications" && unreadCount > 0 && (
                  <span className="badge">{unreadCount}</span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Welcome, {user.name}</p>
            <h1>Employee Task Management System</h1>
            <p className="muted">{user.role} dashboard</p>
          </div>
          <button className="ghost-button" onClick={logout}>
            <LogOut size={16} /> Logout
          </button>
        </header>

        <section className="stats-grid">
          <StatCard
            label={user.role === "Admin" ? "Employees" : "My Tasks"}
            value={dashboard.totalEmployees || dashboard.myTasks}
          />
          <StatCard
            label={user.role === "Admin" ? "Active" : "Overdue"}
            value={dashboard.activeEmployees || dashboard.overdueTasks}
            tone={user.role === "Admin" ? "green" : "red"}
          />
          <StatCard
            label="Pending"
            value={dashboard.pendingTasks}
            tone="amber"
          />
          {user.role === "Admin" && (
            <StatCard
              label="In Progress"
              value={dashboard.inProgressTasks}
              tone="blue"
            />
          )}
          <StatCard
            label="Completed"
            value={dashboard.completedTasks}
            tone="green"
          />
          {user.role === "Admin" && (
            <StatCard
              label="Overdue"
              value={dashboard.overdueTasks}
              tone="red"
            />
          )}
        </section>

        {(error || message) && (
          <div className={error ? "notice error" : "notice success"}>
            {error || message}
            {error && <button onClick={() => setError("")}>Dismiss</button>}
          </div>
        )}

        {activeTab === "tasks" && (
          <section className="content-grid">
            {user.role === "Admin" && (
              <div className="panel">
                <div className="section-head">
                  <div>
                    <h2>{editingTask ? "Edit task" : "Assign task"}</h2>
                    <p className="muted">
                      Create assignments with owners, due dates, priority, and
                      status.
                    </p>
                  </div>
                  {!editingTask && <Plus size={20} />}
                </div>
                <TaskForm
                  employees={editingTask ? employees : activeEmployees}
                  editing={editingTask}
                  onCancel={() => setEditingTask(null)}
                  onSubmit={saveTask}
                />
              </div>
            )}

            <div className="panel wide">
              <div className="section-head row">
                <div>
                  <h2>Tasks</h2>
                  <p className="muted">
                    {loading
                      ? "Loading..."
                      : `${tasks.length} assignment records`}
                  </p>
                </div>
                <div className="filters">
                  <span className="search-box">
                    <Search size={16} />
                    <input
                      placeholder="Search task or employee"
                      value={taskFilters.search}
                      onChange={(event) =>
                        setTaskFilters({
                          ...taskFilters,
                          search: event.target.value,
                        })
                      }
                    />
                  </span>
                  <select
                    value={taskFilters.status}
                    onChange={(event) =>
                      setTaskFilters({
                        ...taskFilters,
                        status: event.target.value,
                      })
                    }
                  >
                    <option value="">All status</option>
                    <option>Pending</option>
                    <option>In Progress</option>
                    <option>Completed</option>
                  </select>
                  <select
                    value={taskFilters.priority}
                    onChange={(event) =>
                      setTaskFilters({
                        ...taskFilters,
                        priority: event.target.value,
                      })
                    }
                  >
                    <option value="">All priority</option>
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Critical</option>
                  </select>
                </div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Employee</th>
                      <th>Due</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => (
                      <tr
                        key={task.id}
                        className={isOverdue(task) ? "overdue-row" : ""}
                      >
                        <td>
                          <strong>{task.title}</strong>
                          <span>{task.description || "No description"}</span>
                        </td>
                        <td>
                          {task.employeeName}
                          <span>{task.department}</span>
                        </td>
                        <td>
                          <span>{formatDate(task.startDate)}</span>
                          {formatDate(task.dueDate)}
                        </td>
                        <td>
                          <span
                            className={`pill ${task.priority.toLowerCase()}`}
                          >
                            {task.priority}
                          </span>
                        </td>
                        <td>
                          <select
                            value={task.status}
                            onChange={(event) =>
                              changeStatus(task, event.target.value)
                            }
                          >
                            <option>Pending</option>
                            <option>In Progress</option>
                            <option>Completed</option>
                          </select>
                        </td>
                        <td className="icon-actions">
                          {task.attachmentName && (
                            <button
                              title="Download file"
                              onClick={() => downloadAttachment(task)}
                            >
                              <FileText size={16} />
                            </button>
                          )}
                          {user.role === "Admin" &&
                            task.status !== "Completed" && (
                              <button
                                title="Edit task"
                                onClick={() => setEditingTask(task)}
                              >
                                <Pencil size={16} />
                              </button>
                            )}
                          {user.role === "Admin" &&
                            task.status !== "Completed" && (
                              <button
                                title="Delete task"
                                onClick={() => removeTask(task.id)}
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                        </td>
                      </tr>
                    ))}
                    {!tasks.length && (
                      <tr>
                        <td colSpan="6" className="empty">
                          No tasks found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {activeTab === "employees" && user.role === "Admin" && (
          <section className="content-grid employees-grid">
            <div className="panel">
              <div className="section-head">
                <div>
                  <h2>{editingEmployee ? "Edit employee" : "Add employee"}</h2>
                  <p className="muted">
                    Maintain employee details for task allocation.
                  </p>
                </div>
              </div>
              <EmployeeForm
                editing={editingEmployee}
                onCancel={() => setEditingEmployee(null)}
                onSubmit={saveEmployee}
              />
            </div>

            <div className="panel wide">
              <div className="section-head row">
                <div>
                  <h2>Employees</h2>
                  <p className="muted">{employees.length} employee records</p>
                </div>
                <span className="search-box">
                  <Search size={16} />
                  <input
                    placeholder="Search employees"
                    value={employeeSearch}
                    onChange={(event) => setEmployeeSearch(event.target.value)}
                  />
                </span>
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                >
                  <option value="createdAt">Newest</option>
                  <option value="name">Name</option>
                  <option value="department">Department</option>
                  <option value="designation">Designation</option>
                </select>
                <select
                  value={sortOrder}
                  onChange={(event) => setSortOrder(event.target.value)}
                >
                  <option value="DESC">Desc</option>
                  <option value="ASC">Asc</option>
                </select>
              </div>
              <div className="employee-grid">
                {employees.map((employee) => (
                  <article className="employee-card" key={employee.id}>
                    <div>
                      <strong>{employee.name}</strong>
                      <span>{employee.designation}</span>
                    </div>
                    <p>{employee.email}</p>
                    <p>{employee.department}</p>
                    <div className="card-footer">
                      <span className={`pill ${employee.status.toLowerCase()}`}>
                        {employee.status}
                      </span>
                      <span>
                        <CheckCircle2 size={15} />{" "}
                        {employee.completedTasks || 0}/{employee.taskCount || 0}
                      </span>
                    </div>
                    <div className="icon-actions">
                      <button
                        title="Edit employee"
                        onClick={() => setEditingEmployee(employee)}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        title="Delete employee"
                        onClick={() => removeEmployee(employee.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </article>
                ))}
                {!employees.length && (
                  <div className="empty">No employees found</div>
                )}
              </div>
              <div className="pager">
                <button
                  className="ghost-button"
                  disabled={employeePage <= 1}
                  onClick={() => setEmployeePage((page) => page - 1)}
                >
                  Previous
                </button>
                <span>
                  Page {employeeMeta.page || 1} of {employeeMeta.pages || 1} (
                  {employeeMeta.total || 0})
                </span>
                <button
                  className="ghost-button"
                  disabled={employeePage >= (employeeMeta.pages || 1)}
                  onClick={() => setEmployeePage((page) => page + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </section>
        )}

        {activeTab === "reports" && user.role === "Admin" && (
          <section className="panel">
            <div className="section-head">
              <div>
                <h2>Reports</h2>
                <p className="muted">
                  Download completed, pending, and employee-wise reports.
                </p>
              </div>
            </div>
            <div className="report-grid">
              {["completed", "pending", "employee-wise"].map((type) => (
                <article className="employee-card" key={type}>
                  <strong>{type.replace("-", " ")} report</strong>
                  <div className="form-actions">
                    <button
                      className="primary-button"
                      onClick={() => downloadReport(type, "csv")}
                    >
                      <Download size={16} /> CSV
                    </button>
                    <button
                      className="ghost-button"
                      onClick={() => downloadReport(type, "excel")}
                    >
                      <Download size={16} /> Excel
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeTab === "notifications" && (
          <section className="panel">
            <div className="section-head">
              <div>
                <h2>Notifications</h2>
                <p className="muted">
                  {unreadCount} unread task assignment, due-soon, and completion
                  alerts.
                </p>
              </div>
            </div>
            <div className="employee-grid">
              {notifications.map((notification) => (
                <article className="employee-card" key={notification.id}>
                  <strong>{notification.type}</strong>
                  <p>{notification.message}</p>
                  <span>{formatDate(notification.createdAt)}</span>
                </article>
              ))}
              {!notifications.length && (
                <div className="empty">No notifications found</div>
              )}
            </div>
            {user.role === "Admin" && (
              <>
                <div className="section-head email-head">
                  <div>
                    <h2>Email Queue</h2>
                    <p className="muted">
                      Queued email notification records for assignment,
                      due-soon, and completion events.
                    </p>
                  </div>
                </div>
                <div className="employee-grid">
                  {emailLogs.map((email) => (
                    <article className="employee-card" key={email.id}>
                      <strong>{email.subject}</strong>
                      <p>{email.recipientEmail}</p>
                      <span>
                        {email.status} - {formatDate(email.createdAt)}
                      </span>
                    </article>
                  ))}
                  {!emailLogs.length && (
                    <div className="empty">No email logs found</div>
                  )}
                </div>
              </>
            )}
          </section>
        )}
      </section>
    </main>
  );
}
