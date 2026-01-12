import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, User, Users, Palette, Key } from "lucide-react";
import { toast } from "sonner";
import TeamManagement from "@/components/TeamManagement";
import WhitelabelSettings from "@/components/WhitelabelSettings";

export default function Settings() {
  const navigate = useNavigate();
  const { user, profile, loading, refreshProfile } = useAuth();
  const [retellApiKey, setRetellApiKey] = useState("");
  const [isSavingApiKey, setIsSavingApiKey] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && profile) {
      fetchRetellApiKey();
    }
  }, [user, profile]);

  const fetchRetellApiKey = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("retell_api_key")
      .eq("user_id", user!.id)
      .single();

    if (data?.retell_api_key) {
      setRetellApiKey(data.retell_api_key);
    }
  };

  const handleSaveRetellApiKey = async () => {
    if (!retellApiKey.trim()) {
      toast.error("Please enter a Retell API key");
      return;
    }

    setIsSavingApiKey(true);
    const { error } = await supabase
      .from("profiles")
      .update({ retell_api_key: retellApiKey })
      .eq("user_id", user!.id);

    setIsSavingApiKey(false);

    if (error) {
      console.error("Error saving API key:", error);
      toast.error("Failed to save API key");
    } else {
      toast.success("Retell API key saved successfully");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="text-xl font-bold text-gradient">
            AAVAC Bot
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-muted-foreground text-sm">
              Manage your account, team, and branding
            </p>
          </div>
        </div>

        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Team</span>
            </TabsTrigger>
            <TabsTrigger value="branding" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">Branding</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account">
            <div className="glass rounded-xl p-6 space-y-6">
              <div>
                <h2 className="font-semibold mb-4">Account Information</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Email</span>
                    <span>{user?.email}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Name</span>
                    <span>{profile?.full_name || "Not set"}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Retell AI Configuration
                </h2>
                <p className="text-muted-foreground text-sm mb-4">
                  Configure your global Retell API key. All widgets will use this key unless you specify a custom key for individual widgets.
                </p>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="retell-api-key">Retell API Key</Label>
                    <Input
                      id="retell-api-key"
                      type="password"
                      placeholder="Enter your Retell API key"
                      value={retellApiKey}
                      onChange={(e) => setRetellApiKey(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Get your API key from{" "}
                      <a
                        href="https://retell.ai/dashboard"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Retell AI Dashboard
                      </a>
                    </p>
                  </div>
                  <Button
                    onClick={handleSaveRetellApiKey}
                    disabled={isSavingApiKey}
                    className="w-full"
                  >
                    {isSavingApiKey ? "Saving..." : "Save API Key"}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="team">
            <TeamManagement />
          </TabsContent>

          <TabsContent value="branding">
            <WhitelabelSettings />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
