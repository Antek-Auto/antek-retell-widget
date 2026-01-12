-- Manual Database Setup for Supabase
-- Copy and paste this entire script into Supabase SQL Editor
-- Go to: SQL Editor → New Query → Paste this → Run

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";

-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create tables
CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email text,
    full_name text,
    avatar_url text,
    subscription_tier text DEFAULT 'free' NOT NULL CHECK (subscription_tier IN ('free', 'pro')),
    stripe_customer_id text,
    stripe_subscription_id text,
    subscription_status text DEFAULT 'active' CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'trialing', NULL)),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.widget_configs (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    api_key text NOT NULL UNIQUE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    primary_color text DEFAULT '#14b8a6',
    "position" text DEFAULT 'bottom-right' CHECK ("position" IN ('bottom-right', 'bottom-left')),
    title text DEFAULT 'AI Assistant',
    greeting text DEFAULT 'Hi! How can I help you today?',
    enable_voice boolean DEFAULT true,
    enable_chat boolean DEFAULT true,
    voice_agent_id text,
    chat_agent_id text,
    retell_api_key text,
    allowed_domains text[] DEFAULT '{}',
    attribution_link text DEFAULT 'https://www.antekautomation.com',
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.demo_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    title text DEFAULT 'AI Assistant',
    greeting text DEFAULT 'Hi there! 👋 How can I help you today?',
    enable_voice boolean DEFAULT true,
    enable_chat boolean DEFAULT true,
    primary_color text DEFAULT '#14b8a6',
    retell_api_key text,
    voice_agent_id text,
    chat_agent_id text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE public.teams (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text DEFAULT 'My Team' NOT NULL,
    logo_url text,
    company_name text,
    primary_color text DEFAULT '#14b8a6',
    secondary_color text DEFAULT '#0f172a',
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.team_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role text DEFAULT 'member' NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
    invited_email text,
    invited_at timestamp with time zone,
    accepted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(team_id, user_id)
);

CREATE TABLE public.team_invitations (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    email text NOT NULL,
    role text DEFAULT 'viewer' NOT NULL CHECK (role IN ('editor', 'viewer')),
    token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    expires_at timestamp with time zone NOT NULL DEFAULT (now() + '7 days'::interval),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(user_id, role)
);

-- Create helper functions
CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
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

-- Create triggers
CREATE TRIGGER handle_new_user AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_widget_configs_updated_at BEFORE UPDATE ON public.widget_configs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.widget_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for widget_configs
CREATE POLICY "Users can view their own widgets" ON public.widget_configs
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own widgets" ON public.widget_configs
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own widgets" ON public.widget_configs
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own widgets" ON public.widget_configs
    FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Public can view widgets by api_key" ON public.widget_configs
    FOR SELECT TO anon USING (true);
CREATE POLICY "Admins can view all widgets" ON public.widget_configs
    FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage all widgets" ON public.widget_configs
    TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for demo_settings
CREATE POLICY "Public can view demo settings" ON public.demo_settings
    FOR SELECT USING (true);
CREATE POLICY "Admins can view demo settings" ON public.demo_settings
    FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins and super admins can manage demo settings" ON public.demo_settings
    USING (
        public.has_role(auth.uid(), 'admin'::app_role) OR
        public.has_role(auth.uid(), 'super_admin'::app_role)
    )
    WITH CHECK (
        public.has_role(auth.uid(), 'admin'::app_role) OR
        public.has_role(auth.uid(), 'super_admin'::app_role)
    );

-- RLS Policies for teams
CREATE POLICY "Team owners can manage their team" ON public.teams
    USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Team members can view their team" ON public.teams
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.team_members
        WHERE team_members.team_id = teams.id AND team_members.user_id = auth.uid()));
CREATE POLICY "Admins can view all teams" ON public.teams
    FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for team_members
CREATE POLICY "Users can view their own membership" ON public.team_members
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Team members can view other members" ON public.team_members
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = team_members.team_id AND tm.user_id = auth.uid()));
CREATE POLICY "Team owners can manage members" ON public.team_members
    USING (EXISTS (SELECT 1 FROM public.teams
        WHERE teams.id = team_members.team_id AND teams.owner_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.teams
        WHERE teams.id = team_members.team_id AND teams.owner_id = auth.uid()));

-- RLS Policies for team_invitations
CREATE POLICY "Invited users can view their invitation" ON public.team_invitations
    FOR SELECT USING (email = (SELECT email FROM auth.users WHERE users.id = auth.uid()));
CREATE POLICY "Team owners can manage invitations" ON public.team_invitations
    USING (EXISTS (SELECT 1 FROM public.teams
        WHERE teams.id = team_invitations.team_id AND teams.owner_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.teams
        WHERE teams.id = team_invitations.team_id AND teams.owner_id = auth.uid()));

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
    FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can view all roles" ON public.user_roles
    FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage roles" ON public.user_roles
    TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Done!
-- You can verify by running: SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
