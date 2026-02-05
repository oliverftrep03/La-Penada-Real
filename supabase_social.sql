-- 1. Comments Table (Safe Creation)
create table if not exists gallery_comments (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references gallery_posts(id) on delete cascade not null,
  user_id uuid references profiles(id) not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. RLS for Comments (Safe Policy Creation)
alter table gallery_comments enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Enable read access for all users' and tablename = 'gallery_comments') then
    create policy "Enable read access for all users" on gallery_comments for select using (true);
  end if;
  
  if not exists (select 1 from pg_policies where policyname = 'Enable insert for authenticated users' and tablename = 'gallery_comments') then
    create policy "Enable insert for authenticated users" on gallery_comments for insert with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Enable delete for comment owner' and tablename = 'gallery_comments') then
    create policy "Enable delete for comment owner" on gallery_comments for delete using (auth.uid() = user_id);
  end if;
end $$;

-- 3. Featured Photos in Profiles
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'featured_photos') then
    alter table profiles add column featured_photos text[] default '{}';
  end if;
end $$;

-- 4. Delete Policy for Gallery Posts (User Request) - Safe
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Enable delete for post owner' and tablename = 'gallery_posts') then
    create policy "Enable delete for post owner" on gallery_posts for delete using (auth.uid() = user_id);
  end if;
end $$;
