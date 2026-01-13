-- ============================================================================
-- CREATE SUPER ADMIN USER SCRIPT
-- ============================================================================
--
-- THIS SCRIPT MUST BE RUN AFTER:
-- 1. Running database-setup.sql
-- 2. Creating a user in Supabase Authentication → Users
--
-- INSTRUCTIONS:
-- 1. Go to Supabase → Authentication → Users
-- 2. Click "Add User" and create a new user with email and password
-- 3. Copy the user UUID (the long ID in the first column)
-- 4. Replace {USER_ID} below with the actual UUID
-- 5. Run this script in the SQL Editor
--
-- EXAMPLE:
-- If your user UUID is: 123e4567-e89b-12d3-a456-426614174000
-- Replace line 24 with: VALUES ('123e4567-e89b-12d3-a456-426614174000', 'super_admin');
--
-- ============================================================================

-- Replace {USER_ID} with the actual UUID from Supabase Auth → Users
-- Example: '123e4567-e89b-12d3-a456-426614174000'

-- Step 1: Assign super_admin role to user
INSERT INTO public.user_roles (user_id, role)
VALUES ('{USER_ID}', 'super_admin'::public.app_role)
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 2: Create main team for admin
SELECT public.create_main_team('{USER_ID}'::uuid, 'Main Team');

-- ============================================================================
-- ADMIN SETUP COMPLETE
-- ============================================================================
-- Your super admin user is now ready!
--
-- You can now:
-- 1. Go to your app at http://localhost:8080/auth (or your Vercel URL)
-- 2. Login with the credentials you created in Supabase Auth
-- 3. Go to /admin/demo to configure the global demo widget
-- 4. Go to /admin/panel to invite more users
-- 5. Go to /dashboard to create your first widget
--
-- ============================================================================
