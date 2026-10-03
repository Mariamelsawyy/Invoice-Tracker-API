# Invoice Tracker API
![CI](https://github.com/Mariamelsawyy/Invoice-Tracker-API/actions/workflows/ci.yml/badge.svg)

A REST API for managing clients and invoices, built with Node.js, TypeScript, Express and PostgreSQL. It's a personal learning project that models a small accounting-style backend: invoices have a VAT rate, a status, and a due date, and the API calculates totals and overdue flags.

## Features

- CRUD for clients and invoices, with proper HTTP status codes (200, 201, 204, 400, 404, 409, 500)
- Invoice total including VAT, calculated in SQL with `NUMERIC` to avoid floating-point rounding errors
- Overdue flag (unpaid and past due date), calculated at query time, plus filters: `?status=sent` and `?overdue=true`
- Input validation with Zod, with a clear message for each invalid field
- Parameterized SQL queries (no string concatenation of user input)
- Database constraints as a second line of defense (unique email, foreign key, amount and status checks)
- One shared error-handling middleware that hides internal details from clients
- Automated tests with Vitest and Supertest, run against a separate test database

## Tech stack

Node.js, TypeScript, Express, PostgreSQL (`pg`), Zod, Vitest, Supertest, Docker Compose

## Getting started

Requires Node.js 20+, Docker and Git.

```bash
git clone https://github.com/Mariamelsawyy/invoice-tracker-api.git
cd invoice-tracker-api
npm install
```

1. Copy `.env.example` to `.env` and fill in values (choose any user and password for the local database):

```
   PORT=3000
   DB_HOST=localhost
   DB_PORT=5433
   DB_USER=invoice_user
   DB_PASSWORD=choose_a_password
   DB_NAME=invoice_db
```

   Port 5433 is used so it doesn't clash with a PostgreSQL already installed on port 5432.

2. Start the database and create the tables:

```bash
   docker compose up -d
```

   PowerShell:

```powershell
   Get-Content db/schema.sql | docker exec -i invoice-db psql -U invoice_user -d invoice_db
```

   macOS / Linux:

```bash
   docker exec -i invoice-db psql -U invoice_user -d invoice_db < db/schema.sql
```

3. Run the API:

```bash
   npm run dev
```

   Check it at http://localhost:3000/health

## API overview

| Method | Path | Description |
|---|---|---|
| GET | `/health` | App is running |
| GET | `/db-health` | Database connection works |
| POST | `/clients` | Create a client (`name`, `email`) |
| GET | `/clients` | List clients |
| GET | `/clients/:id` | Get one client |
| DELETE | `/clients/:id` | Delete a client (409 if it still has invoices) |
| POST | `/invoices` | Create an invoice (`client_id`, `amount`, `due_date`, optional `vat_rate`, `status`) |
| GET | `/invoices` | List invoices with `total` and `is_overdue`; filters `?status=` and `?overdue=true` |
| GET | `/invoices/:id` | Get one invoice |
| PATCH | `/invoices/:id/status` | Change status to `draft`, `sent` or `paid` |
| DELETE | `/invoices/:id` | Delete an invoice |

Example:

```bash
curl -X POST http://localhost:3000/invoices \
  -H "Content-Type: application/json" \
  -d '{"client_id":1,"amount":250,"vat_rate":14,"due_date":"2026-12-01","status":"sent"}'
```

On Windows PowerShell, use `Invoke-RestMethod` with `-Method Post -ContentType "application/json" -Body '...'`.

## Running the tests

Tests use their own database so they never touch your development data:

```bash
docker exec -it invoice-db psql -U invoice_user -d invoice_db -c "CREATE DATABASE invoice_test;"
```

Apply `db/schema.sql` to `invoice_test` (same command as above, with `-d invoice_test`), then:

```bash
npm test
```

## Project structure

```
src/
  app.ts            Express app and routes (testable without opening a port)
  server.ts         Starts the server
  db.ts             PostgreSQL connection pool
  schemas.ts        Zod validation schemas
  errorHandler.ts   Shared error-handling middleware
  routes/           clients.ts, invoices.ts
db/schema.sql       Tables, constraints and indexes
tests/              Vitest + Supertest tests
docker-compose.yml  PostgreSQL container
```

## Design notes

- `app.ts` and `server.ts` are separate so tests can use the app without starting a real server.
- Money uses PostgreSQL `NUMERIC`, and calculations happen in SQL, not in JavaScript floats.
- `DATE` columns are returned as plain text to avoid timezone shifts in due dates.
- No authentication yet. It's intentionally out of scope for this project.