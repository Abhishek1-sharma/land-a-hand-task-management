import { Save, X } from "lucide-react";
import React from "react";
import { useEffect, useState } from "react";

const empty = {
  name: "",
  email: "",
  department: "",
  designation: "",
  phone: "",
  status: "Active"
};

export default function EmployeeForm({ editing, onCancel, onSubmit }) {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    setForm(editing ? { ...empty, ...editing } : empty);
  }, [editing]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <form className="surface form-grid" onSubmit={(event) => {
      event.preventDefault();
      onSubmit(form);
    }}>
      <label>
        Name
        <input value={form.name} onChange={(event) => update("name", event.target.value)} required />
      </label>
      <label>
        Email
        <input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} required />
      </label>
      <label>
        Department
        <input value={form.department} onChange={(event) => update("department", event.target.value)} required />
      </label>
      <label>
        Designation
        <input value={form.designation} onChange={(event) => update("designation", event.target.value)} required />
      </label>
      <label>
        Phone
        <input value={form.phone || ""} onChange={(event) => update("phone", event.target.value)} />
      </label>
      <label>
        Status
        <select value={form.status} onChange={(event) => update("status", event.target.value)}>
          <option>Active</option>
          <option>Inactive</option>
        </select>
      </label>
      <div className="form-actions">
        <button className="primary-button" type="submit"><Save size={16} /> Save</button>
        {editing && <button className="ghost-button" type="button" onClick={onCancel}><X size={16} /> Cancel</button>}
      </div>
    </form>
  );
}
