import express from "express";
import { pool } from "./db";
import { clientsRouter } from "./routes/clients";

export const app = express();

app.use(express.json());
app.use("/clients", clientsRouter);


app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});
app.get("/db-health", async (_req, res) => {
  try {
    const result = await pool.query("SELECT now() AS time");
    res.json({ status: "ok", dbTime: result.rows[0].time });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: "Database unavailable" });
  }
});