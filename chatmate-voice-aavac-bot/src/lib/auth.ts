import { SupabaseClient } from "@supabase/supabase-js";

export type UserRole = "super_admin" | "admin" | "moderator" | "user";

/**
 * Get all roles for a user
 */
export const getUserRoles = async (
  supabase: SupabaseClient,
  userId: string
): Promise<UserRole[]> => {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching user roles:", error);
    return [];
  }

  return (data || []).map((r: { role: UserRole }) => r.role);
};

/**
 * Check if user has a specific role
 */
export const hasRole = async (
  supabase: SupabaseClient,
  userId: string,
  role: UserRole
): Promise<boolean> => {
  const roles = await getUserRoles(supabase, userId);
  return roles.includes(role);
};

/**
 * Check if user is super admin
 */
export const isSuperAdmin = async (
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> => {
  return hasRole(supabase, userId, "super_admin");
};

/**
 * Check if user is admin (regular admin or super admin)
 */
export const isAdmin = async (
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> => {
  const roles = await getUserRoles(supabase, userId);
  return roles.includes("admin") || roles.includes("super_admin");
};

/**
 * Get the highest role for a user (for display purposes)
 */
export const getHighestRole = async (
  supabase: SupabaseClient,
  userId: string
): Promise<UserRole | null> => {
  const roles = await getUserRoles(supabase, userId);

  // Priority order: super_admin > admin > moderator > user (implicit)
  if (roles.includes("super_admin")) return "super_admin";
  if (roles.includes("admin")) return "admin";
  if (roles.includes("moderator")) return "moderator";

  return null;
};

/**
 * Get widget limit based on user role
 */
export const getWidgetLimit = (role: UserRole | null): number => {
  if (role === "super_admin") return Infinity;
  if (role === "admin") return 500;
  return 100; // Regular user default
};

/**
 * Get user's global Retell API key
 */
export const getGlobalRetellApiKey = async (
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("retell_api_key")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Error fetching Retell API key:", error);
    return null;
  }

  return data?.retell_api_key || null;
};

/**
 * Save user's global Retell API key
 */
export const saveGlobalRetellApiKey = async (
  supabase: SupabaseClient,
  userId: string,
  apiKey: string
): Promise<boolean> => {
  const { error } = await supabase
    .from("profiles")
    .update({ retell_api_key: apiKey })
    .eq("user_id", userId);

  if (error) {
    console.error("Error saving Retell API key:", error);
    return false;
  }

  return true;
};
