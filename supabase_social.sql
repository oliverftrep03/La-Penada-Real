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

-- 5. Fix Profile Update Policy (FORCE UPDATE)
do $$
begin
  -- Drop potential conflicting or old policies
  drop policy if exists "Enable update for users based on id" on profiles;
  drop policy if exists "Users update own profile" on profiles;
  
  -- Create the permissive update policy
  create policy "Enable update for users based on id" on profiles for update using (auth.uid() = id);
end $$;

-- 6. LOOT CHEST SYSTEM
-- Table to track user chests
create table if not exists user_chests (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  type text not null, -- 'welcome', 'level_up', 'combo_5_photos'
  created_at timestamp with time zone default timezone('utc'::text, now()),
  opened_at timestamp with time zone -- null means unopened
);

-- RLS for user_chests
alter table user_chests enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'View own chests' and tablename = 'user_chests') then
    create policy "View own chests" on user_chests for select using (auth.uid() = user_id);
  end if;
end $$;

-- 7. Fix User Inventory Deletion (User Request)
alter table user_inventory enable row level security;
do $$
begin
    if not exists (select 1 from pg_policies where policyname = 'Delete own items' and tablename = 'user_inventory') then
        create policy "Delete own items" on user_inventory for delete using (auth.uid() = user_id);
    end if;
end $$;

-- Function to claim Welcome Chest (1 per user)
create or replace function claim_welcome_chest(target_user_id uuid)
returns json as $$
declare
  exists_check boolean;
begin
  -- Check if user already had a welcome chest
  select exists(select 1 from user_chests where user_id = target_user_id and type = 'welcome') into exists_check;
  
  if exists_check then
    return json_build_object('success', false, 'message', 'Ya has reclamado el cofre de bienvenida.');
  else
    insert into user_chests (user_id, type) values (target_user_id, 'welcome');
    return json_build_object('success', true, 'message', '¡Cofre de bienvenida recibido!');
  end if;
end;
$$ language plpgsql security definer;

-- Function to Open a Chest
-- Picks a random item from store_items
create or replace function open_chest(chest_uuid uuid)
returns json as $$
declare
  v_user_id uuid;
  v_opened_at timestamp;
  v_item_id uuid;
  v_item_name text;
  v_item_type text;
  v_item_rarity text;
  v_item_content text;
begin
  -- Verify ownership and status
  select user_id, opened_at into v_user_id, v_opened_at from user_chests where id = chest_uuid;
  
  if v_user_id is null then
    return json_build_object('success', false, 'message', 'Cofre no encontrado');
  end if;
  
  if v_opened_at is not null then
    return json_build_object('success', false, 'message', 'Este cofre ya está abierto');
  end if;
  
  if v_user_id != auth.uid() then
    return json_build_object('success', false, 'message', 'No es tu cofre');
  end if;

  -- Mark as opened
  update user_chests set opened_at = now() where id = chest_uuid;

  -- Select Random Item (Uniform distribution for now, can be weighted later)
  select id, name, type, rarity, content 
  into v_item_id, v_item_name, v_item_type, v_item_rarity, v_item_content
  from store_items 
  order by random() 
  limit 1;

  if v_item_id is not null then
    -- Add to inventory
    insert into user_inventory (user_id, item_id) values (auth.uid(), v_item_id);
    
    return json_build_object(
      'success', true, 
      'item', json_build_object(
        'name', v_item_name,
        'type', v_item_type,
        'rarity', v_item_rarity,
        'content', v_item_content
      )
    );
  else
    return json_build_object('success', true, 'item', null, 'message', 'El cofre estaba vacío...');
  end if;
end;
$$ language plpgsql security definer;

-- Trigger: Reward chest every 5 photos
create or replace function check_5_photos_reward()
returns trigger as $$
declare
  photo_count int;
begin
  select count(*) into photo_count from gallery_posts where user_id = NEW.user_id;
  
  if photo_count > 0 and (photo_count % 5) = 0 then
    insert into user_chests (user_id, type) values (NEW.user_id, 'combo_5_photos');
  end if;
  
  return NEW;
end;
$$ language plpgsql security definer;

-- Apply trigger safely
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trigger_5_photos_reward') then
    create trigger trigger_5_photos_reward
    after insert on gallery_posts
    for each row
    execute function check_5_photos_reward();
  end if;
end $$;

-- 8. Add Image URL to Store Items
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'store_items' and column_name = 'image_url') then
    alter table store_items add column image_url text;
  end if;
end $$;

-- 9. XP & LEVELING SYSTEM
-- Formula helper
create or replace function get_xp_requirement(lvl int) returns int as $$
begin
  if lvl < 10 then
    return lvl * 10;
  else
    -- Level 9 req was 90.
    -- Level 10 req = 90 + 15 = 105.
    -- Level 11 req = 105 + 15 = 120.
    return 90 + ((lvl - 9) * 15);
  end if;
end;
$$ language plpgsql immutable;

create or replace function add_xp(target_user_id uuid, amount int)
returns json as $$
declare
  current_xp int;
  current_lvl int;
  current_coins int;
  xp_needed int;
  levels_gained int := 0;
  chests_awarded int := 0;
  coins_awarded int := 0;
  new_title text;
begin
  -- Get current state
  select xp, level, coins into current_xp, current_lvl, current_coins from profiles where id = target_user_id;
  
  -- Initialize if null
  if current_xp is null then current_xp := 0; end if;
  if current_lvl is null then current_lvl := 1; end if;
  if current_coins is null then current_coins := 0; end if;
  
  current_xp := current_xp + amount;
  
  -- Level Up Loop
  loop
    xp_needed := get_xp_requirement(current_lvl);
    
    if current_xp >= xp_needed and current_lvl < 50 then
      current_xp := current_xp - xp_needed;
      current_lvl := current_lvl + 1;
      levels_gained := levels_gained + 1;
      
      -- Rewards
      coins_awarded := coins_awarded + 20;
      
      -- Chests (Every 5 levels)
      if (current_lvl % 5) = 0 then
        insert into user_chests (user_id, type) values (target_user_id, 'level_up');
        chests_awarded := chests_awarded + 1;
      end if;
      
      -- Titles (Lemas) logic handled in UI or computed column, but we can store it?
      -- "Blandengue de la Peñada" -> Lvl 5
      -- ...
      
    else
      exit; -- Break loop if not enough XP
    end if;
  end loop;
  
  -- Update Profile
  update profiles 
  set xp = current_xp, 
      level = current_lvl, 
      coins = current_coins + coins_awarded 
  where id = target_user_id;
  
  return json_build_object(
    'new_level', current_lvl, 
    'levels_gained', levels_gained, 
    'coins_added', coins_awarded,
    'chests_added', chests_awarded
  );
end;
$$ language plpgsql security definer;

-- Trigger: XP for Photo Upload (10 XP)
create or replace function on_gallery_upload_xp()
returns trigger as $$
begin
  perform add_xp(NEW.user_id, 10);
  return NEW;
end;
$$ language plpgsql security definer;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trigger_gallery_xp') then
    create trigger trigger_gallery_xp
    after insert on gallery_posts
    for each row
    execute function on_gallery_upload_xp();
  end if;
end $$;
