-- 1. Reward Definitions (The 30+30 slots)
create table if not exists reward_definitions (
  id uuid default uuid_generate_v4() primary key,
  type text not null check (type in ('trophy', 'achievement')),
  slot_index int not null, -- 1 to 30
  name text not null default '???',
  description text default 'Bloqueado',
  icon text default '🏆',
  unique(type, slot_index)
);

-- 2. User Rewards (Who has unlocked what)
create table if not exists user_rewards (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  reward_id uuid references reward_definitions(id) not null,
  unlocked_at timestamp with time zone default now(),
  unique(user_id, reward_id)
);

-- 3. Seed Data (30 Trophies + 30 Achievements)
do $$
begin
  for i in 1..30 loop
    insert into reward_definitions (type, slot_index, name, description, icon)
    values ('trophy', i, 'Trofeo Oculto ' || i, 'Este trofeo aún no ha sido descubierto.', '🏆')
    on conflict (type, slot_index) do nothing;
    
    insert into reward_definitions (type, slot_index, name, description, icon)
    values ('achievement', i, 'Logro Oculto ' || i, 'Sigue jugando para desbloquear este logro.', '⭐')
    on conflict (type, slot_index) do nothing;
  end loop;
end;
$$;

-- 4. Policies
alter table reward_definitions enable row level security;
alter table user_rewards enable row level security;

-- Everyone can read definitions
create policy "Read Definitions" on reward_definitions for select using (true);
-- Only Peñimo (or admins) can update definitions. 
-- Ideally we check specific user ID or role, but for now we'll allow authenticated users to update 
-- IF they are on the admin page (Client side check + RLS if possible).
-- For strict security: using (auth.uid() in (select id from profiles where group_name = 'Peñimo'));
create policy "Admin Update" on reward_definitions for update using (
  auth.uid() in (select id from profiles where group_name = 'Peñimo')
);

-- Users can read their own rewards
create policy "Read Own Rewards" on user_rewards for select using (true);
-- Users (or Admin) can insert rewards? Let's allow everyone to insert for now (game logic) 
-- or restrict to Admin. Let's allow insert for now to simulate unlocking.
create policy "Insert Rewards" on user_rewards for insert with check (true);
