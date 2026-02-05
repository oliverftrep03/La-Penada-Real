create or replace function buy_item(item_id uuid, item_price int)
returns boolean as $$
declare
  user_balance int;
begin
  -- 1. Check balance
  select coins into user_balance from profiles where id = auth.uid();
  
  if user_balance < item_price then
    return false; -- Not enough money
  end if;

  -- 2. Deduct coins
  update profiles set coins = coins - item_price where id = auth.uid();

  -- 3. Add to inventory
  insert into user_inventory (user_id, item_id) values (auth.uid(), item_id);

  return true;
end;
$$ language plpgsql security definer;
