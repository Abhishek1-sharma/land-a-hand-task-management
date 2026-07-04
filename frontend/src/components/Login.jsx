import { Eye, EyeOff, LockKeyhole, Mail, UserPlus } from "lucide-react";
import React from "react";
import { useState } from "react";

export default function Login({ onLogin, onRegister }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Admin",
    rememberMe: false
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function validateRegister() {
    if (mode !== "register") return "";
    if (form.password.length < 8) return "Password must be at least 8 characters.";
    if (!/[A-Z]/.test(form.password)) return "Password must include one uppercase letter.";
    if (!/[a-z]/.test(form.password)) return "Password must include one lowercase letter.";
    if (!/[0-9]/.test(form.password)) return "Password must include one number.";
    if (form.password !== form.confirmPassword) return "Passwords do not match.";
    return "";
  }

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const validationError = validateRegister();
      if (validationError) throw new Error(validationError);
      if (mode === "login") await onLogin(form);
      else {
        await onRegister(form);
        setMode("login");
        setSuccess("Registration successful. Please sign in.");
        setForm({
          fullName: "",
          email: form.email,
          password: "",
          confirmPassword: "",
          role: "Admin",
          rememberMe: false
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-panel">
        <div>
          <p className="eyebrow">Lend A Hand India</p>
          <h1>{mode === "login" ? "Employee Task Management" : "Create account"}</h1>
          <p className="muted">Manage employees, assignments, due dates, reports, and progress.</p>
        </div>
        <form className="form-stack" onSubmit={submit} autoComplete="off">
          {mode === "register" && (
            <label>
              Full Name
              <span className="input-wrap">
                <UserPlus size={18} />
                <input
                  name="full_name"
                  autoComplete="off"
                  value={form.fullName}
                  onChange={(event) => setForm({ ...form, fullName: event.target.value })}
                  required
                />
              </span>
            </label>
          )}
          <label>
            Email
            <span className="input-wrap">
              <Mail size={18} />
              <input
                name={mode === "login" ? "login_email" : "register_email"}
                autoComplete="off"
                placeholder={mode === "login" ? "admin@lendahand.org" : "name@example.com"}
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                required
              />
            </span>
          </label>
          <label>
            Password
            <span className="input-wrap">
              <LockKeyhole size={18} />
              <input
                name={mode === "login" ? "login_password" : "register_password"}
                autoComplete={mode === "login" ? "off" : "new-password"}
                placeholder={mode === "login" ? "Admin@123" : "Minimum 8 chars, Aa1"}
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                required
              />
              <button className="icon-plain" type="button" onClick={() => setShowPassword((value) => !value)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
            {mode === "register" && <span className="hint">Use 8+ characters with uppercase, lowercase, and a number.</span>}
          </label>
          {mode === "register" && (
            <>
              <label>
                Confirm Password
                <span className="input-wrap">
                  <LockKeyhole size={18} />
                  <input
                    name="confirm_password"
                    autoComplete="new-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
                    required
                  />
                  <button className="icon-plain" type="button" onClick={() => setShowConfirmPassword((value) => !value)}>
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </span>
              </label>
              <label>
                Role
                <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
                  <option>Admin</option>
                  <option>Employee</option>
                </select>
              </label>
            </>
          )}
          {mode === "login" && (
            <label className="check-row">
              <input
                type="checkbox"
                checked={form.rememberMe}
                onChange={(event) => setForm({ ...form, rememberMe: event.target.checked })}
              />
              Remember me
            </label>
          )}
          {success && <div className="success inline-message">{success}</div>}
          {error && <div className="error">{error}</div>}
          <button className="primary-button" disabled={loading}>
            {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Register"}
          </button>
          <button className="ghost-button" type="button" onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError("");
            setSuccess("");
          }}>
            {mode === "login" ? "Create new account" : "Back to login"}
          </button>
        </form>
      </section>
    </main>
  );
}
