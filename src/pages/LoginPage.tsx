import { useState } from "react";
import DwelloLogo from "@/components/DwelloLogo";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/integrations/supabase/client";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const navigate = useNavigate();
  const { setUserName, setUserRole } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const loginPromise = supabase.auth.signInWithPassword({ email, password });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("TIMEOUT")), 8000)
      );

      let signInResult;
      try {
        signInResult = await Promise.race([loginPromise, timeoutPromise]);
      } catch (err: any) {
        if (err?.message === "TIMEOUT") {
          setError("Verbindungsfehler. Bitte versuchen Sie es erneut.");
          return;
        }
        throw err;
      }

      const { data: signInData, error: signInError } = signInResult;
      if (signInError) {
        setError(
          signInError.message === "Invalid login credentials"
            ? "Ungültige E-Mail oder Passwort."
            : signInError.message
        );
        return;
      }

      localStorage.setItem("rememberMe", rememberMe ? "true" : "false");
      const signedInUser = signInData?.user;

      if (signedInUser) {
        let targetRoute = "/dashboard";
        try {
          const profilePromise = supabase
            .from("profiles")
            .select("name, role")
            .eq("user_id", signedInUser.id)
            .single();
          const profileTimeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("PROFILE_TIMEOUT")), 5000)
          );
          const { data: profile } = await Promise.race([profilePromise, profileTimeout]);
          if (profile) {
            setUserName(profile.name);
            setUserRole(profile.role as "owner" | "tenant");
            targetRoute = profile.role === "owner" ? "/dashboard" : "/tenant-dashboard";
          }
        } catch {
          const metaRole = (signedInUser.user_metadata?.role as "owner" | "tenant") || "tenant";
          setUserRole(metaRole);
          targetRoute = metaRole === "owner" ? "/dashboard" : "/tenant-dashboard";
        }
        setTimeout(() => navigate(targetRoute), 100);
      }
    } catch {
      setError("Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary flex">
      {/* Left branding panel */}
      <div className="flex-1 hidden lg:flex items-center justify-center p-12">
        <div className="max-w-md">
          <div className="mb-4">
            <DwelloLogo variant="dark" size="xl" showIcon={false} />
          </div>
          <p className="text-primary-foreground/70 text-lg leading-relaxed">
            Dwello vereinfacht die Verwaltung Ihrer Immobilien — strukturiert, sicher und jederzeit verfügbar.
          </p>
          <div className="mt-8 space-y-4">
            {["Mietzahlungen im Überblick", "Kommunikation mit Mietern", "Dokumente & Nebenkostenabrechnung"].map((item) => (
              <div key={item} className="flex items-center gap-3 text-primary-foreground/60">
                <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right login card */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background rounded-l-3xl lg:max-w-lg">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <DwelloLogo variant="light" size="lg" showIcon={false} />
          </div>

          <h2 className="text-2xl font-heading font-bold text-foreground">Willkommen zurück</h2>
          <p className="text-muted-foreground text-sm mt-1 mb-6">
            Melden Sie sich mit Ihrer E-Mail-Adresse an
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">E-Mail</Label>
              <Input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="name@beispiel.de"
                required
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">Passwort</Label>
              <div className="relative">
                <Input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm text-muted-foreground">Angemeldet bleiben</span>
              </label>
              <button
                type="button"
                className="text-sm text-accent hover:underline"
                onClick={async () => {
                  if (!email) {
                    toast.error("Bitte geben Sie Ihre E-Mail-Adresse ein.");
                    return;
                  }
                  const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: window.location.origin,
                  });
                  if (resetErr) {
                    toast.error(`Fehler: ${resetErr.message}`);
                  } else {
                    toast.success("Eine E-Mail zum Zurücksetzen des Passworts wurde gesendet.");
                  }
                }}
              >
                Passwort vergessen?
              </button>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Bitte warten..." : "Anmelden"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Noch kein Konto?{" "}
            <button
              onClick={() => navigate("/register")}
              className="text-accent font-medium hover:underline"
            >
              Jetzt registrieren →
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
