# Harsh — Fashion Portfolio

Luxury editorial portfolio for an Indo-Western fashion designer, built with Next.js App Router, React, TypeScript and Tailwind CSS.

## Run locally

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Run `npm run dev` and open http://localhost:3000.
4. Run `npm run build` to create a production build.

## Pages

- Home
- About
- Collections
- Projects
- Sketches & Illustrations
- Material Archive
- Contact

## Supabase contact form setup

1. Create a Supabase project at https://supabase.com.
2. In the Supabase dashboard, open SQL Editor and run `supabase/migrations/202611260001_create_contact_messages.sql`.
3. In Project Settings → API Keys, copy the Project URL and the publishable key.
4. Add them to your hosting provider as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. For local development, copy `.env.example` to `.env.local` and fill in those values.
5. The contact messages and admin inbox migrations are already applied to the connected project. If setting up a fresh project, run both SQL files in `supabase/migrations/` in filename order.
6. Create an admin user in Supabase Authentication → Users. Then run this SQL in the SQL Editor, replacing the email with that user's email:

   ```sql
   update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
   where email = 'YOUR_EMAIL';
   ```

7. Open `/admin` on the deployed website and sign in. The admin role is stored in app metadata and enforced by the database RLS policy.
8. Redeploy the website and submit a test message. View submissions in the private admin inbox.

Only the public publishable/anon key belongs in the browser. Never put a Supabase service-role key in a `NEXT_PUBLIC_*` variable or commit it to GitHub. Row-level security allows public inserts only; visitors cannot read submitted messages through the website.

## Before publishing

The colour panels are intentional placeholders, not real portfolio photography. Replace them with approved fashion images and update the sample biography, project descriptions, contact email and social links. The contact form saves messages to Supabase after the Supabase project and environment variables are configured.

## Brand direction

Ivory #F5F1EA · Ink #171614 · Burgundy #6B2638 · Terracotta #B66D55 · Antique gold #C7A77B · Warm sand #D1BBA1.
