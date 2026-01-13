-- ============================================================================
-- CONSOLIDATED DATABASE SETUP SCRIPT FOR ANTEK RETELL WIDGET
-- ============================================================================
-- This script consolidates all Supabase migrations into a single script
-- for easy setup via the Supabase SQL Editor (copy & paste)
--
-- Run this script in your Supabase project's SQL Editor after creating
-- the project. It will create all tables, functions, triggers, and RLS policies.
--
-- NO LOCAL SUPABASE CLI REQUIRED
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

BEGIN;

-- ============================================================================
-- CUSTOM TYPES
-- ============================================================================

CREATE TYPE public.app_role AS ENUM (
    'super_admin',
    'admin',
    'moderator',
    'user'
);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

CREATE FUNCTION public.check_team_member_limit() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  member_count INTEGER;
  owner_tier TEXT;
BEGIN
  -- Get team owner's subscription tier
  SELECT subscription_tier INTO owner_tier
  FROM public.profiles p
  JOIN public.teams t ON t.owner_id = p.user_id
  WHERE t.id = NEW.team_id;

  -- Count existing members (excluding owner)
  SELECT COUNT(*) INTO member_count
  FROM public.team_members
  WHERE team_id = NEW.team_id;

  -- Pro accounts limited to 3 team members
  IF owner_tier = 'pro' AND member_count >= 3 THEN
    RAISE EXCEPTION 'Pro accounts are limited to 3 team members. Contact support for higher limits.';
  END IF;

  -- Free accounts cannot have team members
  IF owner_tier = 'free' THEN
    RAISE EXCEPTION 'Team members require a Pro subscription.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE FUNCTION public.check_widget_limit() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  widget_count INTEGER;
BEGIN
  -- Count existing widgets for user
  SELECT COUNT(*) INTO widget_count
  FROM public.widget_configs
  WHERE user_id = NEW.user_id;

  -- Limit to 100 widgets per user
  IF widget_count >= 100 THEN
    RAISE EXCEPTION 'You have reached the maximum limit of 100 widgets per account.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE FUNCTION public.generate_widget_api_key() RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN 'wgt_' || encode(gen_random_bytes(24), 'hex');
END;
$$;

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', '')
  );
  RETURN NEW;
END;
$$;

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_main_team(
  admin_user_id uuid,
  team_name text DEFAULT 'Main Team'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_team_id uuid;
BEGIN
  -- Check if team already exists
  SELECT id INTO new_team_id FROM public.teams
  WHERE owner_id = admin_user_id
  LIMIT 1;

  IF new_team_id IS NULL THEN
    INSERT INTO public.teams (owner_id, name)
    VALUES (admin_user_id, team_name)
    RETURNING id INTO new_team_id;
  END IF;

  RETURN new_team_id;
END;
$$;

-- ============================================================================
-- TABLES
-- ============================================================================

CREATE TABLE public.demo_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text DEFAULT 'AI Assistant'::text,
    greeting text DEFAULT 'Hi there! 👋 How can I help you today?'::text,
    enable_voice boolean DEFAULT true,
    enable_chat boolean DEFAULT true,
    primary_color text DEFAULT '#14b8a6'::text,
    retell_api_key text,
    voice_agent_id text,
    chat_agent_id text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid
);

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    email text,
    full_name text,
    avatar_url text,
    subscription_tier text DEFAULT 'free'::text NOT NULL,
    stripe_customer_id text,
    stripe_subscription_id text,
    subscription_status text DEFAULT 'active'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT profiles_subscription_status_check CHECK ((subscription_status = ANY (ARRAY['active'::text, 'canceled'::text, 'past_due'::text, 'trialing'::text, NULL::text]))),
    CONSTRAINT profiles_subscription_tier_check CHECK ((subscription_tier = ANY (ARRAY['free'::text, 'pro'::text])))
);

CREATE TABLE public.team_invitations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid NOT NULL,
    email text NOT NULL,
    role text DEFAULT 'viewer'::text NOT NULL,
    token text DEFAULT encode(extensions.gen_random_bytes(32), 'hex'::text) NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '7 days'::interval) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT team_invitations_role_check CHECK ((role = ANY (ARRAY['editor'::text, 'viewer'::text])))
);

CREATE TABLE public.team_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text DEFAULT 'member'::text NOT NULL,
    invited_email text,
    invited_at timestamp with time zone,
    accepted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT team_members_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'editor'::text, 'viewer'::text])))
);

CREATE TABLE public.teams (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id uuid NOT NULL,
    name text DEFAULT 'My Team'::text NOT NULL,
    logo_url text,
    company_name text,
    primary_color text DEFAULT '#14b8a6'::text,
    secondary_color text DEFAULT '#0f172a'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.widget_configs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    api_key text NOT NULL,
    primary_color text DEFAULT '#14b8a6'::text,
    "position" text DEFAULT 'bottom-right'::text,
    title text DEFAULT 'AI Assistant'::text,
    greeting text DEFAULT 'Hi! How can I help you today?'::text,
    enable_voice boolean DEFAULT true,
    enable_chat boolean DEFAULT true,
    voice_agent_id text,
    chat_agent_id text,
    allowed_domains text[] DEFAULT '{}'::text[],
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid,
    retell_api_key text,
    attribution_link text DEFAULT 'https://aavacbot.com',
    attribution_text text DEFAULT 'Antek Automation',
    CONSTRAINT widget_configs_position_check CHECK (("position" = ANY (ARRAY['bottom-right'::text, 'bottom-left'::text])))
);

CREATE TABLE public.user_invitations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    email text NOT NULL,
    token text DEFAULT encode(extensions.gen_random_bytes(32), 'hex'::text) NOT NULL UNIQUE,
    role public.app_role DEFAULT 'user'::public.app_role NOT NULL,
    invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    expires_at timestamp with time zone DEFAULT (now() + '7 days'::interval) NOT NULL,
    accepted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT user_invitations_email_pending UNIQUE(email) WHERE accepted_at IS NULL
);

-- ============================================================================
-- PRIMARY KEY CONSTRAINTS
-- ============================================================================

ALTER TABLE ONLY public.demo_settings
    ADD CONSTRAINT demo_settings_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);

ALTER TABLE ONLY public.team_invitations
    ADD CONSTRAINT team_invitations_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.team_invitations
    ADD CONSTRAINT team_invitations_token_key UNIQUE (token);

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_team_id_user_id_key UNIQUE (team_id, user_id);

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);

ALTER TABLE ONLY public.widget_configs
    ADD CONSTRAINT widget_configs_api_key_key UNIQUE (api_key);

ALTER TABLE ONLY public.widget_configs
    ADD CONSTRAINT widget_configs_pkey PRIMARY KEY (id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER enforce_team_member_limit BEFORE INSERT ON public.team_members FOR EACH ROW EXECUTE FUNCTION public.check_team_member_limit();

CREATE TRIGGER enforce_widget_limit BEFORE INSERT ON public.widget_configs FOR EACH ROW EXECUTE FUNCTION public.check_widget_limit();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_widget_configs_updated_at BEFORE UPDATE ON public.widget_configs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- FOREIGN KEY CONSTRAINTS
-- ============================================================================

ALTER TABLE ONLY public.demo_settings
    ADD CONSTRAINT demo_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.team_invitations
    ADD CONSTRAINT team_invitations_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.widget_configs
    ADD CONSTRAINT widget_configs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.demo_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.widget_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - demo_settings
-- ============================================================================

CREATE POLICY "Admins can manage demo settings" ON public.demo_settings USING (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'super_admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE POLICY "Admins can view demo settings" ON public.demo_settings FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE POLICY "Public can view demo settings" ON public.demo_settings FOR SELECT USING (true);

-- ============================================================================
-- RLS POLICIES - profiles
-- ============================================================================

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = user_id));

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = user_id));

-- ============================================================================
-- RLS POLICIES - user_invitations
-- ============================================================================

CREATE POLICY "Admins can manage invitations"
  ON public.user_invitations
  USING (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'super_admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE POLICY "Anyone can view invitation by email"
  ON public.user_invitations
  FOR SELECT
  USING (true);

-- ============================================================================
-- RLS POLICIES - user_roles
-- ============================================================================

CREATE POLICY "Admins can manage roles" ON public.user_roles TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'super_admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING ((user_id = auth.uid()));

-- ============================================================================
-- RLS POLICIES - teams
-- ============================================================================

CREATE POLICY "Admins can view all teams" ON public.teams FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE POLICY "Team members can view their team" ON public.teams FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.team_members
  WHERE ((team_members.team_id = teams.id) AND (team_members.user_id = auth.uid())))));

CREATE POLICY "Team owners can manage their team" ON public.teams USING ((auth.uid() = owner_id)) WITH CHECK ((auth.uid() = owner_id));

-- ============================================================================
-- RLS POLICIES - team_members
-- ============================================================================

CREATE POLICY "Team members can view other members" ON public.team_members FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.team_members tm
  WHERE ((tm.team_id = team_members.team_id) AND (tm.user_id = auth.uid())))));

CREATE POLICY "Team owners can manage members" ON public.team_members USING ((EXISTS ( SELECT 1
   FROM public.teams
  WHERE ((teams.id = team_members.team_id) AND (teams.owner_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.teams
  WHERE ((teams.id = team_members.team_id) AND (teams.owner_id = auth.uid())))));

CREATE POLICY "Users can view their own membership" ON public.team_members FOR SELECT USING ((user_id = auth.uid()));

-- ============================================================================
-- RLS POLICIES - team_invitations
-- ============================================================================

CREATE POLICY "Invited users can view their invitation" ON public.team_invitations FOR SELECT USING ((email = (( SELECT users.email
   FROM auth.users
  WHERE (users.id = auth.uid())))::text));

CREATE POLICY "Team owners can manage invitations" ON public.team_invitations USING ((EXISTS ( SELECT 1
   FROM public.teams
  WHERE ((teams.id = team_invitations.team_id) AND (teams.owner_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.teams
  WHERE ((teams.id = team_invitations.team_id) AND (teams.owner_id = auth.uid())))));

-- ============================================================================
-- RLS POLICIES - widget_configs
-- ============================================================================

CREATE POLICY "Admins can manage all widgets" ON public.widget_configs TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'super_admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE POLICY "Admins can view all widgets" ON public.widget_configs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE POLICY "Public can view widgets by api_key" ON public.widget_configs FOR SELECT TO anon USING (true);

CREATE POLICY "Team members can view team widgets"
  ON public.widget_configs
  FOR SELECT
  TO authenticated
  USING (
    -- User is widget owner
    auth.uid() = user_id
    OR
    -- User is team member of widget owner's team
    EXISTS (
      SELECT 1 FROM public.team_members tm
      JOIN public.teams t ON t.id = tm.team_id
      WHERE tm.user_id = auth.uid()
      AND t.owner_id = widget_configs.user_id
    )
    OR
    -- User is admin or super_admin
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
  );

CREATE POLICY "Users can create their own widgets"
  ON public.widget_configs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own widgets"
  ON public.widget_configs
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
  );

CREATE POLICY "Users can delete their own widgets"
  ON public.widget_configs
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
  );

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert a default demo_settings record (required for demo page)
INSERT INTO public.demo_settings (title, greeting, enable_voice, enable_chat, primary_color)
VALUES (
    'AI Assistant',
    'Hi there! 👋 How can I help you today?',
    true,
    true,
    '#14b8a6'
)
ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================
-- Database schema is now ready!
--
-- Next steps:
-- 1. Create a super admin user via Supabase Authentication → Users
-- 2. Run create-admin.sql to assign super_admin role and create main team
-- 3. Deploy Edge Functions from supabase/functions/ folder
-- 4. Set RETELL_API_KEY secret in Supabase
-- 5. Deploy frontend to Vercel
-- ============================================================================
