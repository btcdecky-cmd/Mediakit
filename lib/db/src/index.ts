import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL or POSTGRES_URL must be set. Did you forget to provision Supabase?",
  );
}

const normalizedConnectionString = connectionString.replace(/[?&]sslmode=[^&]*/i, "");

export const pool = new Pool({
  connectionString: normalizedConnectionString,
  ssl: process.env.POSTGRES_HOST || connectionString.includes("supabase")
    ? { rejectUnauthorized: false }
    : undefined,
});
export const db = drizzle(pool, { schema });

export async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS media_jobs (
      id uuid PRIMARY KEY,
      visitor_id text NOT NULL,
      url text NOT NULL,
      provider text NOT NULL,
      title text NOT NULL,
      format text NOT NULL,
      quality text NOT NULL,
      status text NOT NULL,
      progress integer NOT NULL DEFAULT 0,
      size text,
      created_at timestamptz NOT NULL DEFAULT now(),
      expires_at timestamptz NOT NULL,
      download_url text,
      error text
    );
    ALTER TABLE media_jobs ADD COLUMN IF NOT EXISTS visitor_id text;
    ALTER TABLE media_jobs ADD COLUMN IF NOT EXISTS url text;
    ALTER TABLE media_jobs ADD COLUMN IF NOT EXISTS provider text;
    ALTER TABLE media_jobs ADD COLUMN IF NOT EXISTS title text;
    ALTER TABLE media_jobs ADD COLUMN IF NOT EXISTS format text;
    ALTER TABLE media_jobs ADD COLUMN IF NOT EXISTS quality text;
    ALTER TABLE media_jobs ADD COLUMN IF NOT EXISTS status text;
    ALTER TABLE media_jobs ADD COLUMN IF NOT EXISTS progress integer DEFAULT 0;
    ALTER TABLE media_jobs ADD COLUMN IF NOT EXISTS size text;
    ALTER TABLE media_jobs ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
    ALTER TABLE media_jobs ADD COLUMN IF NOT EXISTS expires_at timestamptz;
    ALTER TABLE media_jobs ADD COLUMN IF NOT EXISTS download_url text;
    ALTER TABLE media_jobs ADD COLUMN IF NOT EXISTS error text;
  `);
}

export * from "./schema";
