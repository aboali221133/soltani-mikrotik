import { createClient } from '@supabase/supabase-js';

// Credentials provided directly for GitHub-to-Vercel deployments
const supabaseUrl = 'https://rdkrpswllzurqwbkcxgy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJka3Jwc3dsbHp1cnF3YmtjeGd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NTM4NjAsImV4cCI6MjA4NzAyOTg2MH0.Og8d4sSVD84cp7wSxpGRl1IJ9vuWMdDlDwKmqn4gbbY';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Secondary client specifically for creating new accounts without dropping current admin session
export const secondarySupabaseAuth = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});
