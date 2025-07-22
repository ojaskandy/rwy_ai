import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ufdpwiwsytlzyzrfwdia.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZHB3aXdzeXRsenl6cmZ3ZGlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMjU3MTgsImV4cCI6MjA2ODcwMTcxOH0.t4Kgj5sMiviBsXDNSMUH97o6DYBosTaN8fbVnqViRYQ';

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase; 