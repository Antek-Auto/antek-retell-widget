# Retell Voice Agent Widget - Self-Hosted Package

A white-label, self-hosted voice and chat widget platform powered by Retell AI. Deploy as a complete package to your own infrastructure with admin-controlled user management and embeddable widgets.

## Features

- **Voice & Chat Widgets**: Real-time voice calls and text chat powered by Retell AI SDK
- **Admin-Only User Management**: No public signup—super admin invites users via email with secure password setup
- **White-Label**: Fully customizable branding, colors, fonts, and attribution
- **Team-Based Access**: All users part of shared team; manage widgets collaboratively
- **Dashboard**: Intuitive widget management, configuration, and analytics
- **Embeddable**: Serve widgets on external websites via iframe or floating button
- **Self-Hosted**: Deploy to your own Supabase + Vercel infrastructure
- **Production-Ready**: Built with Vite, React, TypeScript, Tailwind CSS, and shadcn-ui

## Quick Start

### Prerequisites

- Node.js 16+
- Supabase account (free tier available)
- Retell AI account with API key
- Vercel account (for production deployment)

### Local Development

```bash
# 1. Clone repository
git clone <your-repo-url>
cd retell-widget/chatmate-voice-aavac-bot

# 2. Install dependencies
npm install

# 3. Run automated setup (interactive)
npm run setup

# 4. Start development server
npm run dev

# 5. Open http://localhost:8080/auth
# Sign in with super admin credentials created during setup
```

The setup script will guide you through:
- Creating Supabase credentials
- Setting up database migrations
- Deploying edge functions
- Creating super admin account
- Configuring Retell AI integration

See [DEPLOYMENT.md](../DEPLOYMENT.md) for detailed setup instructions.

## Architecture

### User Management
- **No public signup**: Only admin-invited users can create accounts
- **Email invitations**: Admin sends link, user sets password, account automatically created
- **Main team**: All users belong to a main team owned by super admin
- **Roles**: `super_admin` (full control), `admin` (manage widgets), `moderator`, `user`

### Widget System
- **Per-widget configuration**: Each widget has separate Retell agent IDs for voice and chat
- **White-label options**: Customize colors, fonts, branding, attribution
- **Embed code**: Auto-generate embed code for external websites
- **Widget sharing**: Team members can view all widgets but create/edit only their own

### Technology Stack
- **Frontend**: React 18.3 + TypeScript + Vite
- **UI**: shadcn-ui (Radix UI + Tailwind CSS)
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Voice/Chat**: Retell Client JS SDK
- **Hosting**: Vercel (frontend) + Supabase (backend)

## Project Structure

```
chatmate-voice-aavac-bot/
├── src/
│   ├── pages/              # Route components (Auth, Dashboard, AdminPanel, etc.)
│   ├── components/         # Reusable UI components
│   ├── contexts/           # React Context (AuthContext for global state)
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities and helpers
│   ├── integrations/       # Supabase client and types
│   └── App.tsx             # Main router
├── supabase/
│   ├── migrations/         # Database schema
│   └── functions/          # Edge Functions (Deno)
├── scripts/
│   └── setup-package.js    # Automated setup script
└── vite.config.ts          # Vite configuration
```

## Key Pages & Routes

| Route | Purpose | Auth Required |
|-------|---------|---------------|
| `/` | Demo page with live widget | No |
| `/auth` | Login page (no public signup) | No |
| `/invite/:token` | Accept invitation & set password | No |
| `/dashboard` | Widget management | Yes |
| `/widget/:id` | Widget settings & customization | Yes |
| `/settings` | Account settings | Yes |
| `/admin/panel` | Admin controls & user invitations | Super admin only |

## Setup Process

### 1. Create Supabase Project
- Go to https://supabase.com
- Create new project (free tier is fine)
- Get your credentials from Project Settings → API

### 2. Get Retell API Key
- Visit https://retell.ai/dashboard
- Copy your API key

### 3. Run Setup Script
```bash
npm run setup
```
- Provide Supabase credentials
- Provide Retell API key
- Create super admin account (email + strong password)
- Script auto-deploys database and edge functions

### 4. Deploy to Vercel
```bash
git push origin main  # Deploy automatically, or use Vercel dashboard
```
- Set environment variables in Vercel dashboard (from setup script)
- Vercel auto-deploys on git push

## Commands

```bash
# Development
npm run dev          # Start dev server (http://localhost:8080)
npm run build        # Production build
npm run preview      # Preview production build locally

# Setup & Maintenance
npm run setup        # Run initial setup (one time)
npm run lint         # Check code quality
```

## Password Requirements

- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&*, etc.)

## Admin User Management

After setup, super admin can:

1. **Sign in**: Visit `/auth` with credentials from setup
2. **Go to Admin Panel**: Click admin panel or visit `/admin/panel`
3. **Invite users**: Enter email, select role, send invitation
4. **Share invitation link**: Copy auto-generated link and share with user
5. **User accepts**: User clicks link, sets password, account created

Invited users automatically:
- Join the main team
- Can see all team widgets in dashboard
- Can create and edit their own widgets
- Receive role-specific permissions

## Security

### Best Practices for Production
- Use strong passwords (enforced by app)
- Rotate API keys regularly
- Enable 2FA on Supabase and Vercel accounts
- Keep `.env.local` secret (add to .gitignore)
- Monitor Supabase logs for suspicious activity
- Regular backups via Supabase dashboard

### Data Protection
- All database tables protected with RLS (Row Level Security)
- Team-based access control
- API keys stored securely in Supabase Edge Functions
- Passwords hashed via Supabase Auth

## Customization

### Branding
- Update logo and colors in widget settings
- Customize widget attribution text
- Modify theme colors in `tailwind.config.ts`
- Change fonts in CSS variables

### Retell AI Configuration
- Each widget has separate `voice_agent_id` and `chat_agent_id`
- Configure agents in Retell dashboard
- Set in widget settings UI

### Theme
- Light/dark mode toggle built-in
- Custom theme variables in Tailwind config
- Font stack: Space Grotesk (sans), JetBrains Mono (mono)

## Troubleshooting

### Setup Issues
- See [DEPLOYMENT.md troubleshooting section](../DEPLOYMENT.md#troubleshooting)

### Widget Not Loading
- Verify widget config has valid agent IDs
- Check Retell API key is set in Supabase secrets
- View browser console for JavaScript errors
- Check edge function logs: `supabase functions get-logs widget-embed`

### Users Can't Accept Invitations
- Verify email in invitation is correct
- Check invitation hasn't expired (7-day limit)
- Ensure user can receive emails (check spam)
- Try sending a new invitation

## Documentation

- **[DEPLOYMENT.md](../DEPLOYMENT.md)** - Detailed setup and deployment guide
- **[CLAUDE.md](../CLAUDE.md)** - Architecture, patterns, and development guide

## Production Deployment Checklist

Before deploying to production, verify:

### Security
- [ ] All API keys rotated and secured
- [ ] `.env.local` created locally (not committed to git)
- [ ] `.env.example` copied and filled with real values
- [ ] `.gitignore` includes all `.*` environment files
- [ ] No hardcoded credentials in source code
- [ ] Supabase RLS policies enabled on all tables
- [ ] Edge function secrets set: `supabase secrets set RETELL_API_KEY=<key>`

### Code Quality
- [ ] `npm run lint` passes without errors
- [ ] `npm run build` completes successfully
- [ ] Browser console shows no errors on all pages
- [ ] No `console.log()` statements (only `console.error()` for errors)
- [ ] TypeScript compilation clean

### Configuration
- [ ] Vercel environment variables set (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, etc.)
- [ ] Supabase project configured with correct email settings
- [ ] Retell AI agents configured with correct IDs
- [ ] Database backups enabled in Supabase
- [ ] Custom domain configured (if applicable)

### Testing
- [ ] Super admin can sign in
- [ ] Admin can send invitations from Admin Panel
- [ ] Invitation link works and token is validated
- [ ] User can set password and create account
- [ ] New user auto-joins main team
- [ ] Dashboard shows all widgets correctly
- [ ] Widget voice/chat functionality works
- [ ] Widget embedding works on external pages
- [ ] Light/dark theme toggle works
- [ ] Mobile responsive layout works

### Deployment
- [ ] Code pushed to main branch
- [ ] Vercel deployment successful
- [ ] Edge functions deployed: `supabase functions deploy <function-name>`
- [ ] Production URL accessible and loads without errors
- [ ] Admin panel accessible at `/admin/panel`
- [ ] Demo page loads at `/`

## Support

For issues or questions:
1. Check [DEPLOYMENT.md troubleshooting](../DEPLOYMENT.md#troubleshooting)
2. Review documentation in component files
3. Check browser console for error messages
4. Visit service documentation:
   - Supabase: https://supabase.com/docs
   - Retell AI: https://docs.retell.ai
   - Vercel: https://vercel.com/docs

## License

See LICENSE file for details.

---

**Ready to deploy?** Follow the [DEPLOYMENT.md](../DEPLOYMENT.md) guide and complete the [Production Deployment Checklist](#production-deployment-checklist) to get your instance up and running!
