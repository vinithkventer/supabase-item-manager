
# Item Manager (Supabase + React + Vite)

**What you get**
- Auth (Google + Magic Link)
- App is fully locked behind auth
- Items table (code, name, material, vendor)
- File uploads to Supabase Storage with versioned paths
- "Latest" download + dropdown of older versions
- RLS so only authenticated users can access
- Free-tier friendly (Supabase + Vercel/Netlify)

## 1) Create a Supabase project (Free)
- Go to supabase.com → New Project
- In **Authentication → Providers**, enable **Email (Magic link)** and **Google** (enter OAuth credentials).
- In **Storage**, create a bucket named `files` (private).
- In **SQL Editor**, paste and run `supabase/schema.sql` from this repo.

## 2) Get your keys
- Project Settings → API:
  - `VITE_SUPABASE_URL` = Project URL
  - `VITE_SUPABASE_ANON_KEY` = anon public key

## 3) Local run
```bash
npm i
echo "VITE_SUPABASE_URL=...your url..." > .env
echo "VITE_SUPABASE_ANON_KEY=...your anon..." >> .env
npm run dev
```
(Note: Vite loads `.env` automatically.)

## 4) Deploy (Free)
- **Vercel** or **Netlify** → Import the repo/folder
- Add the two env vars in project settings
- Build command: `npm run build`
- Output dir: `dist`

## 5) Using the app
- Sign in (Google or email link)
- Add Items
- Click an item to manage files:
  - Upload **drawings**, **certificates**, or **other** files
  - Set **version** and optionally mark as **latest**
  - Latest shows as a single click; older versions under a dropdown

## Notes
- To restrict by user/team, add an `org_id` column and scope RLS to that.
- You can rename file types in the ENUM or add more.
- Supabase free tier typically includes generous Postgres + 1 GB storage.
