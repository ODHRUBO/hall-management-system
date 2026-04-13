# 🏛️ University Hall Management System

A full-stack web application for managing university dormitory halls, room allocations, payments, and complaints.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router 6, Recharts |
| Backend | Node.js, Express.js |
| Database | PostgreSQL or MySQL (via Sequelize ORM) |
| Auth | JWT + bcryptjs |

---

## 📁 Project Structure

```
hall-management/
├── backend/
│   ├── config/database.js       # Sequelize DB connection
│   ├── controllers/             # Business logic
│   │   ├── authController.js
│   │   ├── hallController.js
│   │   ├── applicationController.js
│   │   ├── paymentController.js
│   │   ├── complaintController.js
│   │   └── reportController.js
│   ├── middleware/auth.js        # JWT auth + role guard
│   ├── models/index.js          # All Sequelize models
│   ├── routes/index.js          # All API routes
│   ├── server.js                # Express entry point
│   └── .env.example
└── frontend/
    └── src/
        ├── components/
        │   ├── auth/            # Login + Register pages
        │   ├── dashboard/       # Layout, UI components, Admin Dashboard
        │   ├── halls/           # Halls, Rooms, Applications
        │   ├── payments/        # Payment management
        │   ├── complaints/      # Complaint system
        │   ├── reports/         # Analytics & Reports
        │   └── users/           # User management, Student pages
        ├── contexts/AuthContext.js
        ├── services/api.js      # Axios API calls
        └── App.js               # Routes
```

---

## 🚀 Setup Instructions

### 1. Database Setup

Create a PostgreSQL (or MySQL) database:

```sql
CREATE DATABASE hall_management;
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials and JWT secret
npm run dev
```

The server starts at `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend
npm install
npm start
```

The React app starts at `http://localhost:3000`

---

## 👥 User Roles

| Role | Access |
|------|--------|
| **Admin** | Full access — users, halls, rooms, payments, complaints, reports |
| **Hall Manager** | Halls, rooms, applications, payments, complaints |
| **Student** | Apply for room, view own allocations/payments, submit complaints |

### Creating the First Admin

Since registration creates students by default, create the first admin directly in the database:

```sql
-- After running the app once (to sync tables), insert an admin:
INSERT INTO "Users" (id, name, email, password, role, "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'Admin User',
  'admin@university.edu',
  '$2a$12$...', -- run: node -e "const b=require('bcryptjs'); b.hash('yourpassword',12).then(console.log)"
  'admin',
  true,
  NOW(),
  NOW()
);
```

Or use the Users API endpoint after logging in as an admin to create more users.

---

## 📡 API Endpoints

### Auth
- `POST /api/auth/register` — Student registration
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Get current user
- `PUT /api/auth/profile` — Update profile
- `PUT /api/auth/change-password` — Change password

### Users (Admin)
- `GET /api/users` — List all users
- `POST /api/users` — Create user
- `PUT /api/users/:id` — Update user
- `DELETE /api/users/:id` — Deactivate user

### Halls & Rooms
- `GET/POST /api/halls`
- `PUT/DELETE /api/halls/:id`
- `GET/POST /api/rooms`
- `PUT/DELETE /api/rooms/:id`

### Applications
- `GET /api/applications` — List (filtered by role)
- `POST /api/applications` — Submit (student)
- `PUT /api/applications/:id/review` — Approve/reject

### Allocations
- `GET /api/allocations` — Active allocations

### Payments
- `GET /api/payments` — List payments
- `GET /api/payments/summary` — Summary stats
- `POST /api/payments/generate` — Generate monthly fees
- `PUT /api/payments/:id/confirm` — Confirm payment
- `PUT /api/payments/mark-overdue` — Mark overdue

### Complaints
- `GET /api/complaints`
- `POST /api/complaints` — Submit (student)
- `PUT /api/complaints/:id/update` — Update status
- `GET /api/complaints/stats`

### Reports
- `GET /api/reports/dashboard` — Summary stats
- `GET /api/reports/occupancy`
- `GET /api/reports/payments?year=2025`
- `GET /api/reports/complaints`

---

## ✅ Sprint Completion

| Sprint | Module | Status |
|--------|--------|--------|
| Sprint 1 | User Management & Security | ✅ Complete |
| Sprint 2 | Hall & Room Allocation Management | ✅ Complete |
| Sprint 3 | Payment Management | ✅ Complete |
| Sprint 4 | Complaint Management System | ✅ Complete |
| Sprint 5 | Reports, Logs, and Data Management | ✅ Complete |

---

## 🔒 Security Features

- Passwords hashed with **bcryptjs** (12 salt rounds)
- **JWT** authentication with expiry
- **Role-based access control** on every API route
- Input validation with **express-validator**
- SQL injection protection via **Sequelize ORM**
