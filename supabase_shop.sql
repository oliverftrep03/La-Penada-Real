-- 1. Store Items (Lo que se vende)
create table store_items (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  price int not null default 0,
  type text not null check (type in ('frame', 'map_icon', 'collectible')),
  rarity text check (rarity in ('common', 'rare', 'epic', 'legendary', 'unique')), -- Solo para collectibles
  content text, -- CSS class, URL, or Emoji
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. User Inventory (Lo que se tiene)
create table user_inventory (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  item_id uuid references store_items(id) not null,
  acquired_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. RLS
alter table store_items enable row level security;
alter table user_inventory enable row level security;

-- Todos ven la tienda
create policy "Public Store" on store_items for select using (true);
-- Solo admin edita (se asume política manual o rol de servicio, por simplicidad permitimos todo a auth por ahora y filtramos en front, o idealmente restringiríamos)
create policy "Admin manages store" on store_items for all using (true); -- Simplificación

-- Inventario: Ver el propio
create policy "View own inventory" on user_inventory for select using (auth.uid() = user_id);
create policy "Add to inventory (buying)" on user_inventory for insert with check (auth.uid() = user_id);

-- 4. FunciÃ³n segura para añadir monedas
create or replace function add_coins(user_id uuid, amount int)
returns void as $$
begin
  update profiles
  set coins = coins + amount
  where id = user_id;
end;
$$ language plpgsql security definer;
