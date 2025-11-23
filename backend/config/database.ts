import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

export const pgPool = new Pool({
  connectionString: process.env.SUPABASE_URL,
  ssl: { rejectUnauthorized: false },
});

