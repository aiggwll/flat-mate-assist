import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DwelloLogo from "@/components/DwelloLogo";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";

const LandingPage = () => {
  const navigate = useNavigate();
  const { user, userRole, isLoading } = useUser();

  // If the user is already signed in, send them straight to the right home.
  useEffect(() => {
    if (isLoading || !user) return;
    navigate(userRole === "tenant" ? "/tenant-dashboard" : "/dashboard", { replace: true });
  }, [user, userRole, isLoading, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-lg text-center space-y-8">
        <div className="flex justify-center">
          <DwelloLogo variant="light" size="lg" />
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-foreground leading-tight">
            Ihre Immobilienverwaltung. Einfach. Modern. Digital.
          </h1>
          <p className="text-base text-muted-foreground max-w-md mx-auto">
            Miete, Dokumente und Nebenkostenabrechnung — alles an einem Ort.
            Die erste Immobilie kostenlos verwalten.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button
            onClick={() => navigate("/register")}
            size="lg"
            className="h-12 px-8 text-base"
          >
            Kostenlos registrieren
          </Button>
          <Button
            onClick={() => navigate("/login")}
            size="lg"
            variant="outline"
            className="h-12 px-8 text-base"
          >
            Anmelden
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
