import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import PasswordStrengthMeter from "@/components/PasswordStrengthMeter";

const strongPasswordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Must contain an uppercase letter")
  .regex(/[a-z]/, "Must contain a lowercase letter")
  .regex(/[0-9]/, "Must contain a number")
  .regex(/[^A-Za-z0-9]/, "Must contain a special character");

interface InvitationData {
  id: string;
  email: string;
  role: string;
  expires_at: string;
}

export default function InviteAccept() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    if (!token) {
      setIsError(true);
      setErrorMessage("Invalid invitation link");
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_invitations")
        .select("*")
        .eq("token", token)
        .single();

      if (error || !data) {
        setIsError(true);
        setErrorMessage("Invitation not found");
        setIsLoading(false);
        return;
      }

      // Check if invitation is expired
      const expiresAt = new Date(data.expires_at);
      if (expiresAt < new Date()) {
        setIsError(true);
        setErrorMessage("This invitation has expired. Please contact your administrator for a new one.");
        setIsLoading(false);
        return;
      }

      // Check if already accepted
      if (data.accepted_at) {
        setIsError(true);
        setErrorMessage("This invitation has already been used. Please sign in instead.");
        setIsLoading(false);
        return;
      }

      setInvitation(data);
      setIsLoading(false);
    } catch (err) {
      console.error("Error validating token:", err);
      setIsError(true);
      setErrorMessage("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords match
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    // Validate password strength
    const passwordResult = strongPasswordSchema.safeParse(password);
    if (!passwordResult.success) {
      toast.error(passwordResult.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);

    try {
      // Create auth user via signUp
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation!.email,
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            full_name: invitation!.email.split("@")[0],
          },
        },
      });

      if (authError || !authData.user) {
        if (authError?.message.includes("already registered")) {
          toast.error("An account with this email already exists. Please sign in.");
        } else {
          toast.error(authError?.message || "Failed to create account");
        }
        console.error("Auth error:", authError);
        setIsSubmitting(false);
        return;
      }

      const userId = authData.user.id;

      // Assign role
      try {
        await supabase.from("user_roles").insert({
          user_id: userId,
          role: invitation!.role,
        });
      } catch (roleErr) {
        console.error("Error assigning role (may already exist):", roleErr);
      }

      // Get or create main team
      try {
        const { data: mainTeam, error: teamError } = await supabase
          .from("teams")
          .select("id")
          .order("created_at", { ascending: true })
          .limit(1)
          .single();

        if (mainTeam && !teamError) {
          // Add user to main team
          await supabase.from("team_members").insert({
            team_id: mainTeam.id,
            user_id: userId,
            role: "member",
            invited_email: invitation!.email,
            accepted_at: new Date().toISOString(),
          });
        }
      } catch (teamErr) {
        console.error("Error adding to team:", teamErr);
        // Continue anyway - team membership is nice to have but not critical
      }

      // Mark invitation as accepted
      try {
        await supabase
          .from("user_invitations")
          .update({ accepted_at: new Date().toISOString() })
          .eq("id", invitation!.id);
      } catch (invErr) {
        console.error("Error marking invitation as accepted:", invErr);
        // Continue anyway - user is already created
      }

      toast.success("Account created successfully!");

      // Sign in the user
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: invitation!.email,
        password: password,
      });

      if (signInError) {
        console.error("Sign in error:", signInError);
        // Redirect to sign in page
        navigate("/auth");
      } else {
        // Redirect to dashboard
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invitation Invalid</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
            <Button onClick={() => navigate("/auth")} className="w-full">
              Back to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Complete Your Account Setup</CardTitle>
          <CardDescription>
            You've been invited to join. Please create your password to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Display */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="px-3 py-2 bg-muted rounded-md border border-border text-sm">
                {invitation?.email}
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-10"
              />
            </div>

            {/* Password Strength Meter */}
            {password && (
              <PasswordStrengthMeter password={password} showRequirements={true} />
            )}

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-10"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !password || !confirmPassword}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account & Sign In"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
