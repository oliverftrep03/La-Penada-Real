-- Definitive Fix V5: Remove 'created_at' and keep table corrections
-- Fixes "column created_at does not exist" by removing it from the data transfer.

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

  -- 2. CLEANUP: Wipe anything related to the NEW Google ID
  delete from gallery_comments where user_id = new_uid;
  delete from gallery_likes where user_id = new_uid;
  delete from gallery_posts where user_id = new_uid;
  delete from user_inventory where user_id = new_uid;
  delete from user_rewards where user_id = new_uid;
  delete from user_chests where user_id = new_uid;
  delete from chat_messages where user_id = new_uid;
  delete from profiles where id = new_uid;

  -- 3. CLONE: Copy the Old Profile to the New ID (Requests to include created_at removed)
  insert into profiles (
    id, group_name, email, avatar_url, description, 
    xp, level, coins, frames_unlocked, current_frame
  )
  select 
    new_uid, group_name, user_email, avatar_url, description, 
    xp, level, coins, frames_unlocked, current_frame
  from profiles 
  where id = old_uid;

  -- 4. MOVE CHILDREN
  update gallery_posts set user_id = new_uid where user_id = old_uid;
  update gallery_comments set user_id = new_uid where user_id = old_uid;
  update gallery_likes set user_id = new_uid where user_id = old_uid;
  update user_rewards set user_id = new_uid where user_id = old_uid;
  update user_inventory set user_id = new_uid where user_id = old_uid;
  update user_chests set user_id = new_uid where user_id = old_uid;
  update chat_messages set user_id = new_uid where user_id = old_uid;
  
  -- 5. FINISH
  delete from profiles where id = old_uid;
  
end;
$$;
