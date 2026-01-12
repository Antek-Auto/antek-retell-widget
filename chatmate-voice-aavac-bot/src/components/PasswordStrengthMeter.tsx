import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";

interface PasswordRequirement {
  label: string;
  regex: RegExp;
  met: boolean;
}

interface PasswordStrengthMeterProps {
  password: string;
  showRequirements?: boolean;
}

export default function PasswordStrengthMeter({ password, showRequirements = true }: PasswordStrengthMeterProps) {
  const [requirements, setRequirements] = useState<PasswordRequirement[]>([
    { label: "At least 8 characters", regex: /.{8,}/, met: false },
    { label: "Contains uppercase letter (A-Z)", regex: /[A-Z]/, met: false },
    { label: "Contains lowercase letter (a-z)", regex: /[a-z]/, met: false },
    { label: "Contains number (0-9)", regex: /[0-9]/, met: false },
    { label: "Contains special character (!@#$%^&*)", regex: /[^A-Za-z0-9]/, met: false },
  ]);

  useEffect(() => {
    const updated = requirements.map((req) => ({
      ...req,
      met: req.regex.test(password),
    }));
    setRequirements(updated);
  }, [password]);

  const metCount = requirements.filter((r) => r.met).length;
  const strength = metCount / requirements.length;

  // Determine color based on strength
  let strengthColor = "bg-red-500";
  let strengthLabel = "Weak";
  if (strength >= 0.8) {
    strengthColor = "bg-green-500";
    strengthLabel = "Strong";
  } else if (strength >= 0.6) {
    strengthColor = "bg-yellow-500";
    strengthLabel = "Medium";
  }

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        {/* Strength bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full ${strengthColor} transition-all duration-300`}
            style={{ width: `${strength * 100}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Password strength: <span className="font-semibold">{strengthLabel}</span>
        </p>
      </div>

      {showRequirements && (
        <div className="space-y-2 pt-2">
          <p className="text-xs font-medium text-muted-foreground">Requirements:</p>
          <div className="space-y-1">
            {requirements.map((req) => (
              <div
                key={req.label}
                className="flex items-center gap-2 text-xs"
              >
                {req.met ? (
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                ) : (
                  <X className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
                <span className={req.met ? "text-foreground" : "text-muted-foreground"}>
                  {req.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
