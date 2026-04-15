import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DwelloLogo from "@/components/DwelloLogo";
import { Button } from "@/components/ui/button";
import { Building2, User } from "lucide-react";
import { useDemo } from "@/contexts/DemoContext";
import DemoOnboardingModal from "@/components/DemoOnboardingModal";

const DemoLoginPage = () => {
  const navigate = useNavigate();
  const { enterDemo, onboardingDone } = useDemo();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [pendingRole, setPendingRole] = useState<"owner" | "tenant" | null>(null);

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

        <div className="mt-6 pt-4 border-t border-border">
          <button
            onClick={() => navigate("/login")}
            className="w-full text-sm text-accent font-medium hover:underline"
          >
            Mit bestehendem Konto anmelden →
          </button>
        </div>
      </div>

      <DemoOnboardingModal open={showOnboarding} onComplete={handleOnboardingComplete} />
    </div>
  );
};

export default DemoLoginPage;
