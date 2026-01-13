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

## Deploy in 10 Minutes (No Local Setup Required)

**Start your widget platform instantly using only web browsers. No CLI, no npm, no local development needed.**

### Prerequisites
- GitHub account (for forking)
- Supabase account (free tier available)
- Retell AI account with API key
- Vercel account

### Setup Steps
1. Fork the GitHub repository
2. Create a Supabase project
3. Run SQL setup script (copy-paste)
4. Create admin user in Supabase Auth
5. Connect GitHub to Supabase for Edge Functions
6. Deploy to Vercel with environment variables
7. Access your live app and start creating widgets!

**[→ Start with ONLINE_SETUP.md for detailed step-by-step instructions](./ONLINE_SETUP.md)**

---

### Want to Develop Locally?

Local development is optional. If you want to customize code or test locally:
- See [Development Setup](#development-setup) section below
- Requires Node.js 16+, npm/yarn, and Supabase CLI
- Use `npm run dev` for dev server and `npm run build` for production builds

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

**[→ Follow ONLINE_SETUP.md for complete online deployment instructions](./ONLINE_SETUP.md)**

This covers:
- Creating a Supabase project
- Setting up the database with copy-paste SQL
- Creating admin users
- Deploying Edge Functions via GitHub integration
- Deploying to Vercel with environment variables

See [DEPLOYMENT.md](./DEPLOYMENT.md) for advanced deployment options and troubleshooting.

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

## Commands (For Local Development)

These commands are only needed if you want to develop locally. They are **not required** for production deployment.

```bash
# Development
npm run dev          # Start dev server (http://localhost:8080)
npm run build        # Production build
npm run preview      # Preview production build locally
npm run lint         # Check code quality

# Note: npm run setup is deprecated. Use ONLINE_SETUP.md instead.
```

## Documentation

- **[ONLINE_SETUP.md](./ONLINE_SETUP.md)** - Complete online deployment guide (START HERE)
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Advanced deployment options and troubleshooting
- **[CLAUDE.md](./CLAUDE.md)** - Architecture and development guide
- **[chatmate-voice-aavac-bot/README.md](./chatmate-voice-aavac-bot/README.md)** - App-specific documentation

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

### 🚀 Deploy Now (Online-Only)

1. **[Follow ONLINE_SETUP.md](./ONLINE_SETUP.md)** - Takes ~10 minutes, no local tools required
2. Fork the repository on GitHub
3. Create a Supabase project
4. Run the SQL setup script (copy-paste)
5. Deploy to Vercel
6. Start creating widgets!

### 🛠️ Develop Locally (Optional)

If you want to modify the code or test locally, see [Development Setup](#development-setup) section below.

### 📚 Documentation

- **Setup**: [ONLINE_SETUP.md](./ONLINE_SETUP.md)
- **Troubleshooting**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Architecture**: [CLAUDE.md](./CLAUDE.md)

---

## Development Setup

This section is for developers who want to customize the code or test locally.

### Prerequisites
- Node.js 16+
- npm or yarn
- Supabase CLI: `npm install -g supabase`
- Git

### Local Development Workflow

```bash
# 1. Clone the repository
git clone https://github.com/your-username/antek-retell-widget.git
cd antek-retell-widget/chatmate-voice-aavac-bot

# 2. Install dependencies
npm install

# 3. Run setup (creates .env.local with your Supabase credentials)
npm run setup
# Follow the prompts

# 4. Start dev server
npm run dev
# Open http://localhost:8080/auth

# 5. Make changes and test
# HMR (Hot Module Reload) will refresh automatically

# 6. Build for production
npm run build

# 7. Preview production build
npm run preview
```

### Available npm Scripts

- `npm run dev` - Start development server
- `npm run build` - Create production build
- `npm run build:dev` - Create unminified development build
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint checks

### Database Migrations

When developing locally, migrations are applied via `npm run setup`. For subsequent changes:

```bash
# Create a new migration
supabase migration new {migration_name}

# Apply migrations
supabase db push
```

### Customizing the App

The main application code is in `src/`:
- `pages/` - Page components (routes)
- `components/` - Reusable UI components
- `contexts/` - React Context (AuthContext)
- `lib/` - Utilities and helpers
- `integrations/supabase/` - Supabase client setup

For detailed architecture, see [CLAUDE.md](./CLAUDE.md).

---

**Ready to deploy? [→ Start with ONLINE_SETUP.md](./ONLINE_SETUP.md)**
