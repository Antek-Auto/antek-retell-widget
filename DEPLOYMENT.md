# Deployment Guide - Retell Voice Agent Widget (Self-Hosted Package)

This guide provides step-by-step instructions for deploying the Retell Voice Agent Widget as a self-hosted, white-label application.

## Prerequisites

Before starting, ensure you have:
- **Node.js** 16+ and npm installed
- **Supabase CLI** installed: `npm install -g supabase`
- **GitHub account** (for Vercel deployment)
- **Vercel account** (for production hosting)
- **Retell AI account** with API key (https://retell.ai/dashboard)
- A **Supabase project** (free tier is fine to start)

## Quick Start (Local Development)

### Step 1: Clone and Install

```bash
git clone <your-repo-url> retell-widget
cd retell-widget/chatmate-voice-aavac-bot
npm install
```

### Step 2: Run Automated Setup

From the `chatmate-voice-aavac-bot/` directory:

```bash
npm run setup
```

Follow the interactive prompts to provide:
1. **Supabase credentials** (Project URL, Anon Key, Service Role Key)
2. **Retell API Key** (from https://retell.ai/dashboard)
3. **Super admin credentials** (email and strong password)
4. **Database migrations** (guided steps via Supabase CLI)
5. **Edge function deployment** (guided steps)

### Step 3: Start Development Server

```bash
npm run dev
```

Visit: `http://localhost:8080/auth`

Sign in with your super admin credentials created during setup.

### Step 4: Invite Team Members

1. Navigate to `/admin/panel`
2. Scroll to "User Management" section
3. Enter team member's email and select their role
4. Click "Send Invitation"
5. Share the generated invitation link with the team member
6. They can accept by visiting the link, setting their password, and signing in

## Production Deployment to Vercel

### Prerequisites
- Code pushed to GitHub
- All local setup completed and tested
- `.env.local` generated (from setup script)

### Step 1: Create Vercel Project

1. Go to https://vercel.com
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Select `chatmate-voice-aavac-bot/` as the root directory
5. Click "Continue"

### Step 2: Configure Environment Variables

In the Vercel dashboard, set these environment variables:

| Variable | Value | Source |
|----------|-------|--------|
| `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` | Supabase Project Settings → API |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Anon/Public Key (starts with `eyJ...`) | Supabase Project Settings → API |
| `VITE_SUPABASE_PROJECT_ID` | Project reference (e.g., `xxxxx`) | From project URL |
| `VITE_RETELL_API_KEY` | Your Retell AI API key | Retell Dashboard |

**How to find these values:**

**Supabase credentials:**
1. Go to your Supabase project dashboard
2. Click "Settings" in the bottom left
3. Click "API"
4. Copy the URL, Anon Key, and extract Project ID from URL (the part before `.supabase.co`)

**Retell API Key:**
1. Go to https://retell.ai/dashboard
2. Navigate to API Keys or Settings
3. Copy your API key

### Step 3: Deploy

Option A: **Automatic deployment on git push**
- Once environment variables are set, push code to GitHub
- Vercel automatically detects changes and deploys

Option B: **Manual deployment**
- Click "Deploy" button in Vercel dashboard
- Deployment starts immediately

### Step 4: Verify Production Deployment

1. Visit your Vercel deployment URL (shown in dashboard)
2. You should see the public demo page at `/`
3. Sign in at `/auth` with your super admin credentials
4. Verify dashboard and widget management work
5. Test inviting a user and accepting the invitation

## Database Setup (Manual Reference)

If you prefer manual setup instead of the automated script:

### Using Supabase CLI

```bash
# 1. Link to your Supabase project
supabase link --project-ref <YOUR_PROJECT_ID>

# 2. Push migrations to your project
supabase db push

# 3. Deploy Edge Functions
supabase functions deploy retell-create-call
supabase functions deploy retell-text-chat
supabase functions deploy widget-config
supabase functions deploy widget-embed
supabase functions deploy wordpress-plugin

# 4. Set environment secret
supabase secrets set RETELL_API_KEY=<YOUR_KEY>
```

### Create Super Admin User Manually

If you prefer to create the super admin manually using Supabase dashboard:

1. Go to your Supabase project → Auth → Users
2. Click "Add user"
3. Enter email and password (8+ chars, uppercase, lowercase, number, special char)
4. Check "Auto confirm user"
5. Create user

Then in the SQL Editor, run:
```sql
INSERT INTO user_roles (user_id, role)
VALUES ('<USER_ID>', 'super_admin');

INSERT INTO teams (owner_id, name)
VALUES ('<USER_ID>', 'Main Team');

INSERT INTO team_members (team_id, user_id, role)
VALUES ('<TEAM_ID>', '<USER_ID>', 'admin');
```

## Troubleshooting

### "Invalid Supabase credentials"
- Verify Project URL starts with `https://`
- Confirm Anon and Service Role keys start with `eyJ`
- Check that credentials are from the correct Supabase project
- Re-run `npm run setup` to try again

### "Failed to connect to Supabase"
- Ensure your Supabase project is active
- Check project status in Supabase dashboard
- Verify your internet connection

### "Database migrations failed"
- Run: `supabase status` to check local state
- Delete local `.supabase/` folder and try again
- Check Supabase dashboard → Migrations tab for errors
- Refer to official Supabase docs: https://supabase.com/docs/guides/cli

### "Edge functions not deploying"
- Ensure Supabase CLI is linked: `supabase projects list`
- Check for TypeScript errors: `npm run lint`
- Deploy individually to see specific errors
- View logs: `supabase functions get-logs <function-name>`

### "Users can't accept invitations"
- Verify email is correct in invitation
- Check invitation hasn't expired (7-day limit)
- Ensure user can receive emails (check spam folder)
- Try deleting the invitation and sending a new one from Admin Panel

### "Widget not loading on embedded page"
- Verify widget config has valid agent IDs
- Check that Retell API key is set in Supabase secrets
- Ensure CORS is configured if hosting widget on different domain
- Check browser console for JavaScript errors

## Security Considerations

### For Production:
1. **Use strong passwords** for super admin account (8+ chars, mixed case, numbers, special chars)
2. **Rotate API keys** regularly in Supabase and Retell dashboards
3. **Enable 2FA** on your Supabase and Vercel accounts
4. **Set CORS policies** appropriately for your widget domains
5. **Review RLS policies** regularly in Supabase dashboard
6. **Monitor edge function logs** for suspicious activity
7. **Use environment variables** - never commit secrets to git
8. **Enable backup** in Supabase project settings
9. **Restrict public access** to admin endpoints

### API Keys:
- Service Role Key: Keep secret, only use in server-side code
- Anon Key: Safe to expose in frontend environment variables
- Retell API Key: Keep secret, stored securely in Supabase secrets
- Never commit `.env.local` to git - add to `.gitignore`

## Scaling Considerations

### For High-Traffic Deployments:
1. **Database**: Supabase handles auto-scaling (upgrade to Pro if needed)
2. **Edge Functions**: Scale automatically with demand
3. **Vercel**: Scales automatically for frontend traffic
4. **Retell API**: Check rate limits on your plan

### Performance Optimization:
- Enable caching in Supabase for frequently accessed widgets
- Use Vercel's built-in CDN and Image Optimization
- Monitor edge function execution time
- Profile widget JavaScript bundle size

## Backing Up Your Data

### Supabase Backup:
1. Go to your Supabase project → Settings → Backups
2. Enable daily backups (Pro plan required)
3. Or export manually via the SQL Editor

### Manual Backup:
```bash
# Export database
supabase db pull

# This creates local migrations in supabase/migrations/
```

## Updating to Latest Version

When updates are pushed to your repository:

```bash
# Pull latest code
git pull origin main

# Reinstall dependencies if package.json changed
npm install

# Deploy to Vercel (automatic if using git push)
# OR manually click Deploy in Vercel dashboard
```

If database schema updates exist:
```bash
# Update local migrations
supabase db pull

# Push to production
supabase db push --linked

# Redeploy edge functions if they changed
supabase functions deploy <function-name>
```

## Support & Documentation

- **Supabase**: https://supabase.com/docs
- **Retell AI**: https://docs.retell.ai
- **Vercel**: https://vercel.com/docs
- **React Router**: https://reactrouter.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs

## Additional Resources

- **CLAUDE.md** - Architecture and code structure guide
- **README.md** - Project overview and quick start
- **Project files** - See inline comments in components for implementation details

---

For any issues or questions, refer to the troubleshooting section above or check the official documentation for each service.
