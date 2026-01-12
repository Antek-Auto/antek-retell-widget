# Quick Start Guide

Everything has been set up! Follow these steps to get your app running.

## Step 1: Create a New Supabase Project (5 minutes)

1. Go to https://supabase.com/dashboard
2. Click **New Project**
3. Fill in details:
   - Project name: anything you want
   - Database password: save this!
   - Region: closest to you
4. Wait for it to provision (2-3 minutes)
5. Once ready, go to **Settings → API** and copy:
   - **Project URL** (e.g., `https://xxx.supabase.co`)
   - **anon public** key
   - **service_role** key

## Step 2: Get Retell AI API Key (1 minute)

From https://retell.ai/dashboard, get:
- **API Key** (used globally)

**Note**: Agent IDs are configured per-widget later in the dashboard, so each widget can have different agents.

## Step 3: Run the Setup Script (3 minutes)

```bash
cd chatmate-voice-aavac-bot

# Install dependencies
npm install

# Run the setup script
npm run setup:supabase
```

When prompted, paste:
- Supabase URL
- Anon Key
- Service Role Key
- Retell API Key

(Agent IDs are configured per-widget, not here)

✅ This will automatically:
- Test connection to Supabase
- Run database migrations
- Create `.env.local` with your credentials

## Step 4: Deploy Edge Functions (5 minutes)

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project (paste your db password when asked)
supabase link --project-ref <YOUR_PROJECT_REF>
# Get PROJECT_REF from your URL: https://[PROJECT_REF].supabase.co

# Deploy all functions
supabase functions deploy retell-create-call
supabase functions deploy retell-text-chat
supabase functions deploy widget-config
supabase functions deploy widget-embed
supabase functions deploy wordpress-plugin

# Set the global API key secret
supabase secrets set RETELL_API_KEY=<YOUR_API_KEY>
```

**Note**: Agent IDs are set per-widget in the dashboard when you create/edit widgets

## Step 5: Test Locally (2 minutes)

```bash
npm run dev

# Visit http://localhost:8080/auth
# Sign up with your email
# Should redirect to dashboard
```

✅ Success! You now have a working app!

## Step 6: Deploy to Vercel (Optional - 5 minutes)

```bash
# Commit changes
git add .
git commit -m "Remove sales page, setup new Supabase"
git push

# Go to Vercel Dashboard
# Import your GitHub repo
# Add environment variables:
#   - VITE_SUPABASE_URL (from .env.local)
#   - VITE_SUPABASE_PUBLISHABLE_KEY (from .env.local)
#   - CRON_SECRET (from previous setup)
# Deploy!
```

## Useful Commands

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Build for production
npm run preview                # Preview production build
npm run lint                   # Check code quality

# Setup
npm run setup:supabase        # Run setup script again

# Edge Functions (Supabase CLI)
supabase functions list        # List deployed functions
supabase functions get-logs <name>  # View function logs
```

## What You Now Have

✅ **Clean App**
- No sales page
- Simple auth flow
- Dashboard for widget management

✅ **Your Own Supabase Project**
- Full control over database
- 7 tables with security policies
- 5 Edge Functions for voice/chat

✅ **Deployed & Auto-Updating**
- Code on GitHub
- App running on Vercel
- Cron job keeps Supabase active every 3 days

## User Flows

### First Time Users
```
Visit app
  ↓
Redirect to /auth (not logged in)
  ↓
Sign up with email/password
  ↓
Email confirmation
  ↓
Click link → Redirect to /dashboard
  ↓
Dashboard loads
  ↓
Create first widget
```

### Returning Users
```
Visit app
  ↓
Redirect to /auth (not logged in)
  ↓
Sign in with email/password
  ↓
Redirect to /dashboard
  ↓
Manage widgets
```

## Troubleshooting

**"Cannot connect to Supabase"**
- Check URL is correct: `https://...supabase.co`
- Verify API keys are correct
- Ensure project is fully provisioned

**"Edge Function deployment failed"**
- Run: `supabase link --project-ref <YOUR_REF>`
- Make sure you're in the project directory
- Check that functions exist in `supabase/functions/`

**"App doesn't redirect properly"**
- Check `.env.local` has correct Supabase credentials
- Clear browser cache
- Check browser console for errors
- Restart dev server: `npm run dev`

**"Can't sign up"**
- Check Supabase has email auth enabled (default: yes)
- Check database migrations ran successfully
- Look at Supabase dashboard for errors

## Full Documentation

- **Setup Details**: `SUPABASE_SETUP_GUIDE.md`
- **Implementation Changes**: `IMPLEMENTATION_COMPLETE.md`
- **Architecture**: `CLAUDE.md`
- **Cron Setup**: `VERCEL_CRON_SETUP.md`

## Next Steps

1. ✅ Create Supabase project
2. ✅ Run setup script
3. ✅ Deploy Edge Functions
4. ✅ Test locally
5. ✅ Deploy to Vercel
6. 📧 Invite other users to sign up
7. 🎨 Create your widgets
8. 📊 Monitor in Supabase dashboard

---

**Questions?** Check the SUPABASE_SETUP_GUIDE.md for detailed troubleshooting and architecture info.

**Ready?** Start with "Step 1: Create a New Supabase Project" above! 🚀
