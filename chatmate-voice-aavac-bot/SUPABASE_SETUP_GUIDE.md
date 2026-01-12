# Supabase Setup Guide

This guide walks you through setting up a new Supabase project for this application.

## Prerequisites

- Node.js 16+ installed
- A [Supabase account](https://supabase.com/) (free tier is fine)
- A [Retell AI account](https://retell.ai/) with API credentials

## Step 1: Create a New Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click **New Project**
3. Fill in the form:
   - **Project Name**: Choose a name (e.g., "aavac-bot")
   - **Database Password**: Create a strong password and save it!
   - **Region**: Choose the region closest to you
4. Click **Create new project**
5. Wait 2-3 minutes for the project to be provisioned

## Step 2: Get Your Credentials

Once the project is ready:

1. Go to **Project Settings** (gear icon in the bottom left)
2. Click **API** tab
3. Copy these values:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **anon public** key (starts with `eyJ...`)
   - **service_role** key (starts with `eyJ...`, keep this secret!)

Also from Retell AI dashboard:
- **API Key**
- **Voice Agent ID**
- **Text Agent ID**

## Step 3: Run the Automated Setup Script

```bash
cd chatmate-voice-aavac-bot

# Install dependencies
npm install inquirer@9.2.12 chalk@5.3.0 dotenv@16.3.1

# Run the setup script
node scripts/setup-supabase.js
```

The script will:
- Prompt you for your Supabase and Retell credentials
- Test the connection
- Run all database migrations
- Create `.env.local` with your credentials
- Print next steps

## Step 4: Deploy Edge Functions

Edge Functions handle voice calls, chat, and widget serving. Deploy them with Supabase CLI:

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your new project (you'll be prompted for your database password)
supabase link --project-ref <YOUR_PROJECT_REF>

# Deploy all functions
supabase functions deploy retell-create-call
supabase functions deploy retell-text-chat
supabase functions deploy widget-config
supabase functions deploy widget-embed
supabase functions deploy wordpress-plugin

# Set the global Retell API key
supabase secrets set RETELL_API_KEY=<YOUR_RETELL_API_KEY>
```

**Note**: Replace `<YOUR_PROJECT_REF>` with the project ref from your URL (e.g., `abcdefgh` from `https://abcdefgh.supabase.co`)

**Important**: Agent IDs are configured **per-widget** in the dashboard, not as environment variables. This allows each widget to use different Retell agents.

## Step 5: Test Locally

```bash
# Start the development server
npm run dev

# Visit http://localhost:8080/auth
# Sign up with your email
# You should be redirected to /dashboard
```

## Step 6: Make Yourself Admin (Optional)

To access admin features like `/admin/demo`:

1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Copy your user ID
3. Go to **SQL Editor** and run:

```sql
INSERT INTO user_roles (user_id, role)
VALUES ('<YOUR_USER_ID>', 'admin');
```

## Step 6.5: Configure Per-Widget Agent IDs

Each widget can have its own Retell agents. To set them up:

1. Go to Dashboard (`http://localhost:8080/dashboard` or your Vercel URL)
2. Click **Create Widget** or edit an existing widget
3. In the widget settings, you'll see:
   - **Voice Agent ID** - Retell agent ID for voice calls
   - **Chat Agent ID** - Retell agent ID for text chat
   - **Custom API Key** (optional) - Override the global key for this widget

**Why per-widget agents?**
- Each widget can handle different use cases with different AI behaviors
- You can use different agents for different website sections
- Each agent can have custom prompts, knowledge bases, and personality

**Optionally, you can also:**
- Create a default demo configuration at `/admin/demo` (admin only)
- Set global defaults that new widgets inherit
- Override on a per-widget basis for specific needs

## Step 7: Deploy to Vercel

### 7.1 Connect to GitHub

1. Push your code to GitHub:
```bash
git add .
git commit -m "Remove sales page, setup new Supabase project"
git push
```

2. Go to [Vercel](https://vercel.com) and import your GitHub repository

### 7.2 Add Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables, add:

```
VITE_SUPABASE_URL=https://<YOUR_PROJECT_REF>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<YOUR_ANON_KEY>
CRON_SECRET=<YOUR_CRON_SECRET>
```

Copy the first two from `.env.local`. For `CRON_SECRET`, use the one from the cron job setup or generate a new one:
```bash
openssl rand -base64 32
```

### 7.3 Deploy

1. Click **Deploy**
2. Wait for deployment to complete
3. Your app is now live!

## Database Schema

### Tables Created

- **profiles**: User profile data (created automatically on signup)
- **widget_configs**: Widget settings, customization, and Retell agent IDs
- **demo_settings**: Global demo widget configuration
- **teams**: Team/organization management
- **team_members**: Team membership and roles
- **team_invitations**: Email invitations for team members
- **user_roles**: User role assignments (admin, moderator, user)

### Key Features

- **Automatic profile creation**: New profiles are created when users sign up
- **Widget limit**: 100 widgets per user (enforced by trigger)
- **RLS policies**: All tables are protected with row-level security
- **Cascade deletes**: Deleting a user deletes all their data
- **Role-based access**: Admin, moderator, and user roles with different permissions

## Environment Variables

Your `.env.local` contains:

```
VITE_SUPABASE_URL              # Supabase project URL
VITE_SUPABASE_PUBLISHABLE_KEY  # Public API key (safe for client)
VITE_SUPABASE_PROJECT_ID       # Project reference
VITE_RETELL_API_KEY            # Retell API key (global, used by Edge Functions)
```

**Agent IDs are NOT in .env.local** - they're configured per-widget in the dashboard:
- Each widget can have its own `voice_agent_id` and `chat_agent_id`
- Optionally override with a widget-specific `retell_api_key`

Never commit `.env.local` or share the `VITE_SUPABASE_PUBLISHABLE_KEY` publicly.

## Troubleshooting

### "Cannot connect to Supabase"
- Verify the URL is correct: `https://...supabase.co`
- Check your API keys are correct
- Ensure the project is fully provisioned

### "Table already exists"
- Migrations may have already been applied
- Safe to re-run the setup script

### "Edge Function deployment failed"
- Ensure Supabase CLI is linked: `supabase link --project-ref <REF>`
- Check you're in the project directory
- Verify functions exist in `/supabase/functions/`

### "Sign up creates profile but page doesn't redirect"
- Check browser console for errors
- Verify `.env.local` has correct Supabase credentials
- Clear browser cache and try again

### "Widget doesn't appear on page"
- Check widget config in Dashboard
- Verify API key is correct
- Check browser console for errors
- Ensure domain is in allowed_domains list

## What to Do Next

1. **Add Users**: Share the `/auth` page link for others to sign up
2. **Create Widgets**: Go to Dashboard and create new widgets
3. **Configure Widgets**: Click on a widget to customize appearance and behavior
4. **Embed Widgets**: Copy embed code from `/embed` or widget details
5. **Manage Team**: Invite team members from Dashboard (if teams feature is needed)

## Architecture Overview

```
┌─────────────────────────────────────────┐
│  Frontend (React + Vite)                │
│  - Auth page, Dashboard, Settings       │
│  - Calls Supabase JS client             │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Supabase                               │
│  - PostgreSQL Database                  │
│  - Auth (Email/Password)                │
│  - Edge Functions (Deno)                │
│  - RLS Policies (Security)              │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  External Services                      │
│  - Retell AI (Voice/Chat)               │
│  - Email Provider (Auth emails)         │
└─────────────────────────────────────────┘
```

## Support

- [Supabase Docs](https://supabase.com/docs)
- [Retell AI Docs](https://docs.retellai.com)
- [React Router Docs](https://reactrouter.com)
- This project uses: Vite, React 18, TailwindCSS, shadcn-ui

## What Changed From Lovable Setup

| Aspect | Before | After |
|--------|--------|-------|
| **Project Owner** | Lovable | You |
| **Supabase Access** | Limited (Lovable-managed) | Full control |
| **Database Migrations** | Auto-managed | Manual control |
| **Edge Functions** | Lovable deploys | You deploy |
| **Environment** | Lovable `.env` | Your `.env.local` |
| **Billing** | Lovable account | Your Supabase account |

## Useful Commands

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Start Supabase emulator locally
supabase start

# Deploy Edge Functions
supabase functions deploy <function-name>

# View Edge Function logs
supabase functions get-logs <function-name>

# Pull latest schema from production
supabase db pull
```

## Security Checklist

- ✅ Service Role Key kept secret (not in code)
- ✅ Anon Key safe to share (read-only with RLS)
- ✅ RLS policies on all tables
- ✅ Cron job secret separate from app secrets
- ✅ Email confirmation required for new signups
- ✅ Database password saved securely

---

**Created**: 2026-01-11
**Supabase Version**: 2.x
**Status**: Ready for production use
