-- Function to claim an existing profile and transfer data to new user
create or replace function claim_profile(target_username text)
returns void
language plpgsql
security definer
as $$
declare
  old_uid uuid;
  new_uid uuid;
begin
  -- Get the new user ID (the one calling the function)
  new_uid := auth.uid();
  
  -- Find the old user ID based on the username
  select id into old_uid from profiles where group_name = target_username;
  
  if old_uid is null then
    raise exception 'Profile not found';
  end if;

  if old_uid = new_uid then
    raise exception 'You already own this profile';
  end if;

  -- COLLISION FIX: If the new user ALREADY has a profile row (e.g. auto-created), 
  -- we must DELETE it to free up the ID slot.
  -- We assume the user prefers the account they are trying to recover.
  delete from profiles where id = new_uid;

  -- Transfer ownership of children rows
  -- Note: We update these first so they point to the new ID. 
  -- If we didn't delete the profile above, this might fail if foreign keys enforce integrity strictly against profiles.
  update gallery_posts set user_id = new_uid where user_id = old_uid;
  update gallery_comments set user_id = new_uid where user_id = old_uid;
  update gallery_likes set user_id = new_uid where user_id = old_uid;
  update user_rewards set user_id = new_uid where user_id = old_uid;
  update user_inventory set user_id = new_uid where user_id = old_uid;
  update messages set user_id = new_uid where user_id = old_uid;
  
  -- Finally, move the old profile to the new ID and update email
  update profiles 
  set id = new_uid, 
      email = (select email from auth.users where id = new_uid) 
  where id = old_uid;
  
end;
$$;
