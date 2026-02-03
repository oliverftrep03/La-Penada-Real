-- 🗄️ CREAR BUCKET DE "GALLERY" (Desde SQL)

-- 1. Insertamos el bucket en la configuración de Storage
insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do nothing; -- Si ya existe, no hace nada

-- 2. Políticas de Seguridad para el Storage
-- (Para poder subir y ver fotos)

-- Permitir ver fotos a TODO el mundo (público)
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'gallery' );

-- Permitir SUBIR fotos solo si estás logueado
create policy "Authenticated Upload"
on storage.objects for insert
with check (
  bucket_id = 'gallery' 
  and auth.role() = 'authenticated'
);

-- Permitir BORRAR tus propias fotos
create policy "Delete Own Photos"
on storage.objects for delete
using (
  bucket_id = 'gallery' 
  and auth.uid() = owner
);
