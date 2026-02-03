-- 💥 RESETEO DE TABLAS CONFLICTIVAS 💥
-- (Esto arregla el error de "tipos incompatibles" borrando las tablas mal creadas)

-- 1. Borramos las tablas nuevas si ya existían mal
drop table if exists gallery_comments;
drop table if exists gallery_likes;
drop table if exists gallery_posts;

-- 2. Importante: Borramos la tabla profiles antigua porque tenía el ID mal (era número en vez de código de usuario)
-- NOTA: Esto borrará los perfiles existentes, pero como vamos a reiniciar con Google y nombres nuevos, es lo mejor.
drop table if exists profiles cascade;

-- 3. Ahora sí, creamos todo LIMPIO y CORRECTO (usando UUIDs)

-- Tabla Perfiles
create table profiles (
  id uuid references auth.users not null primary key, -- Ahora sí coinidice con Supabase Auth
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

-- Tabla Posts
create table gallery_posts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null, -- Coincide con uuid
  photo_url text not null,
  caption text,
  frame_style text default 'basic',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Tabla Likes
create table gallery_likes (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references gallery_posts(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(post_id, user_id)
);

-- Tabla Comentarios
create table gallery_comments (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references gallery_posts(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Ajustar chat si es necesario
do $$ 
begin
    -- Si existe la columna user_id en chat pero es de tipo incorrecto, esto podría fallar,
    -- pero asumiremos que el chat es independiente o se arreglará aparte.
    if not exists (select 1 from information_schema.columns where table_name = 'chat_messages' and column_name = 'user_id') then
        alter table chat_messages add column user_id uuid references profiles(id);
    end if;
end $$;

-- 4. POLÍTICAS DE SEGURIDAD (RLS)
alter table profiles enable row level security;
alter table gallery_posts enable row level security;
alter table gallery_likes enable row level security;
alter table gallery_comments enable row level security;

-- Perfiles
create policy "Public Profiles" on profiles for select using (true);
create policy "Users update own profile" on profiles for update using (auth.uid() = id);
create policy "Users insert own profile" on profiles for insert with check (auth.uid() = id);

-- Galería
create policy "See gallery" on gallery_posts for select using (true);
create policy "Post photo" on gallery_posts for insert with check (auth.uid() = user_id);
create policy "Delete own photo" on gallery_posts for delete using (auth.uid() = user_id);

-- Interacción
create policy "See likes" on gallery_likes for select using (true);
create policy "Give like" on gallery_likes for insert with check (auth.uid() = user_id);
create policy "Remove like" on gallery_likes for delete using (auth.uid() = user_id);

create policy "See comments" on gallery_comments for select using (true);
create policy "Write comment" on gallery_comments for insert with check (auth.uid() = user_id);
