
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function runMigration() {
    console.log('Running migration...');

    // We cannot run raw SQL via the JS client easily without a Postgres connection or RPC.
    // However, we CAN use the Table Management API if enabled or just create data to verify connection.
    // Actually, standard supabase-js doesn't support DDL (CREATE TABLE).
    // I will output the SQL for the user to run in the SQL Editor as a fallback, 
    // but I can try to see if the table exists first.

    console.log("----------------------------------------------------------------");
    console.log("PLEASE RUN THE FOLLOWING SQL IN YOUR SUPABASE SQL EDITOR:");
    console.log("----------------------------------------------------------------");

    const sql = `
  create table if not exists public.invitations (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    family_name text not null,
    guest_limit integer default 1,
    confirmed_count integer default 0,
    status text default 'pending', -- pending, confirmed, declined
    view_key text unique,          -- for unique links
    is_public boolean default false,
    phone text
  );

  -- Enable Row Level Security
  alter table public.invitations enable row level security;

  -- Policy: Allow Anon Insert (For Public RSVP)
  create policy "Anon can insert rsvp"
  on public.invitations for insert
  to anon
  with check (true);

  -- Policy: Allow Anon Select (For Public RSVP confirmation/duplicates check if needed)
  -- create policy "Anon can select own rsvp" ... (Complex without auth, skipping for now)

  -- Policy: Service Role has full access (Admin)
  create policy "Service role full access"
  on public.invitations for all
  to service_role
  using (true)
  with check (true);
  `;

    console.log(sql);
    console.log("----------------------------------------------------------------");
}

runMigration();
