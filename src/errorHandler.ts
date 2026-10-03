import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const code = (err as { code?: string }).code;

  if (code === "23505") {
    res.status(409).json({ error: "Resource already exists" });
    return;
  }
  if (code === "23503") {
    res.status(404).json({ error: "Referenced resource not found" });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "Internal server error" });
};