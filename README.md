# TransitOps - Smart Transport Operations Platform

TransitOps is a monorepo transport operations platform with an Express/PostgreSQL backend and a React/Vite frontend. It supports authentication, role-aware navigation, vehicle and driver management, trip dispatch workflows, maintenance logging, fuel/expense tracking, dashboard KPIs, and vehicle analytics reports.

## Tech Stack

- Node.js 18+
- Express
- PostgreSQL
- React 18
- Vite

## Project Structure

```text
backend/
  migrations/          PostgreSQL schema
  scripts/             migration, setup, seed, and inspection scripts
  src/
    config/            environment and database config
    middleware/        auth and error handling
    routes/api/        API route modules
frontend/
  src/
    auth/              React auth context and protected routes
    components/        shared layout, nav, vehicle, and driver components
    pages/             dashboard and feature pages
```

## Setup

1. Install dependencies:

   ```bash
   npm install
   npm install --prefix backend
   npm install --prefix frontend
   ```

2. Create the backend env file:

   ```bash
   cp backend/.env.example backend/.env
   ```

3. Update `backend/.env` for your local PostgreSQL credentials.

4. Run migrations and seed users:

   ```bash
   npm --prefix backend run migrate
   node backend/scripts/seedUsers.js
   ```

## Run

```bash
npm run dev
```

- Frontend: `http://127.0.0.1:5173/`
- Backend API: `http://localhost:4000/`

The Vite dev server proxies `/api` and `/health` to the backend.

## Seeded Test Users

- Fleet Manager: `fleet.manager@transitops.local` / `FleetManager123!`
- Driver: `driver@transitops.local` / `Driver123!`
- Safety Officer: `safety.officer@transitops.local` / `SafetyOfficer123!`
- Financial Analyst: `financial.analyst@transitops.local` / `FinancialAnalyst123!`

## API Overview

- `POST /api/auth/login`
- `GET /api/dashboard/summary`
- `GET|POST|PUT|DELETE /api/vehicles`
- `GET /api/vehicles/:id/costs`
- `GET|POST|PUT|DELETE /api/drivers`
- `GET|POST /api/trips`
- `PUT /api/trips/:id/dispatch`
- `PUT /api/trips/:id/complete`
- `PUT /api/trips/:id/cancel`
- `GET|POST /api/maintenance`
- `PUT /api/maintenance/:id/close`
- `GET|POST /api/fuel-logs`
- `GET|POST /api/expenses`
- `GET /api/reports/vehicles`

## Notes

- Vehicle mutations are restricted to Fleet Managers.
- Driver mutations are restricted to Fleet Managers and Safety Officers.
- Maintenance mutations are restricted to Fleet Managers.
- Trip dispatch uses transactional validation for vehicle availability, driver availability, license expiry, and cargo capacity.
