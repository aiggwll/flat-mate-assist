import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Home } from "lucide-react";

type Role = "owner" | "tenant";

const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const inviteRole = searchParams.get("role") as Role | null;
  const inviteProperty = searchParams.get("property");

  const [isLogin, setIsLogin] = useState(!inviteRole);
  const [selectedRole, setSelectedRole] = useState<Role | null>(inviteRole);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole === "tenant") {
      navigate("/tenant-dashboard");
    } else {
      navigate("/dashboard");
    }
  };

  // Step 1: Role selection (only if no invite link)
  if (!selectedRole) {
    return (
      <div className="min-h-screen bg-primary flex">
        <div className="flex-1 hidden lg:flex items-center justify-center p-12">
          <div className="max-w-md">
            <h1 className="text-4xl font-heading font-bold text-primary-foreground mb-4 tracking-tight">
              Will<span className="text-accent">Prop</span>
            </h1>
            <p className="text-primary-foreground/70 text-lg leading-relaxed">
              Die All-in-One Plattform für private Vermieter. Verwalten Sie Ihre Immobilien, kommunizieren Sie mit Mietern und behalten Sie den Überblick.
            </p>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-8 bg-background rounded-l-3xl lg:max-w-lg">
          <div className="w-full max-w-sm">
            <div className="lg:hidden mb-8">
              <h1 className="text-2xl font-heading font-bold text-foreground">
                Will<span className="text-accent">Prop</span>
              </h1>
            </div>

            <h2 className="text-2xl font-heading font-bold text-foreground">Willkommen</h2>
            <p className="text-muted-foreground text-sm mt-1 mb-8">
              Wie möchten Sie WillProp nutzen?
            </p>

            <div className="space-y-4">
              <button
                onClick={() => setSelectedRole("owner")}
                className="w-full flex items-center gap-4 p-5 rounded-xl border-2 border-border bg-card hover:border-accent hover:bg-accent/5 transition-all text-left group"
              >
                <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-heading font-semibold text-foreground">Vermieter</p>
                  <p className="text-sm text-muted-foreground">Immobilien verwalten & Mieter managen</p>
                </div>
              </button>

              <button
                onClick={() => setSelectedRole("tenant")}
                className="w-full flex items-center gap-4 p-5 rounded-xl border-2 border-border bg-card hover:border-accent hover:bg-accent/5 transition-all text-left group"
              >
                <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                  <Home className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-heading font-semibold text-foreground">Mieter</p>
                  <p className="text-sm text-muted-foreground">Schäden melden & mit Vermieter kommunizieren</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Login/Register form
  return (
    <div className="min-h-screen bg-primary flex">
      <div className="flex-1 hidden lg:flex items-center justify-center p-12">
        <div className="max-w-md">
          <h1 className="text-4xl font-heading font-bold text-primary-foreground mb-4 tracking-tight">
            Will<span className="text-accent">Prop</span>
          </h1>
          <p className="text-primary-foreground/70 text-lg leading-relaxed">
            {selectedRole === "owner"
              ? "Verwalten Sie Ihre Immobilien, kommunizieren Sie mit Mietern und behalten Sie den Überblick."
              : "Kommunizieren Sie mit Ihrem Vermieter, melden Sie Schäden und verwalten Sie Ihre Dokumente."}
          </p>
          <div className="mt-8 space-y-4">
            {(selectedRole === "owner"
              ? ["Immobilien einfach verwalten", "Direkte Kommunikation mit Mietern", "Schadenmeldungen digital organisieren"]
              : ["Schäden schnell melden", "Direkt mit dem Vermieter kommunizieren", "Dokumente jederzeit einsehen"]
            ).map((item) => (
              <div key={item} className="flex items-center gap-3 text-primary-foreground/60">
                <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-background rounded-l-3xl lg:max-w-lg">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <h1 className="text-2xl font-heading font-bold text-foreground">
              Will<span className="text-accent">Prop</span>
            </h1>
          </div>

          {inviteProperty && !isLogin && (
            <div className="mb-4 p-3 rounded-lg bg-accent/10 border border-accent/20">
              <p className="text-sm text-accent font-medium">
                Sie wurden als Mieter eingeladen
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Erstellen Sie ein Konto, um fortzufahren.
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={() => { setSelectedRole(null); }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Zurück
            </button>
            <span className="text-muted-foreground">·</span>
            <span className="text-sm font-medium text-accent flex items-center gap-1.5">
              {selectedRole === "owner" ? <Building2 className="h-3.5 w-3.5" /> : <Home className="h-3.5 w-3.5" />}
              {selectedRole === "owner" ? "Vermieter" : "Mieter"}
            </span>
          </div>

          <h2 className="text-2xl font-heading font-bold text-foreground">
            {isLogin ? "Willkommen zurück" : "Konto erstellen"}
          </h2>
          <p className="text-muted-foreground text-sm mt-1 mb-6">
            {isLogin ? "Melden Sie sich an, um fortzufahren." : "Erstellen Sie Ihr WillProp Konto."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Max Mustermann" />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input id="email" type="email" placeholder="name@beispiel.de" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input id="password" type="password" placeholder="••••••••" />
            </div>
            {isLogin && (
              <button type="button" className="text-sm text-accent hover:underline">
                Passwort vergessen?
              </button>
            )}
            <Button type="submit" className="w-full">
              {isLogin ? "Anmelden" : "Registrieren"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {isLogin ? "Noch kein Konto?" : "Bereits registriert?"}{" "}
            <button onClick={() => setIsLogin(!isLogin)} className="text-accent font-medium hover:underline">
              {isLogin ? "Jetzt registrieren" : "Anmelden"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
