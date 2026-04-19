# KW Arizona Living Realty — Agent Dashboard

A private, password-protected agent resource directory built with Next.js, Supabase, and Vercel.

---

## Setup Guide (Step by Step)

### Step 1 — Supabase

1. Go to [supabase.com](https://supabase.com) and open your project (or create a new one).
2. In the left sidebar, click **SQL Editor**.
3. Copy the entire contents of `supabase-schema.sql` and paste it into the editor. Click **Run**.
4. Go to **Project Settings → API** and copy:
   - **Project URL** → this is your `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Go to **Authentication → URL Configuration** and set:
   - Site URL: `https://your-vercel-domain.vercel.app`
   - Redirect URLs: `https://your-vercel-domain.vercel.app/auth/callback`

---

### Step 2 — GitHub

1. Create a new repository on [github.com](https://github.com).
2. Upload all these project files to that repository.
   - Drag and drop the folder contents into the GitHub web UI, or use Git from your terminal.

---

### Step 3 — Vercel

1. Go to [vercel.com](https://vercel.com) and click **Add New Project**.
2. Import your GitHub repository.
3. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
4. Click **Deploy**. Vercel will build and publish your site.
5. Copy your Vercel URL (e.g. `kw-agent-dashboard.vercel.app`) and add it to Supabase URL Configuration (Step 1.5).

---

### Step 4 — Make yourself an admin

1. Open your live site and sign up with your email at `/auth`.
2. Go back to Supabase → **SQL Editor** and run:

```sql
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'your@email.com';
```

3. Sign in — you'll now see the **Admin Panel** button.

---

### Step 5 — Add your content

In the Admin Panel:
- **Resources** — add all your links with names, descriptions, URLs, and categories
- **Categories** — edit or reorder the existing categories
- **Bulletins** — add broker announcements (shown as red banner)
- **Events** — upcoming events with RSVP links (shown as gold bar)
- **Partners** — preferred partners with contact info
- **Users** — promote agents to admin, or remove departed agents

---

### Revoking access for a departed agent

1. In Admin Panel → **Users**, click **Remove** next to their name.
2. Go to Supabase → **Authentication → Users**, find them, and click **Delete User**.

They will no longer be able to sign in.

---

## Tech Stack

- **Next.js 14** — React framework
- **Supabase** — database + authentication
- **Vercel** — hosting
- **Tailwind CSS** — styling
- **Barlow / Barlow Condensed** — typography (matches KW brand feel)
