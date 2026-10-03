import { Router } from "express";
import { pool } from "../db";

import {
  createInvoiceSchema,
  listInvoicesQuerySchema,
  idParamSchema,
  updateStatusSchema,
} from "../schemas";

export const invoicesRouter = Router();

invoicesRouter.post("/", async (req, res) => {
  const parsed = createInvoiceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Validation failed",
      details: parsed.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      })),
    });
    return;
  }
  const { client_id, amount, due_date, vat_rate, status } = parsed.data;

  const result = await pool.query(
        "INSERT INTO invoices (client_id, amount, due_date, vat_rate, status) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [client_id, amount, due_date, vat_rate, status]
  );
  res.status(201).json(result.rows[0]);
 
});

const INVOICE_SELECT = `
  SELECT id, client_id, amount, vat_rate, status, due_date, created_at,
         ROUND(amount * (1 + vat_rate / 100), 2) AS total,
         (status <> 'paid' AND due_date < CURRENT_DATE) AS is_overdue
  FROM invoices`;

invoicesRouter.get("/", async (req, res) => {
  const parsed = listInvoicesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({
      error: "Validation failed",
      details: parsed.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      })),
    });
    return;
  }
  const { status, overdue } = parsed.data;

  const conditions: string[] = [];
  const values: unknown[] = [];

  if (status) {
    values.push(status);
    conditions.push(`status = $${values.length}`);
  }
  if (overdue) {
    conditions.push("status <> 'paid' AND due_date < CURRENT_DATE");
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const result = await pool.query(`${INVOICE_SELECT} ${where} ORDER BY id`, values);
  res.json(result.rows);
});

invoicesRouter.get("/:id", async (req, res) => {
  const parsedId = idParamSchema.safeParse(req.params);
  if (!parsedId.success) {
    res.status(400).json({ error: "id must be a positive integer" });
    return;
  }

  const result = await pool.query(`${INVOICE_SELECT} WHERE id = $1`, [parsedId.data.id]);
  if (result.rows.length === 0) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }
  res.json(result.rows[0]);
});

invoicesRouter.patch("/:id/status", async (req, res) => {
  const parsedId = idParamSchema.safeParse(req.params);
  const parsedBody = updateStatusSchema.safeParse(req.body);
  if (!parsedId.success || !parsedBody.success) {
    res.status(400).json({ error: "Valid id and status (draft, sent or paid) are required" });
    return;
  }

  const update = await pool.query(
    "UPDATE invoices SET status = $1 WHERE id = $2 RETURNING id",
    [parsedBody.data.status, parsedId.data.id]
  );
  if (update.rows.length === 0) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }

  const result = await pool.query(`${INVOICE_SELECT} WHERE id = $1`, [parsedId.data.id]);
  res.json(result.rows[0]);
});

invoicesRouter.delete("/:id", async (req, res) => {
  const parsedId = idParamSchema.safeParse(req.params);
  if (!parsedId.success) {
    res.status(400).json({ error: "id must be a positive integer" });
    return;
  }

  const result = await pool.query("DELETE FROM invoices WHERE id = $1 RETURNING id", [
    parsedId.data.id,
  ]);
  if (result.rows.length === 0) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }
  res.status(204).send();
});