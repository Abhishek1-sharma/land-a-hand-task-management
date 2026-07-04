import { Save, X } from "lucide-react";
import React from "react";
import { useEffect, useState } from "react";

const empty = {
  title: "",
  description: "",
  employeeId: "",
  priority: "Medium",
  status: "Pending",
  startDate: "",
  dueDate: ""
};

function toDateInput(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

export default function TaskForm({ employees, editing, onCancel, onSubmit }) {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    setForm(editing ? { ...empty, ...editing, startDate: toDateInput(editing.startDate), dueDate: toDateInput(editing.dueDate) } : empty);
  }, [editing]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <form className="surface form-grid task-form" onSubmit={(event) => {
      event.preventDefault();
      onSubmit({ ...form, employeeId: Number(form.employeeId) });
    }}>
      <label>
        Title
        <input value={form.title} onChange={(event) => update("title", event.target.value)} required />
      </label>
      <label>
        Employee
        <select value={form.employeeId} onChange={(event) => update("employeeId", event.target.value)} required>
          <option value="">Select employee</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>{employee.name}</option>
          ))}
        </select>
      </label>
      <label>
        Priority
        <select value={form.priority} onChange={(event) => update("priority", event.target.value)}>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
          <option>Critical</option>
        </select>
      </label>
      <label>
        Status
        <select value={form.status} onChange={(event) => update("status", event.target.value)}>
          <option>Pending</option>
          <option>In Progress</option>
          <option>Completed</option>
        </select>
      </label>
      <label>
        Start date
        <input type="date" value={form.startDate} onChange={(event) => update("startDate", event.target.value)} required />
      </label>
      <label>
        Due date
        <input type="date" value={form.dueDate} onChange={(event) => update("dueDate", event.target.value)} required />
      </label>
      <label>
        Attachment
        <input
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          onChange={(event) => update("file", event.target.files?.[0] || null)}
        />
      </label>
      <label className="span-2">
        Description
        <textarea value={form.description || ""} onChange={(event) => update("description", event.target.value)} rows="3" />
      </label>
      <div className="form-actions">
        <button className="primary-button" type="submit"><Save size={16} /> Save</button>
        {editing && <button className="ghost-button" type="button" onClick={onCancel}><X size={16} /> Cancel</button>}
      </div>
    </form>
  );
}
