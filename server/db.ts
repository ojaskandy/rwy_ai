import { createClient } from '@supabase/supabase-js';
import * as schema from "@shared/schema";
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

if (!process.env.SUPABASE_URL) {
  throw new Error(
    "SUPABASE_URL must be set. Did you forget to set the Supabase project URL?",
  );
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY must be set. Did you forget to set the Supabase service role key?",
  );
}

if (!process.env.SUPABASE_DATABASE_URL) {
    throw new Error(
        "SUPABASE_DATABASE_URL must be set. This is the connection string for your Supabase Postgres database."
    )
}

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Create the Drizzle client
const client = postgres(process.env.SUPABASE_DATABASE_URL);
export const db = drizzle(client, { schema });
