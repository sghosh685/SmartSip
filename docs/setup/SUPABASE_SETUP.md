# Supabase Setup Guide for SmartSip

This guide walks you through setting up Supabase for SmartSip authentication and database.

---

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login.
2. Click **"New Project"**.
3. Fill in:
   - **Name:** `smartsip`
   - **Database Password:** (save this somewhere safe)
   - **Region:** Choose closest to your users
4. Click **"Create new project"** and wait ~2 minutes for setup.

---

## Step 2: Get Your API Credentials

1. In your project dashboard, go to **Settings > API**.
2. Copy these values:

| Key | Where to Find |
| :--- | :--- |
| `SUPABASE_URL` | Project URL (e.g., `https://xyz.supabase.co`) |
| `SUPABASE_ANON_KEY` | Project API keys > `anon` `public` |

3. Create a `.env` file in the `frontend/` directory:

```bash
cp frontend/.env.example frontend/.env
```

4. Edit `frontend/.env`:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_API_URL=http://localhost:8001/api
```

---

## Step 3: Enable Google OAuth

1. In Supabase Dashboard, go to **Authentication > Providers**.
2. Find **Google** and click to expand.
3. Toggle **Enable Sign in with Google** to ON.
4. You'll need Google OAuth credentials. Follow these steps:

### Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (or use existing).
3. Go to **APIs & Services > Credentials**.
4. Click **Create Credentials > OAuth client ID**.
5. Select **Web application**.
6. Add these Authorized redirect URIs:
   - `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`
   - (Replace `YOUR_PROJECT_ID` with your actual Supabase project ID)
7. Copy the **Client ID** and **Client Secret**.

### Configure in Supabase

1. Back in Supabase Authentication settings, paste:
   - **Client ID** from Google
   - **Client Secret** from Google
2. Click **Save**.

---

## Step 4: Configure Backend Database

The backend is already configured to read `DATABASE_URL` from environment.

1. In Supabase Dashboard, go to **Settings > Database**.
2. Find the **Connection string** section.
3. Copy the **URI** (it looks like `postgresql://postgres:...@...supabase.co:5432/postgres`).
4. Create a `backend/.env` file:

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_ID.supabase.co:5432/postgres
GROQ_API_KEY=your-groq-api-key
```

> ⚠️ Replace `YOUR_PASSWORD` with your database password from Step 1.

---

## Step 5: Test Locally

1. Start the backend:
```bash
cd backend && source venv/bin/activate && uvicorn backend:app --reload --port 8001
```

2. Start the frontend:
```bash
cd frontend && npm run dev
```

3. Open `http://localhost:5173` in your browser.
4. Click the **Cloud icon** in the header.
5. Click **"Sign in with Google"**.
6. You should be redirected to Google, then back to the app.
7. Check the Cloud icon - it should turn **green** ✓.

---

## Step 6: Verify Database Tables

1. In Supabase Dashboard, go to **Table Editor**.
2. You should see these tables created automatically:
   - `users`
   - `water_intake`
   - `daily_snapshots`

If tables don't appear, the backend will create them on first API request.

---

## Troubleshooting

### "Supabase credentials not found" warning
- Make sure `.env` file exists in `frontend/` directory.
- Restart the dev server after creating `.env`.

### Google OAuth not redirecting back
- Check that redirect URI in Google Console matches exactly.
- Make sure you're using `https://` for Supabase URL.

### Backend not connecting to Supabase
- Verify `DATABASE_URL` is correct.
- Check database password is URL-encoded if it contains special characters.

---

## Next Steps

Once authentication is working locally:
1. Proceed to **Sprint 2: Deployment** (Deploy to Render + Vercel).
2. Update environment variables in production.
