import { Router } from "express";
import { pool } from "../db";
import { createInvoiceSchema } from "../schemas";

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

invoicesRouter.get("/", async (_req, res) => {
  try {
    const result = await pool.query("SELECT * FROM invoices ORDER BY id");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});