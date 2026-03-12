# HRMS Lite — Human Resource Management System

[![Backend Tests](https://github.com/kapilraghav2801/HRMS/actions/workflows/test.yml/badge.svg)](https://github.com/kapilraghav2801/HRMS/actions/workflows/test.yml)

A full-stack HRMS application built with **FastAPI + PostgreSQL** (backend) and **React + Vite** (frontend),
featuring complete employee management, attendance tracking, and a live dashboard.

---

## Features

- Full CRUD for employees and attendance (add, edit, delete)
- Attendance statuses: Present / Absent / Late / Half Day
- Department filter and date-range filter
- Duplicate employee ID and email prevention
- Dashboard with stats, department breakdown, attendance rate
- 43 automated tests with **96.66% code coverage** (threshold: 70%)
- CI/CD via GitHub Actions on every push/PR to `main`
- React frontend with sidebar navigation, modals, and live toast notifications

---

## Tech Stack

| Layer | Technology |
| ---------- | ------------------------------ |
| Backend | FastAPI, SQLAlchemy, PostgreSQL |
| Frontend | React 19, Vite, TailwindCSS |
| Testing | Pytest, SQLite (in-memory) |
| Deployment | Render (API) + Vercel (UI) |

---

## Project Structure

```
HRMS/
├── app/
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   ├── crud.py
│   ├── database.py
│   └── routers/
│       ├── employees.py
│       ├── attendance.py
│       └── dashboard.py
├── tests/
│   └── test_api.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.jsx
│   └── package.json
├── .github/
│   └── workflows/
│       └── test.yml
├── .env.example
├── pytest.ini
├── render.yaml
└── requirements.txt
```

---

## Quick Start

```bash
# 1. Clone & install backend
git clone https://github.com/kapilraghav2801/HRMS.git
cd HRMS
pip install -r requirements.txt
# 2. Copy env and start backend
cp .env.example .env
uvicorn app.main:app --reload --port 8000
# 3. Start frontend (in a separate terminal)
cd frontend
npm install
npm run dev
```

- Backend API docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Frontend: [http://localhost:5173](http://localhost:5173)

---

## Running Tests

```bash
pytest
```

---

## Environment Variables

| Variable | Default | Description |
| ------------------- | ------------------------------ | ------------------------------------ |
| `DATABASE_URL` | PostgreSQL connection string | Production DB (PostgreSQL on Render) |
| `TEST_DATABASE_URL` | `sqlite:///./test_hrms.db` | Test DB (SQLite in-memory) |
| `CORS_ORIGINS` | `http://localhost:5173,...` | Comma-separated allowed origins |

---

## API Endpoints

See [API.md](API.md) for full documentation.

| Method | Path | Description |
| -------------- | ----------------------------- | ---------------------------- |
| GET | `/api/health` | Health check |
| POST | `/api/employees/` | Create employee |
| GET | `/api/employees/` | List / search employees |
| GET | `/api/employees/departments` | List departments |
| GET | `/api/employees/{id}` | Get employee |
| PUT | `/api/employees/{id}` | Update employee |
| DELETE | `/api/employees/{id}` | Delete employee |
| GET | `/api/employees/{id}/summary` | Attendance summary |
| POST | `/api/attendance/` | Mark attendance |
| GET | `/api/attendance/` | List attendance (filters) |
| GET | `/api/attendance/today` | Today's attendance |
| GET/PUT/DELETE | `/api/attendance/{id}` | Get / update / delete record |
| GET | `/api/dashboard/stats` | Dashboard statistics |

## Live URL

[https://hrms-v76q.vercel.app/](https://hrms-v76q.vercel.app/)

---

## Screenshots

### Dashboard

![Dashboard](https://github.com/user-attachments/assets/57f15c18-956b-431d-8511-9069372144c1)

### Employee Management

![Employees](https://api.microlink.io/?url=https://hrms-v76q.vercel.app/employees&screenshot=true&meta=false&embed=screenshot.url&waitForSelector=table)

### Attendance Tracking

![Attendance](https://image.thum.io/get/width/1280/https://hrms-v76q.vercel.app/attendance)
