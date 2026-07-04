const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getToken() {
  return localStorage.getItem("etms_token") || sessionStorage.getItem("etms_token");
}

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData)) headers["Content-Type"] = "application/json";
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || "Request failed");
    error.details = data.errors || data.details;
    throw error;
  }
  return data;
}

export const api = {
  register: (payload) => request("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload) => request("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  dashboard: () => request("/tasks/dashboard"),
  employees: (params = {}) => {
    const query = typeof params === "string"
      ? `search=${encodeURIComponent(params)}`
      : new URLSearchParams(Object.entries(params).filter(([, value]) => value !== "" && value != null)).toString();
    return request(`/employees${query ? `?${query}` : ""}`);
  },
  createEmployee: (payload) =>
    request("/employees", { method: "POST", body: JSON.stringify(payload) }),
  updateEmployee: (id, payload) =>
    request(`/employees/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteEmployee: (id) => request(`/employees/${id}`, { method: "DELETE" }),
  tasks: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, value]) => value !== "" && value != null)
    ).toString();
    return request(`/tasks${query ? `?${query}` : ""}`);
  },
  createTask: (payload) => request("/tasks", { method: "POST", body: JSON.stringify(payload) }),
  updateTask: (id, payload) =>
    request(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  updateTaskStatus: (id, status) =>
    request(`/tasks/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: "DELETE" }),
  notifications: () => request("/notifications"),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: "PATCH" }),
  emailLogs: () => request("/notifications/emails"),
  reports: (type, format = "json") => request(`/reports?type=${type}&format=${format}`),
  reportUrl: (type, format) => `${API_URL}/reports?type=${type}&format=${format}`,
  attachmentUrl: (id) => `${API_URL}/tasks/${id}/attachment`
};

export function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
