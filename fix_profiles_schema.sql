-- 1. Ensure 'email' column exists in profiles
alter table profiles add column if not exists email text;

-- 2. Enable RLS (just in case)
alter table profiles enable row level security;

-- 3. Policy to allow users to update their OWN profile
-- DROP EXISTING POLICY IF NAME CONFLICTS (Optional, but safe to just create if not exists)
drop policy if exists "Users can update own profile" on profiles;

create policy "Users can update own profile"
on profiles for update
using ( auth.uid() = id );

-- 4. Policy to allow users to insert their OWN profile
drop policy if exists "Users can insert own profile" on profiles;

create policy "Users can insert own profile"
on profiles for insert
with check ( auth.uid() = id );

-- 5. Policy to allow everyone to view profiles (Public)
drop policy if exists "Public profiles are viewable by everyone" on profiles;

create policy "Public profiles are viewable by everyone"
on profiles for select
using ( true );

-- 6. Trigger to sync email on auth.users changes (Optional but good default)
-- (We handled this in frontend/RPC but good to have)
