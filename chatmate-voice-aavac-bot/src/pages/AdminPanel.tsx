import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Users, Shield, Activity, Mail } from "lucide-react";
import InvitationManagement from "@/components/InvitationManagement";

export default function AdminPanel() {
  const navigate = useNavigate();
  const { user, isSuperAdmin, loading } = useAuth();
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalWidgets, setTotalWidgets] = useState(0);
  const [adminUsers, setAdminUsers] = useState(0);

  useEffect(() => {
    if (!loading && !isSuperAdmin) {
      navigate("/dashboard");
    }
  }, [isSuperAdmin, loading, navigate]);

  useEffect(() => {
    if (user && isSuperAdmin) {
      fetchStats();
    }
  }, [user, isSuperAdmin]);

  const fetchStats = async () => {
    // Count total users
    const { count: userCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    setTotalUsers(userCount || 0);

    // Count total widgets
    const { count: widgetCount } = await supabase
      .from("widget_configs")
      .select("*", { count: "exact", head: true });

    setTotalWidgets(widgetCount || 0);

    // Count admin users
    const { count: adminCount } = await supabase
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin");

    setAdminUsers(adminCount || 0);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="border-b">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition">
            <ChevronLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-xl font-bold">Admin Panel</h1>
          <div></div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">System Overview</h2>
          <p className="text-muted-foreground">Manage your system and view key statistics</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">Active user accounts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Total Widgets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalWidgets}</div>
              <p className="text-xs text-muted-foreground mt-1">Deployed widgets</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Admin Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">Admin accounts</p>
            </CardContent>
          </Card>
        </div>

        {/* Info Cards */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">System Status</CardTitle>
              <CardDescription>All systems operational</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Database</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Connected</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Edge Functions</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Deployed</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Authentication</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Configuration
              </CardTitle>
              <CardDescription>Your super admin account</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">You have full system access. Additional user management and settings can be added here.</p>
              <Button onClick={() => navigate("/settings")} className="w-full">Go to Settings</Button>
            </CardContent>
          </Card>
        </div>

        {/* User Management Section */}
        <div className="mt-8 pt-8 border-t">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">User Management</h2>
            <p className="text-muted-foreground">Invite team members and manage access</p>
          </div>
          <InvitationManagement />
        </div>
      </main>
    </div>
  );
}
