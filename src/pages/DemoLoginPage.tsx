import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DwelloLogo from "@/components/DwelloLogo";
import { Button } from "@/components/ui/button";
import { Building2, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useDemo } from "@/contexts/DemoContext";
import DemoOnboardingModal from "@/components/DemoOnboardingModal";

const DemoLoginPage = () => {
  const navigate = useNavigate();
  const { enterDemo, onboardingDone } = useDemo();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [pendingRole, setPendingRole] = useState<"owner" | "tenant" | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRoleClick = (role: "owner" | "tenant") => {
    enterDemo(role);
    if (onboardingDone) {
      navigate(role === "owner" ? "/dashboard" : "/tenant-dashboard");
    } else {
      setPendingRole(role);
      setShowOnboarding(true);
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    navigate(pendingRole === "owner" ? "/dashboard" : "/tenant-dashboard");
  };

  const handleQuickRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (!fullName || !email.trim() || password.length < 8) {
      toast.error("Bitte füllen Sie alle Felder aus (Passwort min. 8 Zeichen).");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { name: fullName, role: "owner", salutation: "sie" },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        toast.error(error.message.includes("already registered")
          ? "Diese E-Mail-Adresse ist bereits registriert."
          : error.message);
        setLoading(false);
        return;
      }

      // Trigger welcome email (non-blocking)
      const registrationId = crypto.randomUUID();
      supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "welcome-landlord",
          recipientEmail: email.trim(),
          idempotencyKey: `welcome-landlord-${registrationId}`,
          templateData: { name: fullName },
        },
      }).catch(err => console.error("Welcome email failed (non-blocking):", err));

      toast.success("Konto erfolgreich erstellt! Willkommen bei dwello.");
      setShowRegister(false);
      navigate("/dashboard");
    } catch (err) {
      toast.error("Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-background rounded-2xl p-8 shadow-xl">
        <div className="flex justify-center mb-6">
          <DwelloLogo variant="light" size="lg" />
        </div>

        <h1 className="text-2xl font-heading font-bold text-foreground text-center">
          Willkommen zur Testversion
        </h1>
        <p className="text-muted-foreground text-sm text-center mt-2 mb-8">
          Schauen Sie sich dwello in Ruhe an – kein Konto erforderlich.
        </p>

        <div className="space-y-3">
          <Button
            onClick={() => handleRoleClick("owner")}
            className="w-full h-14 text-base gap-3"
            size="lg"
          >
            <Building2 className="h-5 w-5" />
            Als Vermieter testen
          </Button>

          <Button
            onClick={() => handleRoleClick("tenant")}
            variant="outline"
            className="w-full h-14 text-base gap-3"
            size="lg"
          >
            <User className="h-5 w-5" />
            Als Mieter testen
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Dies ist eine Testversion. Alle Daten sind Beispieldaten.
        </p>

        <div className="mt-6 pt-4 border-t border-border space-y-2">
          <button
            onClick={() => navigate("/register")}
            className="w-full text-sm text-accent font-semibold hover:underline"
          >
            Jetzt kostenlos registrieren →
          </button>
          <button
            onClick={() => navigate("/login")}
            className="w-full text-sm text-muted-foreground hover:underline"
          >
            Mit bestehendem Konto anmelden
          </button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowRegister(true)}
            className="w-full h-12 text-base border-2"
            style={{ borderColor: "#2D5A3D", color: "#2D5A3D" }}
          >
            Kostenlos registrieren
          </Button>
        </div>
      </div>

      <DemoOnboardingModal open={showOnboarding} onComplete={handleOnboardingComplete} />

      <Dialog open={showRegister} onOpenChange={setShowRegister}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Konto erstellen</DialogTitle>
            <DialogDescription>
              Als Vermieter / Eigentümer kostenlos registrieren.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleQuickRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="qr-first">Vorname</Label>
                <Input id="qr-first" value={firstName} onChange={e => setFirstName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="qr-last">Nachname</Label>
                <Input id="qr-last" value={lastName} onChange={e => setLastName(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qr-email">E-Mail Adresse</Label>
              <Input id="qr-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qr-pw">Passwort</Label>
              <Input id="qr-pw" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
              <p className="text-xs text-muted-foreground">Mindestens 8 Zeichen</p>
            </div>
            <div className="rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              Rolle: <span className="font-medium text-foreground">Vermieter / Eigentümer</span>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              style={{ backgroundColor: "#2D5A3D", color: "#fff" }}
            >
              {loading ? "Wird erstellt…" : "Konto erstellen"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DemoLoginPage;
