import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Copy, Trash2, Calendar } from "lucide-react";

interface Invitation {
  id: string;
  email: string;
  role: string;
  token: string;
  expires_at: string;
  created_at: string;
}

export default function InvitationManagement() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("user");
  const [isLoading, setIsLoading] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    setIsFetching(true);
    try {
      const { data, error } = await supabase
        .from("user_invitations")
        .select("*")
        .is("accepted_at", null)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching invitations:", error);
        toast.error("Failed to load invitations");
      } else {
        setInvitations(data || []);
      }
    } finally {
      setIsFetching(false);
    }
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Check if email already has pending invitation
    const existing = invitations.find((inv) => inv.email === email && !inv.expires_at);
    if (existing) {
      toast.error("This email already has a pending invitation");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_invitations")
        .insert({
          email: email.toLowerCase(),
          role: role as any,
          invited_by: (await supabase.auth.getUser()).data.user?.id,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select("*")
        .single();

      if (error) {
        if (error.message.includes("duplicate")) {
          toast.error("An active invitation already exists for this email");
        } else {
          toast.error("Failed to send invitation");
        }
        console.error("Error creating invitation:", error);
      } else {
        toast.success(`Invitation sent to ${email}`);
        setEmail("");
        setRole("user");
        if (data) {
          setInvitations([data, ...invitations]);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async (token: string, inviteEmail: string) => {
    const link = `${window.location.origin}/invite/${token}`;
    await navigator.clipboard.writeText(link);
    toast.success(`Invitation link copied for ${inviteEmail}`);
  };

  const handleCancelInvitation = async (id: string, inviteEmail: string) => {
    try {
      const { error } = await supabase
        .from("user_invitations")
        .delete()
        .eq("id", id);

      if (error) {
        toast.error("Failed to cancel invitation");
        console.error("Error canceling invitation:", error);
      } else {
        toast.success(`Invitation for ${inviteEmail} has been canceled`);
        setInvitations(invitations.filter((inv) => inv.id !== id));
      }
    } catch (err) {
      toast.error("Failed to cancel invitation");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) {
      return "Expired";
    }
    return `${daysLeft} days`;
  };

  return (
    <div className="space-y-6">
      {/* Invite Form */}
      <Card>
        <CardHeader>
          <CardTitle>Send Invitation</CardTitle>
          <CardDescription>Invite new team members by email</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendInvitation} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={setRole} disabled={isLoading}>
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !email}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Invitation"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Invitations</CardTitle>
          <CardDescription>
            {isFetching ? "Loading..." : `${invitations.length} pending invitation${invitations.length !== 1 ? "s" : ""}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isFetching ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : invitations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No pending invitations
            </p>
          ) : (
            <div className="space-y-3">
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{inv.email}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <p className="text-xs text-muted-foreground capitalize">
                        Role: {inv.role}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        Expires in {formatDate(inv.expires_at)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopyLink(inv.token, inv.email)}
                      className="h-8 w-8 p-0"
                      title="Copy invitation link"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCancelInvitation(inv.id, inv.email)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      title="Cancel invitation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
