import { useState } from "react";
import { Building2, UserPlus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import InviteTenantDialog from "./InviteTenantDialog";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";

interface LandlordOnboardingProps {
  open: boolean;
  onComplete: () => void;
}

const LandlordOnboarding = ({ open, onComplete }: LandlordOnboardingProps) => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const { salutation } = useUser();
  const isSie = salutation === "sie";

  const finish = () => {
    localStorage.setItem("onboarding_complete_owner", "true");
    onComplete();
    toast.success("Ihr Konto ist eingerichtet! 🎉");
  };

  const dots = (
    <div className="flex items-center justify-center gap-2 pt-6">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`h-2 w-2 rounded-full transition-all ${
            i === step ? "bg-primary w-6" : "bg-primary/20"
          }`}
        />
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-md p-0 overflow-hidden [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {step === 0 && (
          <div className="p-8 text-center space-y-5">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-heading font-bold text-foreground">
                Willkommen bei Dwello! 🏠
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                {isSie ? "In 3 Schritten sind Sie startklar." : "In 3 Schritten bist du startklar."}
              </p>
            </div>
            <Button onClick={() => setStep(1)} className="w-full">
              Los geht's →
            </Button>
            {dots}
          </div>
        )}

        {step === 1 && (
          <div className="p-8 text-center space-y-5">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-heading font-bold text-foreground">
                Erste Immobilie anlegen
              </h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
                {isSie
                  ? "Legen Sie Ihre erste Immobilie an, um Mieter einladen und Zahlungen tracken zu können."
                  : "Lege deine erste Immobilie an, um Mieter einladen und Zahlungen tracken zu können."}
              </p>
            </div>
            <Button
              onClick={() => {
                navigate("/properties");
                finish();
              }}
              className="w-full"
            >
              Immobilie anlegen
            </Button>
            <button
              onClick={() => setStep(2)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Später einrichten
            </button>
            {dots}
          </div>
        )}

        {step === 2 && (
          <div className="p-8 text-center space-y-5">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <UserPlus className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-heading font-bold text-foreground">
                Mieter einladen
              </h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
                Laden Sie Ihren ersten Mieter ein. Er erhält einen Link zur
                Registrierung.
              </p>
            </div>
            <div className="flex justify-center">
              <InviteTenantDialog onSuccess={finish} />
            </div>
            <button
              onClick={finish}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Später
            </button>
            {dots}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LandlordOnboarding;
