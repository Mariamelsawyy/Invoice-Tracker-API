import { Router } from "express";
import { pool } from "../db";

export const invoicesRouter = Router();

invoicesRouter.post("/", async (req, res) => {
  const { client_id, amount, due_date } = req.body ?? {};

  if (!Number.isInteger(client_id) || typeof amount !== "number" || typeof due_date !== "string") {
    res.status(400).json({ error: "client_id (integer), amount (number) and due_date (text) are required" });
    return;
  }

  try {
    const result = await pool.query(
      "INSERT INTO invoices (client_id, amount, due_date) VALUES ($1, $2, $3) RETURNING *",
      [client_id, amount, due_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === "23503") {
      res.status(404).json({ error: "Client not found" });
      return;
    }
    if (code === "23514" || code === "22007") {
      res.status(400).json({ error: "Invalid amount or due_date" });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
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