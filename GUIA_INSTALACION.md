# 🚀 Cómo publicar tu App (y tenerla en el móvil)

Para que tú y tus amigos podáis tener la app en el móvil y que se actualice sola, sigue estos pasos. Es gratis y se hace en 5 minutos.

## 1. Subir el Código a GitHub
La app necesita vivir en internet.
1. Ve a [GitHub.com](https://github.com) y crea un **Nuevo Repositorio** (ponle nombre, ej: `lapenada-app`).
2. Sube los archivos de esta carpeta a ese repositorio.

## 2. Publicar en Vercel (Hosting Gratis)
Vercel es quien hace la magia de que la app funcione.
1. Crea una cuenta en [Vercel.com](https://vercel.com).
2. Dale a **"Add New..."** -> **"Project"**.
3. Selecciona tu repositorio de GitHub (`lapenada-app`).
4. Dale a **"Deploy"**.
5. ¡Listo! Vercel te dará un enlace (ej: `lapenada-app.vercel.app`).

## 3. Configurar Bases de Datos (Supabase)
Vercel necesita saber tus claves de Supabase para que el mapa y el chat funcionen.
1. En Vercel, ve a tu proyecto -> **Settings** -> **Environment Variables**.
2. Añade las mismas variables que tienes en tu archivo `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 4. Instalar en el Móvil 📱
1. Abre el enlace de Vercel en tu móvil (Safari en iPhone, Chrome en Android).
2. Abre el menú del navegador (los 3 puntitos o el botón compartir).
3. Busca la opción **"Añadir a pantalla de inicio"** (Add to Home Screen).
4. 🎉 ¡PUM! Ahora tienes el icono en tu menú y se abre como una app normal.

## 🔄 Cómo actualizar
Cada vez que yo haga un cambio aquí y tú actualices el repositorio en GitHub, **Vercel detectará el cambio y actualizará la app en el móvil de todos automáticamente**. ¡Magia pura! ✨
