import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { drizzle as neonDrizzle } from 'drizzle-orm/neon-serverless';
import { Pool as PgPool } from 'pg';
import { drizzle as pgDrizzle } from 'drizzle-orm/node-postgres';
import ws from "ws";
import * as schema from "@shared/schema";

let pool: any;
let db: ReturnType<typeof neonDrizzle> | ReturnType<typeof pgDrizzle>;

if (!process.env.DATABASE_URL && process.env.NODE_ENV !== 'development') {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

try {
  if (process.env.DATABASE_URL) {
    const dbUrl = process.env.DATABASE_URL;
    
    // Check if it's a Neon database (contains neon.tech) or local postgres
    if (dbUrl.includes('neon.tech') || dbUrl.includes('supabase.com')) {
      // Use Neon serverless for cloud databases
      neonConfig.webSocketConstructor = ws;
      pool = new NeonPool({ connectionString: dbUrl });
      db = neonDrizzle({ client: pool, schema });
      console.log("Using Neon serverless database connection");
    } else {
      // Use regular pg pool for local databases
      pool = new PgPool({ connectionString: dbUrl });
      db = pgDrizzle({ client: pool, schema });
      console.log("Using local PostgreSQL database connection");
    }
  } else {
    console.log("No DATABASE_URL in development mode, using mock database");
    db = {} as any;
    pool = {} as any;
  }
} catch (error) {
  console.warn("Database connection failed, running in mock mode:", error);
  db = {} as any;
  pool = {} as any;
}

export { pool, db };