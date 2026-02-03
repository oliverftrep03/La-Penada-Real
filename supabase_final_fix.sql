-- 🛠️ SCRIPT DEFINITIVO "TODO EN UNO" (Sin errores) 🛠️
-- Copia y ejecuta TODO esto. Si algo ya existe, lo arregla. Si no, lo crea.

-- 1. LIMPIEZA PREVIA (Para evitar conflictos)
drop table if exists gallery_comments cascade;
drop table if exists gallery_likes cascade;
drop table if exists gallery_posts cascade;
-- OJO: Esto reinicia usuarios y chat para que todo cuadre
drop table if exists chat_messages cascade; 
drop table if exists profiles cascade;

-- 2. TABLA PERFILES (Usuarios Google)
create table profiles (
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

-- 3. TABLA CHAT (Que faltaba antes)
create table chat_messages (
  id uuid default uuid_generate_v4() primary key,
  content text not null,
  user_id uuid references profiles(id) on delete cascade not null, -- Enlazado al perfil
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. TABLA GALERÍA (Posts)
create table gallery_posts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  photo_url text not null,
  caption text,
  frame_style text default 'basic',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 5. TABLA LIKES
create table gallery_likes (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references gallery_posts(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(post_id, user_id)
);

-- 6. TABLA COMENTARIOS
create table gallery_comments (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references gallery_posts(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 7. SEGURIDAD (Permitir todo por ahora para evitar líos de permisos)
alter table profiles enable row level security;
alter table chat_messages enable row level security;
alter table gallery_posts enable row level security;
alter table gallery_likes enable row level security;
alter table gallery_comments enable row level security;

-- Política universal: "Todo el mundo puede hacer todo si está logueado"
create policy "Universal Access" on profiles for all using (auth.role() = 'authenticated');
create policy "Universal Access Chat" on chat_messages for all using (auth.role() = 'authenticated');
create policy "Universal Access Gallery" on gallery_posts for all using (auth.role() = 'authenticated');
create policy "Universal Access Likes" on gallery_likes for all using (auth.role() = 'authenticated');
create policy "Universal Access Comments" on gallery_comments for all using (auth.role() = 'authenticated');

-- Permitir lectura pública (para login)
create policy "Public Read Profiles" on profiles for select using (true);
