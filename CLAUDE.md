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

## Edge Functions Details

### Function Reference

**Location**: `supabase/functions/`

| Function | Purpose | Input | Output |
|----------|---------|-------|--------|
| `retell-create-call` | Create voice call session with Retell | `{ voice_agent_id, user_id? }` | `{ call_id, access_token, ws_url, ...}` |
| `retell-text-chat` | Process text chat messages | `{ chat_agent_id, message, chat_id? }` | `{ response, chat_id }` |
| `widget-config` | Fetch widget configuration | `{ widget_id }` | Widget config object (agent IDs, branding) |
| `widget-embed` | Serve embeddable widget code | `{ id, mode? }` | HTML/JS bundle for embedding |
| `wordpress-plugin` | WordPress integration endpoint | Request from WP plugin | Widget initialization response |

### Function Details

**retell-create-call**:
- Creates a new call session with Retell AI API
- Receives `voice_agent_id` from widget configuration
- Returns connection details including WebSocket URL
- VoiceWidget uses returned URL to establish WebRTC connection
- Handles authentication with RETELL_API_KEY

**retell-text-chat**:
- Accepts user message and chat_agent_id
- Streams response back to frontend
- Maintains chat_id for conversation continuity
- Returns agent's text response for display

**widget-config**:
- Called by embedded widgets on external sites
- Returns configuration for specific widget_id
- Includes: agent IDs, branding colors, attribution text
- Cached by widget to reduce API calls

**widget-embed**:
- Serves the JavaScript bundle for embedded widgets
- Returns self-contained HTML/JS code
- Includes both VoiceWidget and FloatingVoiceWidget variants
- Automatically fetches widget-config on load

**wordpress-plugin**:
- Integration endpoint for WordPress plugins
- Accepts WP-specific parameters
- Returns widget initialization code

### Environment & Deployment

**Local Development**:
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

**Runtime & Deployment**:
- Edge Functions run on Deno (TypeScript runtime)
- Deployed to Supabase Edge Functions (serverless)
- Auto-scale based on demand
- Regional deployment near Supabase database
- Access RETELL_API_KEY via `Deno.env.get("RETELL_API_KEY")`

## Key Files Reference

### Quick Lookup

| File | Purpose | Modify When |
|------|---------|-------------|
| `src/App.tsx` | Router and global providers | Adding routes, changing auth logic |
| `src/contexts/AuthContext.tsx` | Global auth state | Changing auth flow, adding profile data |
| `src/lib/auth.ts` | Role/permission utilities | Adding roles, changing permission rules |
| `src/components/VoiceWidget.tsx` | Core voice/chat widget | Changing widget UI/behavior |
| `src/pages/Dashboard.tsx` | Widget management page | Changing dashboard layout |
| `src/pages/AdminPanel.tsx` | Admin user management | Changing invitation system |
| `src/integrations/supabase/client.ts` | Supabase client | Never modify (auto-generated) |
| `vite.config.ts` | Build configuration | Changing dev server, plugins, aliases |
| `tailwind.config.ts` | Styling theme | Changing colors, fonts, animations |
| `tsconfig.app.json` | TypeScript settings | Changing strict mode, adding paths |
| `supabase/migrations/` | Database schema | Adding/changing tables, relationships |
| `supabase/functions/retell-*.ts` | Retell integration | Changing API integration |

### Critical Dependencies

**Most Modified Files**:
- `src/contexts/AuthContext.tsx` - Core auth state
- `src/components/VoiceWidget.tsx` - Core widget functionality
- `src/pages/Dashboard.tsx` - Main user interface
- `supabase/functions/retell-*.ts` - API integrations
- `tailwind.config.ts` - Styling and branding

**Do Not Modify**:
- `src/integrations/supabase/types.ts` - Auto-generated from Supabase schema
- `src/integrations/supabase/client.ts` - Auto-generated from Supabase CLI

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
- `recharts` - Data visualization (for analytics dashboards)
- `qrcode.react` - QR code generation (for widget embedding)
- `embla-carousel` - Carousel component
- `date-fns` - Date utilities
- `class-variance-authority` - Component variant styling

## Data Flow & Architecture Overview

### User Authentication Flow
1. **User visits `/auth`** → Login form page
2. **User enters email + password** → `AuthContext.signIn()` called
3. **Supabase Auth validates** → Session created, stored in localStorage
4. **AuthContext listens to auth state** → Fetches profile and roles from database
5. **`useAuth()` hook returns state** → Components render with user context
6. **Session auto-refreshes** → Tokens refreshed automatically by Supabase
7. **Sign out** → Session cleared, user redirected to `/auth`

### Invitation Accept Flow
1. **Admin sends email invitation** → Contains link like `/invite/abc123token`
2. **User clicks invite link** → `InviteAccept.tsx` loads with token
3. **User sets password** → Validated against strength requirements (8+ chars, uppercase, lowercase, number, special char)
4. **Component calls Supabase** → `signUp()` with email, password, and invite token
5. **Backend creates account** → User profile auto-created, role assigned from invitation
6. **Auto-join main team** → User added to main team automatically
7. **Auth state updates** → User can now login normally

### Voice Call Flow
1. **User opens widget** → `VoiceWidget.tsx` renders with voice mode enabled
2. **User clicks "Start Call"** → Microphone permission requested
3. **Component invokes Edge Function** → `supabase.functions.invoke("retell-create-call")`
4. **Edge Function creates Retell session** → Calls Retell API with widget's `voice_agent_id`
5. **Session returned to component** → Contains `call_id` and connection details
6. **RetellWebClient initializes** → Connects WebRTC microphone to Retell servers
7. **Real-time voice processing** → User speaks, agent responds via speakers
8. **Call ends** → Session closed, UI returns to idle state

### Chat Flow
1. **User opens widget** → `VoiceWidget.tsx` renders with chat mode enabled
2. **User types message** → Component validates input (not empty)
3. **Message sent to Edge Function** → `supabase.functions.invoke("retell-text-chat")`
4. **Edge Function processes** → Sends to Retell API with widget's `chat_agent_id`
5. **Retell returns response** → Streamed back to frontend
6. **Message displayed** → Added to chat history in component state
7. **Auto-scroll** → Chat scrolls to latest message
8. **Session persists** → `chat_id` stored for conversation continuity

### Widget Embedding Flow
1. **User goes to `/embed`** → Shows embed code with their widget ID
2. **User copies embed code** → iFrame code with reference to widget
3. **Embed code placed on external site** → Points to `https://yourdomain.com/widget-embed?id=WIDGET_ID`
4. **Browser loads embed code** → Makes request to `widget-embed` Edge Function
5. **Edge Function serves widget** → Returns self-contained JavaScript bundle
6. **Widget appears on external site** → Fully functional inline or floating widget
7. **Widget calls `/widget-config`** → Fetches configuration (agent IDs, branding)
8. **Widget makes voice/chat calls** → Uses same Edge Functions as main app

### Key Dependencies Between Files
- **App.tsx** → Imports all route pages and AuthProvider
- **AuthContext.tsx** → Used by all authenticated pages via `useAuth()` hook
- **VoiceWidget.tsx** → Used by Index, Dashboard, and embedded widgets
- **FloatingVoiceWidget.tsx** → Wrapper around VoiceWidget for floating variant
- **Edge Functions** → Called by VoiceWidget and components for Retell integration
- **Supabase client** → Used by AuthContext and all database queries

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
- Check `tsconfig.app.json` if strict mode was enabled

**Supabase Edge Functions not deploying:**
- Ensure `supabase` CLI is installed globally: `npm install -g supabase`
- Check that you're linked to correct project: `supabase projects list`
- Verify `RETELL_API_KEY` secret is set: `supabase secrets list`
- Check function logs for errors: `supabase functions get-logs <function-name>`
- Ensure all dependencies in Edge Functions are available in Deno ecosystem

**Widget not loading on embedded page:**
- Verify the embed code uses correct widget ID (check widget URL in dashboard)
- Check browser console for CORS errors
- Ensure Supabase project allows the embedding domain in RLS policies
- Widget loads via iframe from `/widget-embed` endpoint
- Check that `widget_configs` table has entry for the widget ID
- Verify `VITE_SUPABASE_PROJECT_ID` is set in environment

**Auth token expired or user logged out unexpectedly:**
- Check `.env.local` has correct `VITE_SUPABASE_PUBLISHABLE_KEY`
- Supabase tokens refresh automatically via localStorage
- Clear browser storage if stuck: `localStorage.clear()`; re-login
- Check token expiry: Open DevTools → Application → Local Storage → `sb-*-auth-token`
- Verify Supabase project hasn't run out of API quota

**Voice calls not working:**
- Verify widget has valid `voice_agent_id` in Retell dashboard
- Check browser microphone permissions (granted for localhost by default)
- Ensure `RETELL_API_KEY` is set in Supabase secrets (not in `.env.local`)
- View Retell logs in Retell dashboard for detailed call errors
- Check browser console for WebSocket connection errors
- Verify microphone is not already in use by another app
- Test with different browsers to isolate browser-specific issues

**Chat not responding:**
- Verify `chat_agent_id` is set for the widget in widget_configs table
- Check that Retell API key has permissions for chat endpoints
- Monitor Edge Function logs: `supabase functions get-logs retell-text-chat`
- Verify chat_id is being generated and persisted
- Check that agent is configured for chat mode in Retell dashboard

**Invitation emails not sending:**
- Verify Supabase email provider is configured in dashboard
- Check spam/junk folders for emails
- Review email logs in Supabase authentication dashboard
- Ensure invitations haven't expired (7-day limit)
- Test with admin super admin account from `/admin/panel`

**Custom domain or SSL certificate issues:**
- If using custom domain, ensure DNS is properly pointed to Vercel
- SSL certificate should auto-renew via Vercel (takes ~48 hours)
- Check Vercel dashboard for domain configuration status
- Verify environment variables are set for the custom domain

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

### Code Examples

**Check if user is super admin**:
```typescript
import { useAuth } from "@/contexts/AuthContext";

export function AdminFeature() {
  const { isSuperAdmin } = useAuth();
  if (!isSuperAdmin) return <Navigate to="/dashboard" />;
  return <AdminPanel />;
}
```

**Fetch widget configuration**:
```typescript
import { supabase } from "@/integrations/supabase/client";

const { data: widgetConfig } = await supabase
  .from("widget_configs")
  .select("*")
  .eq("id", widgetId)
  .single();
```

**Create a voice call**:
```typescript
const { data, error } = await supabase.functions.invoke("retell-create-call", {
  body: {
    voice_agent_id: "your-agent-id",
    user_id: userId,
  }
});

const { call_id, access_token, ws_url } = data;
```

**Show toast notification**:
```typescript
import { toast } from "sonner";

toast.success("Widget created successfully!");
toast.error("Failed to create widget");
toast.loading("Creating widget...");
```

**Form validation with React Hook Form**:
```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Minimum 8 characters"),
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
});
```

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
