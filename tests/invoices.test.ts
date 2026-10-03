import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { pool } from "../src/db";

beforeEach(async () => {
  if (process.env.DB_NAME !== "invoice_test") {
    throw new Error("Refusing to clean a non-test database");
  }
  await pool.query("TRUNCATE invoices, clients RESTART IDENTITY");
});

afterAll(async () => {
  await pool.end();
});

async function createClient(): Promise<number> {
  const res = await request(app)
    .post("/clients")
    .send({ name: "Acme Ltd", email: "acme@example.com" });
  return res.body.id;
}

describe("POST /invoices", () => {
  it("creates an invoice with default VAT and status", async () => {
    const clientId = await createClient();
    const res = await request(app)
      .post("/invoices")
      .send({ client_id: clientId, amount: 100, due_date: "2099-01-01" });

    expect(res.status).toBe(201);
    expect(res.body.vat_rate).toBe("20.00");
    expect(res.body.status).toBe("draft");
  });

  it("returns 404 when the client does not exist", async () => {
    const res = await request(app)
      .post("/invoices")
      .send({ client_id: 999, amount: 100, due_date: "2099-01-01" });

    expect(res.status).toBe(404);
  });

  it("returns 400 for invalid input", async () => {
    const clientId = await createClient();
    const res = await request(app)
      .post("/invoices")
      .send({ client_id: clientId, amount: -5, due_date: "not-a-date" });

    expect(res.status).toBe(400);
    expect(res.body.details.length).toBeGreaterThanOrEqual(2);
  });
});

describe("GET /invoices", () => {
  it("calculates the total including VAT", async () => {
    const clientId = await createClient();
    await request(app)
      .post("/invoices")
      .send({ client_id: clientId, amount: 250, vat_rate: 14, due_date: "2099-01-01" });

    const res = await request(app).get("/invoices");

    expect(res.status).toBe(200);
    expect(res.body[0].total).toBe("285.00");
  });

  it("flags unpaid past-due invoices as overdue but not paid ones", async () => {
    const clientId = await createClient();
    await request(app)
      .post("/invoices")
      .send({ client_id: clientId, amount: 100, due_date: "2020-01-01", status: "sent" });
    await request(app)
      .post("/invoices")
      .send({ client_id: clientId, amount: 100, due_date: "2020-01-01", status: "paid" });

    const all = await request(app).get("/invoices");
    const overdueOnly = await request(app).get("/invoices?overdue=true");

    expect(all.body.map((i: { is_overdue: boolean }) => i.is_overdue)).toEqual([true, false]);
    expect(overdueOnly.body).toHaveLength(1);
    expect(overdueOnly.body[0].status).toBe("sent");
  });

  it("rejects an invalid status filter with 400", async () => {
    const res = await request(app).get("/invoices?status=wrong");

    expect(res.status).toBe(400);
  });
});

describe("PATCH /invoices/:id/status", () => {
  it("marks an overdue invoice as paid and clears the overdue flag", async () => {
    const clientId = await createClient();
    const created = await request(app)
      .post("/invoices")
      .send({ client_id: clientId, amount: 100, due_date: "2020-01-01", status: "sent" });

    const res = await request(app)
      .patch(`/invoices/${created.body.id}/status`)
      .send({ status: "paid" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("paid");
    expect(res.body.is_overdue).toBe(false);
  });
});