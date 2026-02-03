-- 1. Tabla Perfiles (Extendida para el juego)
create table if not exists profiles (
  id uuid references auth.users not null primary key,
  group_name text unique not null,
  email text,
  avatar_url text,
  description text default 'Miembro de La Peñada Real',
  xp int default 0,
  level int default 1,
  coins int default 0,
  frames_unlocked text[] default '{"basic"}',
  current_frame text default 'basic',
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Si la tabla ya existía, añadimos las columnas que falten
do $$ 
begin
    if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'group_name') then
        alter table profiles add column group_name text unique;
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'xp') then
        alter table profiles add column xp int default 0;
        alter table profiles add column level int default 1;
        alter table profiles add column coins int default 0;
        alter table profiles add column frames_unlocked text[] default '{"basic"}';
        alter table profiles add column current_frame text default 'basic';
    end if;
end $$;

-- 2. Galería Social
create table if not exists gallery_posts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  photo_url text not null,
  caption text,
  frame_style text default 'basic',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Likes y Comentarios
create table if not exists gallery_likes (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references gallery_posts(id) on delete cascade not null,
  user_id uuid references profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(post_id, user_id)
);

create table if not exists gallery_comments (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references gallery_posts(id) on delete cascade not null,
  user_id uuid references profiles(id) not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. Modificar Chat para usar ID de perfil (Si no existe la columna)
do $$ 
begin
    if not exists (select 1 from information_schema.columns where table_name = 'chat_messages' and column_name = 'user_id') then
        alter table chat_messages add column user_id uuid references profiles(id);
    end if;
end $$;

-- POLÍTICAS RLS (Seguridad) - Las recreamos por si acaso
alter table profiles enable row level security;
alter table gallery_posts enable row level security;
alter table gallery_likes enable row level security;
alter table gallery_comments enable row level security;

-- Borramos políticas viejas para evitar conflictos y creamos las nuevas
drop policy if exists "Public Profiles" on profiles;
create policy "Public Profiles" on profiles for select using (true);

drop policy if exists "Users update own profile" on profiles;
create policy "Users update own profile" on profiles for update using (auth.uid() = id);

drop policy if exists "Users insert own profile" on profiles;
create policy "Users insert own profile" on profiles for insert with check (auth.uid() = id);

drop policy if exists "See gallery" on gallery_posts;
create policy "See gallery" on gallery_posts for select using (true);

drop policy if exists "Post photo" on gallery_posts;
create policy "Post photo" on gallery_posts for insert with check (auth.uid() = user_id);

drop policy if exists "Delete own photo" on gallery_posts;
create policy "Delete own photo" on gallery_posts for delete using (auth.uid() = user_id);

drop policy if exists "See likes" on gallery_likes;
create policy "See likes" on gallery_likes for select using (true);

drop policy if exists "Give like" on gallery_likes;
create policy "Give like" on gallery_likes for insert with check (auth.uid() = user_id);

drop policy if exists "Remove like" on gallery_likes;
create policy "Remove like" on gallery_likes for delete using (auth.uid() = user_id);

drop policy if exists "See comments" on gallery_comments;
create policy "See comments" on gallery_comments for select using (true);

drop policy if exists "Write comment" on gallery_comments;
create policy "Write comment" on gallery_comments for insert with check (auth.uid() = user_id);
