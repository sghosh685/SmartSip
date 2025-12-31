# Google OAuth Setup for SmartSip

This guide walks through setting up Google Sign-In for SmartSip via Supabase.

---

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown (top-left) → **"New Project"**
3. Name it: `SmartSip`
4. Click **Create**

---

## Step 2: Configure OAuth Consent Screen

1. In Google Cloud Console, go to **APIs & Services > OAuth consent screen**
2. Select **External** (allows any Google user to sign in)
3. Click **Create**
4. Fill in:
   - **App name:** SmartSip
   - **User support email:** your email
   - **Developer contact:** your email
5. Click **Save and Continue**
6. **Scopes:** Click "Add or Remove Scopes"
   - Select: `email`, `profile`, `openid`
   - Click **Update** → **Save and Continue**
7. **Test users:** Skip (not needed for External)
8. Click **Back to Dashboard**

---

## Step 3: Create OAuth Credentials

1. Go to **APIs & Services > Credentials**
2. Click **+ Create Credentials > OAuth client ID**
3. Select **Web application**
4. Name: `SmartSip Web`
5. **Authorized JavaScript origins:** (Leave empty for now)
6. **Authorized redirect URIs:** Add your Supabase callback URL:
   ```
   https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
   ```
   > ⚠️ Replace `YOUR_PROJECT_ID` with your actual Supabase project ID
   > (Found in Settings > General > Reference ID)

7. Click **Create**
8. **Copy the Client ID and Client Secret** — you'll need these next.

---

## Step 4: Configure Supabase

1. In Supabase Dashboard, go to **Authentication > Providers**
2. Find **Google** and click to expand
3. Toggle **Enable Sign in with Google** to ON
4. Paste:
   - **Client ID:** (from Google)
   - **Client Secret:** (from Google)
5. Click **Save**

---

## Step 5: Configure Redirect URLs in Supabase

1. Go to **Authentication > URL Configuration**
2. Set:
   - **Site URL:** `http://localhost:5173` (for development)
   - **Redirect URLs:** Add:
     - `http://localhost:5173`
     - `http://localhost:5173/`

> 📝 For production, you'll update these to your Vercel URL later.

---

## Step 6: Test Locally

1. Create `frontend/.env` with your credentials:
   ```
   VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_API_URL=http://localhost:8001/api
   ```

2. Restart the dev server:
   ```bash
   cd frontend && npm run dev
   ```

3. Click the **Cloud icon** in the app header
4. Click **"Sign in with Google"**
5. Complete the Google login flow
6. You should be redirected back with the Cloud icon now **green** ✓

---

## Troubleshooting

### "Error 400: redirect_uri_mismatch"
- The redirect URI in Google Console doesn't match Supabase
- Ensure it's exactly: `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`
- No trailing slash

### "This app isn't verified"
- This is normal for development
- Click **"Advanced" > "Go to SmartSip (unsafe)"**
- For production, you can verify the app later

### "Invalid client_id"
- Double-check you copied the full Client ID from Google
- Make sure there are no extra spaces

---

## Security Note

⚠️ **Never commit your `.env` files to Git!**  
The `.gitignore` file is already configured to exclude them.
