-- Definitive Fix V4: Correct Table Names & Clone Strategy
-- Fixes "column user_id does not exist" by using 'chat_messages' instead of 'messages'
-- Adds 'user_chests' to the transfer list.

create or replace function claim_profile(target_username text)
returns void
language plpgsql
security definer
as $$
declare
  old_uid uuid;
  new_uid uuid;
  user_email text;
begin
  -- 1. Setup IDs
  new_uid := auth.uid();
  select email into user_email from auth.users where id = new_uid;
  select id into old_uid from profiles where group_name = target_username;
  
  -- Validation
  if old_uid is null then raise exception 'El perfil "%" no existe.', target_username; end if;
  if old_uid = new_uid then raise exception 'Ya eres dueño de este perfil.'; end if;

  -- 2. CLEANUP: Wipe anything related to the NEW Google ID (Auto-created data)
  delete from gallery_comments where user_id = new_uid;
  delete from gallery_likes where user_id = new_uid;
  delete from gallery_posts where user_id = new_uid;
  delete from user_inventory where user_id = new_uid;
  delete from user_rewards where user_id = new_uid;
  delete from user_chests where user_id = new_uid;     -- Added
  delete from chat_messages where user_id = new_uid;   -- Corrected from 'messages'
  delete from profiles where id = new_uid;

  -- 3. CLONE: Copy the Old Profile to the New ID
  insert into profiles (
    id, group_name, email, avatar_url, description, 
    xp, level, coins, frames_unlocked, current_frame, created_at
  )
  select 
    new_uid, group_name, user_email, avatar_url, description, 
    xp, level, coins, frames_unlocked, current_frame, created_at
  from profiles 
  where id = old_uid;

  -- 4. MOVE CHILDREN: Reassign all data to the new ID
  update gallery_posts set user_id = new_uid where user_id = old_uid;
  update gallery_comments set user_id = new_uid where user_id = old_uid;
  update gallery_likes set user_id = new_uid where user_id = old_uid;
  update user_rewards set user_id = new_uid where user_id = old_uid;
  update user_inventory set user_id = new_uid where user_id = old_uid;
  update user_chests set user_id = new_uid where user_id = old_uid;    -- Added
  update chat_messages set user_id = new_uid where user_id = old_uid;  -- Corrected
  
  -- 5. FINISH: Delete the Old Profile
  delete from profiles where id = old_uid;
  
end;
$$;
