# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a self-hosted, white-label Retell Voice Agent Widget application—a React-based SPA that provides voice and chat capabilities powered by the Retell AI SDK. Designed as a deployable package for third parties, the app uses an admin-controlled, invitation-only user model (no public signup). Features include authentication with email-based invitations, dashboard management, widget configuration, and embeddable voice/chat widget components. The main codebase is in `chatmate-voice-aavac-bot/`.

## Tech Stack

- **Build Tool**: Vite (dev server on port 8080)
- **Runtime**: React 18.3 with TypeScript
- **UI Components**: shadcn-ui (Radix UI primitives + Tailwind)
- **Styling**: Tailwind CSS with custom theme variables (Space Grotesk and JetBrains Mono fonts)
- **State Management**: React Context (AuthContext) + TanStack Query for async state
- **Voice/Chat SDK**: Retell Client JS SDK (2.0.7)
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Forms**: React Hook Form with Zod validation
- **Deployment**: Vercel (frontend) + Supabase Edge Functions (backend)

## Commands

Run these from `chatmate-voice-aavac-bot/` directory:

```bash
# Install dependencies
npm install

# Development server (runs on http://localhost:8080)
npm run dev

# Production build
npm run build

# Development build
npm run build:dev

# Preview production build locally
npm run preview

# Lint code (ESLint)
npm run lint

# Setup self-hosted package (initial setup only)
npm run setup
```

## Project Structure

```
chatmate-voice-aavac-bot/
├── src/
│   ├── pages/                    # Route components
│   │   ├── Auth.tsx             # Login only (no public signup)
│   │   ├── InviteAccept.tsx      # Invitation acceptance with password setup
│   │   ├── Dashboard.tsx         # Widget management
│   │   ├── WidgetSettings.tsx    # Per-widget config
│   │   ├── Settings.tsx          # User account settings
│   │   ├── Embed.tsx             # Embedding instructions
│   │   ├── Index.tsx             # Landing page with demo
│   │   ├── AdminDemo.tsx         # Global demo config (admin only)
│   │   ├── AdminPanel.tsx        # Admin controls and user invitations
│   │   └── NotFound.tsx          # 404 page
│   ├── components/
│   │   ├── ui/                  # shadcn-ui primitives (auto-generated)
│   │   ├── VoiceWidget.tsx       # Core voice/chat widget (inline)
│   │   ├── FloatingVoiceWidget.tsx # Floating toggle version
│   │   ├── InvitationManagement.tsx # Admin invitation form and pending list
│   │   ├── PasswordStrengthMeter.tsx # Password validation visual component
│   │   ├── TeamManagement.tsx    # Team settings
│   │   ├── WhitelabelSettings.tsx # Branding customization
│   │   └── NavLink.tsx           # Navigation component
│   ├── contexts/
│   │   └── AuthContext.tsx       # Supabase auth + profile state
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts         # Supabase client (auto-generated)
│   │       └── types.ts          # DB types (auto-generated)
│   ├── hooks/                    # Custom React hooks
│   ├── lib/                      # Utilities (cn for className merging)
│   └── App.tsx                   # Router setup
├── supabase/functions/           # Edge Functions (Deno)
│   ├── retell-create-call/       # Create voice call session
│   ├── retell-text-chat/         # Handle text chat requests
│   ├── widget-config/            # Fetch widget configuration
│   ├── widget-embed/             # Serve embeddable widget code
│   └── wordpress-plugin/         # WordPress integration endpoint
├── vite.config.ts                # Vite configuration
├── tailwind.config.ts            # Tailwind theme
├── eslint.config.js              # ESLint rules
└── tsconfig.app.json             # TypeScript config
```

## Architecture Patterns

### Authentication & Authorization (Invitation-Only Model)
- **No public signup**: Only super admin can create users via email invitations
- Invitation flow: Admin sends email link → user visits `/invite/:token` → sets password meeting strength requirements → account created → auto-joins main team
- `AuthContext` in `src/contexts/AuthContext.tsx` provides user, session, and profile state globally
- Uses Supabase Auth (email + password; MFA removed for simplicity)
- Invitations stored in `user_invitations` table with 7-day expiry, auto-generated tokens
- Profile data fetched from `profiles` table on auth state change
- Role-based access control: `super_admin`, `admin`, `moderator`, `user` roles in `user_roles` table
- Password strength enforced: 8+ characters, uppercase, lowercase, number, special character
- Call `useAuth()` hook to access auth methods and state in any component
- Super admin has full system access; can invite users and assign roles from `/admin/panel`

### Widget System
- **VoiceWidget**: Full-featured inline widget with voice + chat modes
- **FloatingVoiceWidget**: Expandable floating button version
- Both use `RetellWebClient` for voice calls (WebRTC microphone input)
- Modes: Voice (real-time call) or Chat (text-based)
- Per-widget configuration: Each widget has separate `voice_agent_id` and `chat_agent_id` in `widget_configs` table
- Widgets can be embedded on external sites via iframe with provided embed code

### Backend Services (Supabase Edge Functions)
Located in `supabase/functions/`:
- **retell-create-call**: Creates a new voice call session with Retell API
- **retell-text-chat**: Processes text chat messages through Retell agents
- **widget-config**: Serves widget configuration (called by embedded widgets)
- **widget-embed**: Serves the embeddable widget JavaScript/iframe
- **wordpress-plugin**: WordPress integration endpoint
- All functions use environment variable `RETELL_API_KEY` (global API key)
- Agent IDs are passed per-request from widget configuration

### Database Schema
Key tables in `supabase/migrations/`:
- `profiles`: User data (created when invited user accepts invitation)
- `widget_configs`: Widget settings, customization, Retell agent IDs, attribution text
- `demo_settings`: Global demo widget configuration
- `teams`, `team_members`, `team_invitations`: Team management (all users auto-join main team)
- `user_roles`: User role assignments (`super_admin`, `admin`, `moderator`, `user`)
- `user_invitations`: Email invitations with tokens, 7-day expiry, role assignment (NEW)
- All tables protected with RLS (Row Level Security) policies for team-based access control

### Routing (React Router v6)
- `/` - Landing page with demo widget (public, no auth required)
- `/auth` - Login-only form (no public signup)
- `/invite/:token` - Invitation acceptance page (public, user sets password)
- `/dashboard` - Main widget management interface (authenticated)
- `/widget/:id` - Individual widget settings/customization (authenticated)
- `/settings` - User account settings (authenticated)
- `/embed` - Embedding instructions and embed code (authenticated)
- `/admin/demo` - Global demo config (super admin only)
- `/admin/panel` - Admin controls and user invitations (super admin only)

## Styling & Theme

### Tailwind Configuration
- Dark mode enabled (class-based, not system preference)
- Custom CSS variables for colors: `--border`, `--primary`, `--glow-primary`, `--accent`, `--destructive`, etc.
- Custom animations: `accordion-down`, `accordion-up`, `fade-in`, `scale-in`
- Container queries for responsive design
- Check `tailwind.config.ts` for complete theme configuration

### Font Stack
- Sans: Space Grotesk (headings and body)
- Mono: JetBrains Mono (code snippets, technical text)

## Supabase Integration

### Client Setup
- Supabase client auto-generated in `src/integrations/supabase/client.ts`
- Database types auto-generated in `types.ts` (from Supabase schema)
- Auth persisted in localStorage with auto token refresh
- Public (anon) key used in frontend; service role key kept secret on backend

### Environment Variables
```
VITE_SUPABASE_URL              # Supabase project URL
VITE_SUPABASE_PUBLISHABLE_KEY  # Public anon key (safe for client)
VITE_SUPABASE_PROJECT_ID       # Project reference
VITE_RETELL_API_KEY            # Global Retell API key (used by Edge Functions)
```

Stored in `.env.local` (not committed). For Vercel deployment, set equivalent vars in project settings.

## Edge Function Deployment

### Local Development
```bash
# Link to Supabase project
supabase link --project-ref <YOUR_PROJECT_REF>

# Start local Supabase emulator
supabase start

# Deploy to production
supabase functions deploy retell-create-call
supabase functions deploy retell-text-chat
supabase functions deploy widget-config
supabase functions deploy widget-embed
supabase functions deploy wordpress-plugin

# Set global secret
supabase secrets set RETELL_API_KEY=<YOUR_KEY>

# View function logs
supabase functions get-logs <function-name>
```

### Environment
- Edge Functions run on Deno (TypeScript runtime)
- Deployed to Supabase Edge Functions (serverless)
- Auto-scale based on demand
- Regional deployment near Supabase database

## Linting & Code Style

- ESLint configured in `eslint.config.js`
- Plugins: React Hooks, React Refresh, TypeScript
- `@typescript-eslint/no-unused-vars` disabled (allows unused params)
- Prefer React Router v6 patterns (hooks, nested routes)
- Run `npm run lint` to check code quality

## Import Aliases

Use `@/` prefix for absolute imports from `src/`:
```typescript
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/ui/button";
import { cn } from "@/lib/utils";
```

Configured in `vite.config.ts` and `tsconfig.app.json`.

## Key Dependencies

- `retell-client-js-sdk` (2.0.7) - Voice/chat SDK
- `@supabase/supabase-js` - Supabase client
- `@tanstack/react-query` - Server state management
- `react-router-dom` - Client routing
- `react-hook-form` + `zod` - Form validation with schemas
- `lucide-react` - Icon library
- `next-themes` - Theme switching
- `sonner` - Toast notifications

## Development Notes

- Lovable tagger plugin active in development (marks components for design tool)
- SWC compiler for fast HMR
- Original project built via Lovable (design-to-code platform)
- Generated UI components use shadcn-ui; prefer existing primitives over new custom components
- When modifying UI, check if a shadcn component already exists before creating new ones
- TypeScript strict mode disabled in `tsconfig.app.json` (allows flexibility for rapid development)

## Setup & Initialization (Self-Hosted Package)

The setup process is automated via `scripts/setup-package.js` for end users deploying this package:

1. **Create Supabase project** at https://supabase.com
2. **Get credentials** from Supabase:
   - Project URL: `https://xxxxx.supabase.co`
   - Anon/Public Key: Starts with `eyJ...`
   - Service Role Key: Starts with `eyJ...`
3. **Get Retell API key** from https://retell.ai/dashboard
4. **Run automated setup** (from `chatmate-voice-aavac-bot/` directory):
   ```bash
   npm install
   npm run setup
   ```
   This script will:
   - Validate all credentials
   - Guide through database migrations via Supabase CLI
   - Deploy edge functions and set secrets
   - Create super admin user with strong password
   - Generate `.env.local` with all required variables
   - Output next steps with login URL

5. **Start development**: `npm run dev` and visit `http://localhost:8080/auth`
6. **Sign in** with super admin credentials created during setup
7. **Invite users** from `/admin/panel` by providing their email and role
8. **Users accept invitations** by visiting email link, setting password, and signing in

### Production Deployment to Vercel

For deploying to Vercel:
1. Push code to GitHub
2. Create Vercel project connected to repo
3. Set environment variables in Vercel project settings:
   - `VITE_SUPABASE_URL` (from setup script output)
   - `VITE_SUPABASE_PUBLISHABLE_KEY` (anon key from Supabase)
   - `VITE_SUPABASE_PROJECT_ID` (project reference from Supabase URL)
   - `VITE_RETELL_API_KEY` (from Retell dashboard)
4. Deploy to Vercel (automatic on git push)

See `DEPLOYMENT.md` for detailed deployment instructions.
