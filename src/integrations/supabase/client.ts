import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://accvidvcrihjrzreedix.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjY3ZpZHZjcmloanJ6cmVlZGl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2OTE4MTYsImV4cCI6MjA3MzI2NzgxNn0.xozCP-7OjzUXLYyIQI5kqakHkAG4t8GjV9Z6EksSdVQ";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false
  }
});