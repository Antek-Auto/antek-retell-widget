# Antek Retell Widget

A white-label, self-hosted voice and chat widget platform powered by Retell AI. Deploy as a complete package to your own infrastructure with admin-controlled user management and embeddable widgets.

## Features

- **Voice & Chat Widgets** - Real-time voice calls and text chat powered by Retell AI SDK
- **Admin-Only User Management** - No public signup; super admin invites users via email with secure password setup
- **White-Label** - Fully customizable branding, colors, fonts, and attribution
- **Team-Based Access** - All users part of shared team; manage widgets collaboratively
- **Dashboard** - Intuitive widget management, configuration, and analytics
- **Embeddable** - Serve widgets on external websites via iframe or floating button
- **Self-Hosted** - Deploy to your own Supabase + Vercel infrastructure
- **Production-Ready** - Built with Vite, React, TypeScript, Tailwind CSS, and shadcn-ui

## Quick Start

### Prerequisites

- Node.js 16+
- npm or yarn
- Supabase account (free tier available)
- Retell AI account with API key
- Vercel account (for production deployment)

### Local Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/Nipstar/antek-retell-widget.git
cd antek-retell-widget/chatmate-voice-aavac-bot

# 2. Install dependencies
npm install

# 3. Run automated setup (interactive)
npm run setup
# Follow the prompts to:
# - Enter Supabase credentials
# - Enter Retell API key
# - Create super admin account
# - Deploy database migrations
# - Deploy edge functions

# 4. Start development server
npm run dev

# 5. Open browser
# Visit http://localhost:8080/auth
# Sign in with your super admin credentials
```

The `npm run setup` script automates the entire initialization process and will guide you through each step.

## Project Structure

```
antek-retell-widget/
├── README.md                          ← This file
├── DEPLOYMENT.md                      ← Detailed deployment guide
├── CLAUDE.md                          ← Architecture documentation
│
└── chatmate-voice-aavac-bot/          ← React application
    ├── README.md                      ← App-specific documentation
    ├── .env.example                   ← Configuration template
    ├── package.json
    ├── src/
    │   ├── pages/                     ← Route components (Auth, Dashboard, Admin, etc.)
    │   ├── components/                ← Reusable UI components
    │   ├── contexts/                  ← React Context (AuthContext)
    │   ├── hooks/                     ← Custom React hooks
    │   ├── lib/                       ← Utilities and helpers
    │   └── integrations/supabase/     ← Supabase client and types
    ├── supabase/
    │   ├── migrations/                ← Database schema
    │   └── functions/                 ← Edge Functions (Deno)
    ├── scripts/
    │   └── setup-package.js           ← Automated setup script
    └── vite.config.ts                 ← Vite configuration
```

## Key Routes

| Route | Purpose | Auth Required |
|-------|---------|---------------|
| `/` | Demo page with live widget | No |
| `/auth` | Login page (no public signup) | No |
| `/invite/:token` | Accept invitation & set password | No |
| `/dashboard` | Widget management | Yes |
| `/widget/:id` | Widget settings & customization | Yes |
| `/settings` | Account settings | Yes |
| `/admin/panel` | Admin controls & user invitations | Super admin only |

## How It Works

### User Management (Invitation-Only)
- **No public signup** - Only admin-invited users can create accounts
- **Email invitations** - Admin sends link, user sets password, account automatically created
- **Main team** - All users belong to a main team owned by super admin
- **Roles** - `super_admin` (full control), `admin` (manage widgets), `moderator`, `user`

### Admin Workflow
1. Sign in as super admin
2. Navigate to `/admin/panel`
3. Enter user email and select role
4. Send invitation
5. User clicks link, sets password, creates account
6. User automatically joins main team and can see all widgets

### Widget Configuration
- Each widget has separate Retell agent IDs for voice and chat
- Customize colors, fonts, branding, attribution
- Generate embed code for external websites
- Team members can view all widgets but create/edit only their own

## Deployment

### Local Development
See Quick Start section above.

### Production Deployment
See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions on deploying to Vercel.

**Summary:**
1. Create Supabase project
2. Get Retell API key
3. Push code to GitHub
4. Create Vercel project connected to repo
5. Set environment variables in Vercel
6. Deploy (automatic on git push)

## Technology Stack

- **Frontend**: React 18.3 + TypeScript + Vite
- **UI Framework**: shadcn-ui (Radix UI + Tailwind CSS)
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Voice/Chat SDK**: Retell Client JS SDK
- **Hosting**: Vercel (frontend) + Supabase (backend)
- **Forms**: React Hook Form + Zod validation

## Configuration

### Environment Variables
Create a `.env.local` file (template in `.env.example`):

```env
# Supabase (from Project Settings → API)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id

# Retell AI (from Retell Dashboard)
VITE_RETELL_API_KEY=your_retell_api_key
```

**Note:** Never commit `.env.local` to git. Use `.env.example` for defaults.

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&*, etc.)

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

## Documentation

- **[README.md](./chatmate-voice-aavac-bot/README.md)** - App-specific documentation with production checklist
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Comprehensive deployment guide (300+ lines)
- **[CLAUDE.md](./CLAUDE.md)** - Architecture and development guide

## Production Deployment Checklist

Before deploying, verify the items in the [Production Deployment Checklist](./chatmate-voice-aavac-bot/README.md#production-deployment-checklist) in the app README.

## Support & Troubleshooting

### Common Issues

**Setup script fails:**
- Ensure Node.js 16+ is installed
- Verify Supabase credentials are correct
- Check that Supabase CLI is installed: `npm install -g supabase`

**Widget not loading:**
- Verify widget config has valid Retell agent IDs
- Check that API key is set in Supabase secrets
- View browser console for JavaScript errors

**Users can't accept invitations:**
- Verify invitation link hasn't expired (7-day limit)
- Check user email is correct
- Ensure user can receive emails (check spam folder)

**For more help:**
- Check [DEPLOYMENT.md Troubleshooting](./DEPLOYMENT.md#troubleshooting)
- Review component documentation in source files
- Check browser console for error messages
- Visit service documentation:
  - Supabase: https://supabase.com/docs
  - Retell AI: https://docs.retell.ai
  - Vercel: https://vercel.com/docs
  - React: https://react.dev/docs

## Security

### Best Practices
- Use strong passwords (enforced by app)
- Rotate API keys regularly
- Enable 2FA on Supabase and Vercel accounts
- Keep `.env.local` secret (add to `.gitignore`)
- Monitor Supabase logs for suspicious activity
- Enable backups in Supabase dashboard

### Data Protection
- All database tables protected with RLS (Row Level Security)
- Team-based access control
- API keys stored securely in Supabase Edge Functions
- Passwords hashed via Supabase Auth
- No public signup means no exposed endpoints

## Customization

### Branding
- Update logo and colors in widget settings
- Customize widget attribution text
- Modify theme colors in `tailwind.config.ts`
- Change fonts in CSS variables

### Retell AI Configuration
- Configure agents in Retell dashboard
- Set unique agent IDs per widget
- Configure in widget settings UI

### Theme
- Built-in light/dark mode toggle
- Custom theme variables in Tailwind config
- Font stack: Space Grotesk (sans), JetBrains Mono (mono)

## Development

### Code Quality
- TypeScript with strict type checking
- ESLint for code linting
- React best practices enforced
- Prettier for code formatting (via Vite)

### Build & Deploy
- Vite for fast builds
- Supabase migrations for database
- Edge Functions for serverless backend
- Vercel for automatic deployments

## License

See LICENSE file for details.

## Contributing

This is a production-ready package for self-hosted deployment. For modifications:

1. Create a new branch
2. Make changes
3. Test thoroughly
4. Create a pull request

## Credits

Built with:
- [Retell AI](https://retell.ai) - Voice and chat SDK
- [Supabase](https://supabase.com) - Backend infrastructure
- [Vercel](https://vercel.com) - Frontend hosting
- [React](https://react.dev) - UI framework
- [shadcn-ui](https://shadcn.com) - Component library
- [Tailwind CSS](https://tailwindcss.com) - Styling

---

## Getting Started

Ready to deploy? Follow these steps:

1. **Clone the repository** (you already did this!)
2. **Review [DEPLOYMENT.md](./DEPLOYMENT.md)** for detailed setup
3. **Run `npm run setup`** in the chatmate-voice-aavac-bot directory
4. **Deploy to Vercel** for production

For questions or issues, check the documentation files or review the troubleshooting guides.

**Happy deploying! 🚀**
