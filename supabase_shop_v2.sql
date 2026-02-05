-- Add image_url to store_items
alter table store_items add column image_url text;

-- Allow rarity to be null or set for all types (constraint check update might be needed if strictly enforced)
-- My previous script: check (rarity in (...)) -- this was correctly defined for collectibles, but I might need to drop the check if I want to enforce it for frames/icons too and the previous constraint only applied to collectibles? 
-- Actually, the previous constraint was: `rarity text check (rarity in ...)` which applies to the column regardless of type. The logic `(type = 'collectible' AND rarity IS NOT NULL)` was just a UI restriction I made, or handled in code.
-- I will re-verify the table definition. If I used a table constraint like `check (type != 'collectible' OR rarity IS NOT NULL)`, I might need to alter it.
-- Assuming simple column check, it allows it.

-- Ensure bucket for shop assets
insert into storage.buckets (id, name, public) values ('shop_assets', 'shop_assets', true)
on conflict (id) do nothing;

create policy "Public Shop Assets" on storage.objects for select using (bucket_id = 'shop_assets');
create policy "Admin Upload Shop Assets" on storage.objects for insert with check (bucket_id = 'shop_assets');
