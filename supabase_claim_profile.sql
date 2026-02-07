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

  -- Disable RLS momentarily or assume security definer handles it (it does)
  
  -- 1. Update Profile ID (Linking to new auth user)
  -- We update the ID. Note: This might fail if ID is referenced by FKs with ON UPDATE RESTRICT.
  -- Ideally, our schema should have ON UPDATE CASCADE.
  -- If not, we have to insert new and delete old, or update children first.
  -- Supabase Auth IDs are usually not cascading. Let's try updating children first.
  
  -- Update children tables to point to new_uid
  update gallery_posts set user_id = new_uid where user_id = old_uid;
  update gallery_comments set user_id = new_uid where user_id = old_uid;
  update gallery_likes set user_id = new_uid where user_id = old_uid;
  update user_rewards set user_id = new_uid where user_id = old_uid;
  update user_inventory set user_id = new_uid where user_id = old_uid;
  update messages set user_id = new_uid where user_id = old_uid; -- Chat messages
  
  -- Finally, update or recreate the profile
  -- Since we can't easily change the PK if it's referenced, but we just moved all references...
  -- We can now Delete old profile and Insert new, OR Update if no other constraints.
  
  -- Let's try updating the profile ID directly.
  -- If this fails due to other constraints, we'll strip them.
  update profiles set id = new_uid, email = (select email from auth.users where id = new_uid) where id = old_uid;
  
end;
$$;
