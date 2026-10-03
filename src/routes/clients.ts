import { Router } from "express";
import { pool } from "../db";
import { 
  createClientSchema, 
  idParamSchema } 
  from "../schemas";

export const clientsRouter = Router();

clientsRouter.post("/", async (req, res) => {
  const parsed = createClientSchema.safeParse(req.body);
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
  const { name, email } = parsed.data;

  const result = await pool.query(
    "INSERT INTO clients (name, email) VALUES ($1, $2) RETURNING id, name, email, created_at",
    [name, email]
  );
  res.status(201).json(result.rows[0]);
});

clientsRouter.get("/", async (_req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, created_at FROM clients ORDER BY id"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

clientsRouter.get("/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: "id must be a positive integer" });
    return;
  }

  try {
    const result = await pool.query(
      "SELECT id, name, email, created_at FROM clients WHERE id = $1",
      [id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Client not found" });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

clientsRouter.delete("/:id", async (req, res) => {
  const parsedId = idParamSchema.safeParse(req.params);
  if (!parsedId.success) {
    res.status(400).json({ error: "id must be a positive integer" });
    return;
  }

  try {
    const result = await pool.query("DELETE FROM clients WHERE id = $1 RETURNING id", [
      parsedId.data.id,
    ]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Client not found" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    if ((err as { code?: string }).code === "23503") {
      res.status(409).json({ error: "Client still has invoices and cannot be deleted" });
      return;
    }
    throw err;
  }
});