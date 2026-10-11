# Hero Archive

Hero Archive is a full-stack superhero catalog built as a developer portfolio project. Browse characters from multiple publishers, search by name or alias, and open detailed profiles. A curated Marvel collection and signed-in favorites are also available.

## Features

- Search the full catalog by character name, real name, or alias.
- Filter characters by universe or publisher.
- Open character profiles with biography, appearance, work, connections, and power stats.
- Browse a separate curated Marvel collection with add and edit forms.
- Create an account and save favorites with Supabase Auth.
- Navigate between the Home, Characters, and Battle pages. Battle mode is planned.

## Tech stack

- React and Vite for the frontend
- Tailwind CSS for styling
- Node.js and Express for the API
- Supabase Postgres for character data and favorites
- Supabase Auth for user accounts

## Run locally

The frontend depends on the API in the separate `marvel-backend` project. Start the backend first and follow its README to configure the database and import the full universe dataset.

1. In PowerShell, go to `C:\Projects\marvel-frontend`.
2. Copy the example environment file:

   ```powershell
   Copy-Item .env.example .env.local
   ```

3. In `.env.local`, add the Supabase Project URL and publishable key from **Project Settings → API Keys**. `VITE_API_URL` should point to the backend, usually `http://localhost:5000`.
4. Install dependencies and start the frontend:

   ```powershell
   npm.cmd install
   npm.cmd run dev
   ```

5. Open the local address Vite prints, usually `http://localhost:5173`.

In PowerShell, use `npm.cmd` if the script execution policy prevents `npm` from running. Vite reads environment variables when it starts, so restart the frontend after changing `.env.local`.

## Accounts and favorites

The app uses Supabase Auth for email and password sign-up and sign-in. Configure the local site URL and redirect URL as `http://localhost:5173` in Supabase **Authentication → URL Configuration**. Before using favorites, run `database-migration-favorites.sql` from the backend project in the Supabase SQL Editor. Row Level Security policies restrict each account to its own favorites.

The Supabase publishable key is intended for browser use. Never put a database password or secret/service-role key in this frontend project. Keep `.env.local` private; it is ignored by Git.

## Data source

The full catalog is imported from the [Akabab Superhero API](https://github.com/akabab/superhero-api). Character records and image URLs are displayed with source attribution. Superhero characters and their artwork belong to their respective rights holders; this fan-made portfolio project is not affiliated with them.
