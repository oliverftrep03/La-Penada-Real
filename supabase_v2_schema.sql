-- 1. Tabla Perfiles (Extendida para el juego)
create table profiles (
  id uuid references auth.users not null primary key,
  group_name text unique not null, -- "Peñorb", etc.
  email text,
  avatar_url text,
  description text default 'Miembro de La Peñada Real',
  xp int default 0,
  level int default 1,
  coins int default 0,
  frames_unlocked text[] default '{"basic"}', -- Marcos desbloqueados
  current_frame text default 'basic',
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Galería Social
create table gallery_posts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  photo_url text not null,
  caption text,
  frame_style text default 'basic',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Likes y Comentarios
create table gallery_likes (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references gallery_posts(id) on delete cascade not null,
  user_id uuid references profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(post_id, user_id) -- Un like por persona
);

create table gallery_comments (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references gallery_posts(id) on delete cascade not null,
  user_id uuid references profiles(id) not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. Modificar Chat para usar ID de perfil
alter table chat_messages add column user_id uuid references profiles(id);

-- POLÍTICAS RLS (Seguridad)
alter table profiles enable row level security;
alter table gallery_posts enable row level security;
alter table gallery_likes enable row level security;
alter table gallery_comments enable row level security;

-- Perfiles: Todos ven todo, cada uno edita lo suyo
create policy "Public Profiles" on profiles for select using (true);
create policy "Users update own profile" on profiles for update using (auth.uid() = id);
create policy "Users insert own profile" on profiles for insert with check (auth.uid() = id);

-- Galería: Ver todos, crear propio
create policy "See gallery" on gallery_posts for select using (true);
create policy "Post photo" on gallery_posts for insert with check (auth.uid() = user_id);
create policy "Delete own photo" on gallery_posts for delete using (auth.uid() = user_id);

-- Likes/Comments: Libre albedrío
create policy "See likes" on gallery_likes for select using (true);
create policy "Give like" on gallery_likes for insert with check (auth.uid() = user_id);
create policy "Remove like" on gallery_likes for delete using (auth.uid() = user_id);

create policy "See comments" on gallery_comments for select using (true);
create policy "Write comment" on gallery_comments for insert with check (auth.uid() = user_id);
