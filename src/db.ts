import "dotenv/config";
import { Pool, types } from "pg";

types.setTypeParser(1082, (value) => value);

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});