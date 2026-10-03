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

describe("POST /clients", () => {
  it("creates a client", async () => {
    const res = await request(app)
      .post("/clients")
      .send({ name: "Nile Traders", email: "nile@example.com" });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe("nile@example.com");
    expect(res.body.id).toBe(1);
  });

  it("rejects a duplicate email with 409", async () => {
    await request(app).post("/clients").send({ name: "A", email: "same@example.com" });
    const res = await request(app).post("/clients").send({ name: "B", email: "same@example.com" });

    expect(res.status).toBe(409);
  });

  it("rejects an invalid email with 400", async () => {
    const res = await request(app)
      .post("/clients")
      .send({ name: "Bad Email", email: "not-an-email" });

    expect(res.status).toBe(400);
  });
});