# Online Setup Guide - No Local Development Required

**Deploy Antek Retell Widget in 10 minutes using only web browsers. No CLI, no local development, no npm required.**

## Prerequisites

Before you start, make sure you have accounts for:
- ✅ **GitHub** - for forking the repository
- ✅ **Supabase** (free tier available) - for the database and backend
- ✅ **Retell AI** with API key - for voice/chat agents
- ✅ **Vercel** - for hosting the frontend

## Step 1: Fork the GitHub Repository

1. Go to [GitHub Antek Retell Widget Repository](https://github.com/Nipstar/antek-retell-widget)
2. Click the **Fork** button (top right)
3. Select your GitHub account as the destination
4. Wait for the fork to complete

You now have your own copy of the repository on GitHub!

## Step 2: Create a Supabase Project

1. Go to [Supabase](https://supabase.com) and sign in / create account
2. Click **New Project**
3. Fill in:
   - **Project name**: `Antek Retell Widget` (or your preferred name)
   - **Database password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users
4. Click **Create new project** and wait 2-3 minutes for setup to complete

### Get Your Supabase Credentials

Once the project is created:
1. Go to **Settings** → **API** (left sidebar)
2. Copy these values (you'll need them later):
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **Publishable Key** (anon public key, starts with `eyJ...`)
   - **Project ID** (the part before `.supabase.co`, e.g., `xxxxx`)

**Save these in a safe place!**

## Step 3: Set Up Database Schema

1. In your Supabase project, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Open the file `chatmate-voice-aavac-bot/database-setup.sql` from your fork
4. Copy **all** the SQL code (Ctrl+A → Ctrl+C)
5. Paste into the Supabase SQL Editor
6. Click **Run** (⌨️ Ctrl+Enter)

✅ Your database is now set up with all tables, functions, and security policies!

## Step 4: Create Super Admin User

### 4a. Create the user in Supabase Auth

1. In your Supabase project, go to **Authentication** → **Users** (left sidebar)
2. Click **Add User**
3. Enter:
   - **Email**: Your admin email (e.g., `admin@example.com`)
   - **Password**: A strong password (8+ chars, uppercase, lowercase, number, special char)
4. Enable **Auto Confirm User** (switch on)
5. Click **Save**

### 4b. Assign Admin Role

1. Go back to **SQL Editor**
2. Click **New Query**
3. Open the file `chatmate-voice-aavac-bot/create-admin.sql`
4. **Replace `{USER_ID}`** with the actual user ID:
   - Go back to **Authentication** → **Users**
   - Find the user you just created
   - Copy the UUID (first column, long ID like `123e4567-e89b...`)
   - Paste it into the SQL, replacing `{USER_ID}`
5. Click **Run**

✅ Your super admin user is now set up!

## Step 5: Connect GitHub to Supabase (Edge Functions)

1. In Supabase, go to **Edge Functions** (left sidebar)
2. Click **Connect to GitHub**
3. Authorize the Supabase GitHub App
4. Select your **forked repository** (`your-username/antek-retell-widget`)
5. Supabase will automatically detect and deploy all Edge Functions

This may take 1-2 minutes. When done, you should see 5 Edge Functions listed:
- `retell-create-call`
- `retell-text-chat`
- `widget-config`
- `widget-embed`
- `wordpress-plugin`

## Step 6: Set Edge Function Secret

1. In Supabase, go to **Project Settings** → **Edge Functions** (left sidebar)
2. Click **Add Secret**
3. Set:
   - **Name**: `RETELL_API_KEY`
   - **Value**: Your Retell API key (from [Retell Dashboard](https://dashboard.retell.ai))
4. Click **Save**

✅ Edge Functions are now ready!

## Step 7: Deploy Frontend to Vercel

### 7a. Create Vercel Project

1. Go to [Vercel](https://vercel.com) and sign in / create account
2. Click **Add New...** → **Project**
3. Click **Import Git Repository**
4. Paste your forked GitHub repo URL or search for it: `your-username/antek-retell-widget`
5. Select the repository and click **Import**

### 7b. Set Environment Variables

Before deploying, you need to set environment variables:

1. In the "Configure Project" screen, click **Environment Variables**
2. Add these 4 variables (get values from Supabase → Settings → API):

| Variable | Value |
|----------|-------|
| `VITE_SUPABASE_URL` | Your Project URL (e.g., `https://xxxxx.supabase.co`) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Publishable Key (anon key, starts with `eyJ...`) |
| `VITE_SUPABASE_PROJECT_ID` | Your Project ID (e.g., `xxxxx`) |
| `VITE_RETELL_API_KEY` | Your Retell API Key (from Retell Dashboard) |

3. Click **Deploy**

Vercel will build and deploy your app. This takes 2-3 minutes.

### 7c. Access Your App

When deployment is complete:
1. Click the **Visit** button or go to your Vercel deployment URL
2. You should see the landing page with the demo widget
3. Click **Login** (top right)
4. Enter your super admin email and password
5. You're in! 🎉

## Step 8: Configure Your Widgets

Now that you're logged in:

### Configure the Demo Widget (Homepage)

1. Go to `/admin/demo` (or click "Admin" → "Configure Demo")
2. Set:
   - **Voice Agent ID**: From your Retell dashboard
   - **Chat Agent ID**: From your Retell dashboard
   - **Title & Greeting**: Customize messages
   - **Colors**: Set primary color
3. Click **Save**

### Create Your First Widget

1. Go to `/dashboard` (or click "Dashboard")
2. Click **Create Widget**
3. Fill in:
   - **Name**: `My First Widget`
   - **Voice Agent ID**: From Retell dashboard
   - **Chat Agent ID**: From Retell dashboard
4. Click **Create**
5. Customize colors, text, and settings
6. Click **Save**

### Get the Embed Code

1. In the widget settings, scroll down to **Embed Code**
2. Copy the code block
3. Paste it on any website to embed the widget

## You're Done! 🚀

Your Antek Retell Widget is now live and ready to use!

### What You Can Do Now

- **Invite Users**: Go to `/admin/panel` to send invitation links to team members
- **Create Widgets**: Go to `/dashboard` to create more widgets with different agents
- **Customize Branding**: Update colors, fonts, and messages for each widget
- **Embed Anywhere**: Copy embed code to add widgets to your website

### Troubleshooting

**Widget shows "Loading..." indefinitely**
- Make sure `RETELL_API_KEY` is set in Supabase Edge Functions secrets
- Verify the widget has valid voice_agent_id and chat_agent_id

**Can't log in**
- Check that you ran `create-admin.sql` with the correct user UUID
- Make sure the user is enabled in Supabase Authentication → Users

**Database errors**
- Verify `database-setup.sql` ran completely (check SQL Editor for errors)
- If rerunning, disable the trigger first: `DROP TRIGGER IF EXISTS enforce_widget_limit ON widget_configs;`

**Edge Functions not deploying**
- Go to Supabase → Edge Functions and check the deployment status
- If stuck, try disconnecting and reconnecting GitHub

### Next Steps

- Review [README.md](./README.md) for features and overview
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for advanced deployment options
- Read [CLAUDE.md](./chatmate-voice-aavac-bot/CLAUDE.md) for architecture details

### Questions?

- Supabase Docs: https://supabase.com/docs
- Retell AI Docs: https://docs.retell.ai
- Vercel Docs: https://vercel.com/docs
