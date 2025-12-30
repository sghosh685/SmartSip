# SmartSip Deployment Guide

## Overview

This guide covers deploying SmartSip to production using:
- **Backend:** Render (Free tier)
- **Frontend:** Vercel (Free tier)
- **Database:** Supabase Postgres (Free tier)

---

## Prerequisites

Before deploying, ensure you have:
- [ ] Supabase project created (see `SUPABASE_SETUP.md`)
- [ ] Google OAuth configured in Supabase
- [ ] Groq API key (for AI Coach)
- [ ] GitHub repository with your code

---

## Step 1: Push Code to GitHub

1. Initialize git (if not already):
```bash
cd /path/to/SmartSip
git init
git add .
git commit -m "Initial commit: SmartSip V1.0"
```

2. Create a new repo on GitHub.

3. Push:
```bash
git remote add origin https://github.com/YOUR_USERNAME/smartsip.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy Backend to Render

### Option A: Using render.yaml (Recommended)

1. Go to [render.com](https://render.com) and sign in.
2. Click **"New" > "Blueprint"**.
3. Connect your GitHub repo.
4. Render will auto-detect `render.yaml` and configure the service.
5. Click **"Apply"**.

### Option B: Manual Setup

1. Go to **Dashboard > New > Web Service**.
2. Connect your GitHub repo.
3. Configure:
   - **Name:** `smartsip-api`
   - **Environment:** Python 3
   - **Build Command:** `cd backend && pip install -r requirements.txt`
   - **Start Command:** `cd backend && uvicorn backend:app --host 0.0.0.0 --port $PORT`
4. Add Environment Variables:
   - `DATABASE_URL` = (your Supabase connection string)
   - `GROQ_API_KEY` = (your Groq API key)
   - `CORS_ORIGINS` = `https://YOUR_VERCEL_URL.vercel.app`
5. Click **"Create Web Service"**.

### Verify Backend

Once deployed, visit:
```
https://smartsip-api.onrender.com/
```

You should see:
```json
{"status": "SmartSip Backend Running"}
```

---

## Step 3: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in.
2. Click **"Add New" > "Project"**.
3. Import your GitHub repo.
4. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Add Environment Variables:
   - `VITE_SUPABASE_URL` = (your Supabase URL)
   - `VITE_SUPABASE_ANON_KEY` = (your Supabase anon key)
   - `VITE_API_URL` = (leave empty - handled by rewrites)
6. Click **"Deploy"**.

### Update Backend CORS

After Vercel deployment, update Render's environment variable:
```
CORS_ORIGINS=https://YOUR_PROJECT.vercel.app
```

---

## Step 4: Update vercel.json

Edit `frontend/vercel.json` to point to your actual Render URL:

```json
{
    "rewrites": [
        {
            "source": "/api/:path*",
            "destination": "https://smartsip-api.onrender.com/:path*"
        }
    ]
}
```

Commit and push this change. Vercel will auto-redeploy.

---

## Step 5: Configure Supabase Redirect URLs

In Supabase Dashboard > Authentication > URL Configuration:

1. **Site URL:** `https://YOUR_PROJECT.vercel.app`
2. **Redirect URLs:** Add:
   - `https://YOUR_PROJECT.vercel.app`
   - `https://YOUR_PROJECT.vercel.app/`

---

## Step 6: End-to-End Testing

1. Visit your Vercel URL.
2. Click the Cloud icon to sign in.
3. Complete Google OAuth.
4. Log some water.
5. Refresh the page - data should persist.
6. Check Supabase Table Editor - you should see your user and logs.

---

## Troubleshooting

### "CORS Error"
- Ensure `CORS_ORIGINS` in Render matches your Vercel URL exactly.
- Include `https://` prefix.

### "502 Bad Gateway" on Render
- Check Render logs for errors.
- Verify `DATABASE_URL` is correct.

### "OAuth Not Redirecting"
- Check Supabase Site URL and Redirect URLs.
- Ensure Google OAuth credentials are correct.

### "Data Not Persisting"
- Check browser console for API errors.
- Verify backend is running (check Render logs).

---

## Production Checklist

- [ ] Backend deployed to Render
- [ ] Frontend deployed to Vercel
- [ ] Environment variables set in both platforms
- [ ] CORS configured correctly
- [ ] Supabase redirect URLs configured
- [ ] End-to-end test passed
- [ ] PWA install tested on mobile

---

## Monitoring

- **Render:** Dashboard shows request logs, build logs
- **Vercel:** Analytics shows page views, Web Vitals
- **Supabase:** Dashboard shows database usage, auth logs

---

## Cost Estimation (Free Tiers)

| Service | Free Tier Limits |
| :--- | :--- |
| Render | 750 hours/month (enough for ~1 always-on service) |
| Vercel | 100GB bandwidth, unlimited projects |
| Supabase | 500MB database, 50K monthly active users |

For a personal/small app, you'll stay well within free tiers.
