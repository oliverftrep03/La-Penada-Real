-- Add highlighted_until column to map_pins table
alter table map_pins add column highlighted_until timestamp with time zone;

-- Policy to allow anyone to read this column (already covered by "select *" but good to be safe if strictly defined)
-- Existing policy "See all pins" likely covers it.
