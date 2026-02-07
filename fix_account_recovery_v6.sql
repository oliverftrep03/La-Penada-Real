-- Definitive Fix V6: Rename Strategy
-- Fixes "duplicate key value violates unique constraint profiles_group_name_key"
-- Strategy: Rename old profile -> Insert New -> Move Data -> Delete Old

create or replace function claim_profile(target_username text)
returns void
language plpgsql
security definer
as $$
declare
  old_uid uuid;
  new_uid uuid;
  user_email text;
  original_name text;
begin
  -- 1. Setup IDs
  new_uid := auth.uid();
  select email into user_email from auth.users where id = new_uid;
  select id, group_name into old_uid, original_name from profiles where group_name = target_username;
  
  -- Validation
  if old_uid is null then raise exception 'El perfil "%" no existe.', target_username; end if;
  if old_uid = new_uid then raise exception 'Ya eres dueño de este perfil.'; end if;

  -- 2. CLEANUP: Wipe anything related to the NEW Google ID
  delete from gallery_comments where user_id = new_uid;
  delete from gallery_likes where user_id = new_uid;
  delete from gallery_posts where user_id = new_uid;
  delete from user_inventory where user_id = new_uid;
  delete from user_rewards where user_id = new_uid;
  delete from user_chests where user_id = new_uid;
  delete from chat_messages where user_id = new_uid;
  delete from profiles where id = new_uid;

  -- 3. RENAME OLD PROFILE (To free up the unique username)
  update profiles 
  set group_name = group_name || '__temp'
  where id = old_uid;

  -- 4. CLONE: Copy the Old Profile (using original name) to the New ID
  -- Using original_name variable to restore the name
  insert into profiles (
    id, group_name, email, avatar_url, description, 
    xp, level, coins, frames_unlocked, current_frame
  )
  select 
    new_uid, original_name, user_email, avatar_url, description, 
    xp, level, coins, frames_unlocked, current_frame
  from profiles 
  where id = old_uid;

  -- 5. MOVE CHILDREN
  update gallery_posts set user_id = new_uid where user_id = old_uid;
  update gallery_comments set user_id = new_uid where user_id = old_uid;
  update gallery_likes set user_id = new_uid where user_id = old_uid;
  update user_rewards set user_id = new_uid where user_id = old_uid;
  update user_inventory set user_id = new_uid where user_id = old_uid;
  update user_chests set user_id = new_uid where user_id = old_uid;
  update chat_messages set user_id = new_uid where user_id = old_uid;
  
  -- 6. FINISH
  delete from profiles where id = old_uid;
  
end;
$$;
