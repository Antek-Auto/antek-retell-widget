-- Create user_invitations table for admin-based user creation
CREATE TABLE IF NOT EXISTS public.user_invitations (
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

-- Enable RLS for user_invitations
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_invitations
-- Admins can manage all invitations
CREATE POLICY "Admins can manage invitations"
  ON public.user_invitations
  USING (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'super_admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- Anyone can view an invitation by token (token is effectively a password)
CREATE POLICY "Anyone can view invitation by email"
  ON public.user_invitations
  FOR SELECT
  USING (true);

-- Create function to initialize main team for super admin
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

-- Update widget_configs RLS policies to support team-based access
-- Drop existing restrictive policies that only allow users to see their own widgets
DROP POLICY IF EXISTS "Users can view their own widgets" ON public.widget_configs;
DROP POLICY IF EXISTS "Users can update their own widgets" ON public.widget_configs;
DROP POLICY IF EXISTS "Users can delete their own widgets" ON public.widget_configs;
DROP POLICY IF EXISTS "Users can create their own widgets" ON public.widget_configs;

-- Create new team-based widget access policies
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
    -- User is admin
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR
    -- User is super_admin
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

-- Add attribution_text column to widget_configs if it doesn't exist
ALTER TABLE public.widget_configs ADD COLUMN IF NOT EXISTS attribution_text text DEFAULT 'Antek Automation';
