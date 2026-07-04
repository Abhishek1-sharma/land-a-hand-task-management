<<<<<<< HEAD

# Employee Task Management System

Full stack assignment project for Lend A Hand India. The application helps an admin manage employees, assign tasks, track due dates, update progress, and review dashboard metrics.

## Tech Stack

- Frontend: React, Vite, CSS, lucide-react
- Backend: Node.js, Express.js
- Database: MySQL
- Auth: JWT
- Validation: Zod

## Features

- Admin login with JWT-based protected APIs
- User registration with Admin / Employee roles
- Remember Me login option
- Role-based Admin and Employee dashboards
- Employee create, read, update, delete
- Employee search, sort, and pagination
- Task create, read, update, delete
- Assign tasks to employees
- Employees see only their own tasks
- Track task status: Pending, In Progress, Completed
- Track task priority: Low, Medium, High, Critical
- Start date and due date validation
- Due date and overdue task visibility
- Completed tasks cannot be edited or deleted
- Dashboard summary for employees and tasks
- Search employees
- Filter tasks by keyword, status, and priority
- Notifications for task assignment, due-soon, and completion
- Email notification queue logs for notification events
- File attachment support for PDF, JPG, and PNG up to 5 MB
- Completed, pending, and employee-wise reports
- CSV and Excel-compatible report export
- Unit tests for validation rules
- Docker setup for MySQL, backend, and frontend
- Responsive dashboard UI
- Centralized validation and error responses
- Relational MySQL schema with indexes and foreign keys

## Project Structure

```text
backend/                 Node.js + Express REST API
frontend/                React + Vite frontend
database/schema.sql      Main database script with seed data
database/create_app_user.sql  Optional MySQL app-user script
docs/architecture.md     Architecture / flow diagram
```

## Prerequisites

- Node.js 20 or later
- npm
- MySQL 8 or MariaDB through XAMPP

On Windows PowerShell, use `npm.cmd` if `npm` is blocked by execution policy.

## Database Setup

Run the main database script:

```bash
mysql -u root -p < database/schema.sql
```

For XAMPP MySQL with no root password:

```bash
C:\xampp\mysql\bin\mysql.exe -u root < database/schema.sql
```

Optional for production-style setup: create a dedicated app user.

```bash
mysql -u root -p < database/create_app_user.sql
```

Default application login:

```text
Admin Email: admin@lendahand.org
Admin Password: Admin@123

Employee Email: aarav.mehta@example.com
Employee Password: Employee@123
```

## Backend Setup

```bash
cd backend
copy .env.example .env
npm.cmd install
npm.cmd run dev
```

Default backend environment for XAMPP:

```text
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=employee_task_management
```

If you create the dedicated app user, update `backend/.env`:

```text
DB_USER=etms_user
DB_PASSWORD=Etms@12345
```

Backend URL:

```text
http://localhost:5000
```

Health check:

```text
GET http://localhost:5000/api/health
```

## Frontend Setup

Open a second terminal:

```bash
cd frontend
npm.cmd install
npm.cmd run dev
```

Frontend URL:

```text
http://localhost:5173
```

Production build:

```bash
cd frontend
npm.cmd run build
```

## Tests

```bash
cd backend
npm.cmd test
```

## Docker Setup

Docker Compose is included for a containerized run:

```bash
docker compose up --build
```

Services:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- MySQL: `localhost:3306`

## API Summary

Authentication:

- `POST /register`
- `POST /login`
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/me`

Employees:

- `GET /api/employees`
- `POST /api/employees`
- `PUT /api/employees/:id`
- `DELETE /api/employees/:id`

Tasks:

- `GET /api/tasks/dashboard`
- `GET /api/tasks`
- `POST /api/tasks`
- `PUT /api/tasks/:id`
- `PATCH /api/tasks/:id/status`
- `DELETE /api/tasks/:id`

Notifications:

- `GET /api/notifications`
- `GET /api/notifications/emails`
- `PATCH /api/notifications/:id/read`

Reports:

- `GET /api/reports?type=completed&format=json`
- `GET /api/reports?type=pending&format=csv`
- `GET /api/reports?type=employee-wise&format=excel`

Protected routes require:

```text
Authorization: Bearer <token>
```
