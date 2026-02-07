-- Definitive Fix for Account Recovery (Run this in Supabase SQL Editor)

create or replace function claim_profile(target_username text)
returns void
language plpgsql
security definer
as $$
declare
  old_uid uuid;
  new_uid uuid;
begin
  -- 1. Get the ID of the user trying to claim (the Google User)
  new_uid := auth.uid();
  
  -- 2. Find the ID of the profile we want to claim (e.g. Peñodek)
  select id into old_uid from profiles where group_name = target_username;
  
  -- Validation
  if old_uid is null then
    raise exception 'El perfil "%" no existe.', target_username;
  end if;

  if old_uid = new_uid then
    raise exception 'Ya eres dueño de este perfil.';
  end if;

  -- 3. CRITICAL: Delete any EMPTY profile that might have been auto-created 
  -- for the new Google user. This prevents the "Primary Key" collision.
  delete from profiles where id = new_uid;

  -- 4. Transfer all data ownershipt to the new ID
  update gallery_posts set user_id = new_uid where user_id = old_uid;
  update gallery_comments set user_id = new_uid where user_id = old_uid;
  update gallery_likes set user_id = new_uid where user_id = old_uid;
  update user_rewards set user_id = new_uid where user_id = old_uid;
  update user_inventory set user_id = new_uid where user_id = old_uid;
  update messages set user_id = new_uid where user_id = old_uid;

  -- 5. Finally, move the profile itself to the new ID and update the email
  update profiles 
  set id = new_uid, 
      email = (select email from auth.users where id = new_uid) 
  where id = old_uid;
  
end;
$$;
