import { createClient } from '@supabase/supabase-js';
import * as schema from "@shared/schema";

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

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// For backwards compatibility, we'll create a simple db interface
export const db = {
  schema,
  // We'll implement basic CRUD operations as needed
};