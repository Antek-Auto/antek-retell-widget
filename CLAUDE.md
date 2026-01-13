# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a self-hosted, white-label Retell Voice Agent Widget application—a React-based SPA that provides voice and chat capabilities powered by the Retell AI SDK. Designed as a deployable package for third parties, the app uses an admin-controlled, invitation-only user model (no public signup). Features include authentication with email-based invitations, dashboard management, widget configuration, and embeddable voice/chat widget components.

**Directory structure**: The main codebase is in `chatmate-voice-aavac-bot/`. The root directory contains deployment configs, documentation, and setup scripts. All commands and paths in this guide refer to the `chatmate-voice-aavac-bot/` directory unless otherwise noted.

## Tech Stack

- **Build Tool**: Vite (dev server on port 8080, HMR with SWC compiler)
- **Runtime**: React 18.3 with TypeScript (strict mode disabled for flexibility)
- **UI Components**: shadcn-ui (Radix UI primitives + Tailwind)
- **Styling**: Tailwind CSS with custom theme variables (Space Grotesk and JetBrains Mono fonts)
- **State Management**: React Context (AuthContext) + TanStack Query for async state
- **Voice/Chat SDK**: Retell Client JS SDK (2.0.7, uses WebRTC for voice)
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Forms**: React Hook Form with Zod validation
- **Deployment**: Vercel (frontend) + Supabase Edge Functions (backend)
- **Additional**: Lovable tagger plugin in dev (marks components for design system)

## Commands

Run these from `chatmate-voice-aavac-bot/` directory:

```bash
# Development (optional - for customizing code locally)
npm install           # Install dependencies
npm run dev          # Dev server (http://localhost:8080 with HMR)
npm run build        # Production build (minified, optimized)
npm run build:dev    # Dev build (unminified, source maps)
npm run preview      # Preview production build locally
npm run lint         # Check code quality with ESLint

# DEPRECATED - Use ONLINE_SETUP.md instead:
# npm run setup          # Setup script (no longer recommended)
# npm run setup:supabase # Supabase setup script (no longer recommended)
```

**For Production Deployment**: Skip the npm commands and follow [ONLINE_SETUP.md](../ONLINE_SETUP.md) instead.

**Testing**: Currently no test runner is configured. Use `npm run lint` for code quality checks.

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
- Dark mode enabled (class-based, not system preference; theme toggle in UI)
- Custom CSS variables for colors: `--border`, `--primary`, `--glow-primary`, `--accent`, `--destructive`, etc.
- Custom animations: `accordion-down`, `accordion-up`, `fade-in`, `scale-in`
- Container queries for responsive design
- Check `tailwind.config.ts` for complete theme configuration

### Font Stack
- Sans: Space Grotesk (headings and body)
- Mono: JetBrains Mono (code snippets, technical text)

### Theme System
- Uses `next-themes` for persistent theme switching (stored in localStorage)
- Theme toggle accessible from `/settings` page
- Themes are class-based (affects root element's `class` attribute)
- Customize theme colors via Tailwind variables in `tailwind.config.ts`

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

## Development Patterns & Best Practices

### Component Architecture
- **Page Components** (`src/pages/`): Route-level components that handle auth checks and page layout
- **UI Components** (`src/components/ui/`): Generated shadcn-ui primitives (auto-generated from CLI)
- **Feature Components** (`src/components/`): Domain-specific components (e.g., VoiceWidget, FloatingVoiceWidget)
- **Prefer existing components**: Check if a shadcn component exists before creating new ones
- **Use slots pattern** from Radix UI for flexible composition (Button, Dialog, etc. support `asChild` prop)

### State Management Patterns
- **Auth State**: Use `useAuth()` hook from AuthContext in any component
- **Server State**: Use TanStack Query for API calls and caching (with `@tanstack/react-query`)
- **Local State**: React `useState` for UI-only state
- **Don't mix patterns**: Avoid directly calling Supabase client in components; use hooks or queries

### Form Handling
- **Forms use React Hook Form + Zod**: Define schema in Zod, use `useForm` hook with resolver
- **Validation**: Both client-side (Zod schema) and server-side (Supabase RLS policies)
- **Example**: See `InviteAccept.tsx` for password strength validation with custom component

### Development Notes
- Lovable tagger plugin active in development (marks components for design tool; remove in production if needed)
- SWC compiler for fast HMR (enabled in `vite.config.ts`)
- Original project built via Lovable (design-to-code platform)
- TypeScript strict mode disabled in `tsconfig.app.json` (allows flexibility; enable if upgrading)
- No test framework configured; use `npm run lint` for code quality

### Common Pitfalls
- **Don't add state to Auth context**: It's for auth + profile only; use React Query for other server state
- **Don't call Supabase directly in render**: Wrap in useEffect or custom hook to avoid race conditions
- **Don't commit `.env.local`**: It's in `.gitignore` and contains secrets
- **Role-based access**: Check roles in component conditionally or use RLS policies for data access
- **Widget embedding**: Widgets are served via iframe at `/embed` route; ensure CORS is configured

## Setup & Initialization

### ⭐ Production Deployment (Recommended)

**[→ Follow ONLINE_SETUP.md in the root directory](../ONLINE_SETUP.md)**

This covers everything needed for production deployment without local setup:
- Creating Supabase project online
- Running database migrations via SQL Editor (copy-paste)
- Creating admin users via Supabase Auth
- Deploying Edge Functions via GitHub integration
- Deploying to Vercel with environment variables

Takes ~10 minutes, no CLI tools required.

### Local Development (Optional)

If you want to develop locally:

1. **Clone and install**:
   ```bash
   git clone <your-repo> && cd chatmate-voice-aavac-bot
   npm install
   ```

2. **Create Supabase project** at https://supabase.com

3. **Get credentials**:
   - Project URL: `https://xxxxx.supabase.co`
   - Anon Key: Starts with `eyJ...`
   - Service Role Key: Starts with `eyJ...`

4. **Run setup script** (creates `.env.local`):
   ```bash
   npm run setup
   ```
   Follow prompts and you'll have a local database configured

5. **Start dev server**:
   ```bash
   npm run dev
   ```

6. **Access at** `http://localhost:8080/auth`

See [README.md Development Setup](../README.md#development-setup) for more details on local development.

## Development Workflow & Debugging

### Setting Up Local Development

1. **Get credentials**: Prepare Supabase URL, anon key, and Retell API key
2. **Run setup**: `npm run setup` (interactive, creates `.env.local`)
3. **Start dev server**: `npm run dev` (runs on `http://localhost:8080`)
4. **Login**: Visit `/auth` and use super admin credentials created during setup

### Common Issues & Solutions

**Build fails with TypeScript errors:**
- TypeScript strict mode is disabled, but ESLint may still flag issues
- Run `npm run lint` to see all issues
- Most errors are in unused variables; they're allowed by config

**Supabase Edge Functions not deploying:**
- Ensure `supabase` CLI is installed globally: `npm install -g supabase`
- Check that you're linked to correct project: `supabase projects list`
- Verify `RETELL_API_KEY` secret is set: `supabase secrets list`

**Widget not loading on embedded page:**
- Verify the embed code uses correct widget ID (check widget URL in dashboard)
- Check browser console for CORS errors
- Ensure Supabase project allows the embedding domain in RLS policies
- Widget loads via iframe from `/widget-embed` endpoint

**Auth token expired or user logged out unexpectedly:**
- Check `.env.local` has correct `VITE_SUPABASE_PUBLISHABLE_KEY`
- Supabase tokens refresh automatically via localStorage
- Clear browser storage if stuck: `localStorage.clear()`; re-login

**Voice calls not working:**
- Verify widget has valid `voice_agent_id` in Retell dashboard
- Check browser microphone permissions (granted for localhost by default)
- Ensure `RETELL_API_KEY` is set in Supabase secrets (not in `.env.local`)
- View Retell logs in Retell dashboard for detailed call errors

### Database Migrations & Schema Changes

- Migrations are in `supabase/migrations/` (auto-timestamped SQL files)
- New migrations are applied during `npm run setup:supabase`
- To create a new migration locally: `supabase migration new <name>`
- Always test migrations locally before deploying to production
- RLS policies protect all tables; verify policies when adding new tables

### Environment Variables

**Frontend variables** (Vite, prefixed with `VITE_`):
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Public anon key (safe to expose)
- `VITE_SUPABASE_PROJECT_ID`: Project reference (used for client init)
- `VITE_RETELL_API_KEY`: Not used in frontend (for build-time reference only)

**Backend secrets** (Edge Functions, NOT in `.env.local`):
- `RETELL_API_KEY`: Set via `supabase secrets set RETELL_API_KEY=<key>`
- Accessible in Edge Functions as `Deno.env.get("RETELL_API_KEY")`

### Hot Module Replacement (HMR)

- Vite HMR is enabled by default during dev
- Supported: Component hot reload, style updates, state preservation in some cases
- If HMR breaks: Full page refresh via `npm run dev` console or browser F5
- For Edge Functions: Changes require manual redeploy (`supabase functions deploy <name>`)

### Production Build Considerations

- `npm run build` creates `dist/` folder with optimized output
- Environment variables from `.env.local` are embedded at build time
- Preview build before deploying: `npm run preview`
- For Vercel: Set `VITE_*` variables in project settings (they're public)
- Keep `.env.local` only for local development; never commit to git
