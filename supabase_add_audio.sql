-- Add audio_url column to store_items if it doesn't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'store_items' and column_name = 'audio_url') then
    alter table store_items add column audio_url text;
  end if;
end $$;
