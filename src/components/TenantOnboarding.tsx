import { useState } from "react";
import { Home, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useUser } from "@/contexts/UserContext";

interface TenantOnboardingProps {
  open: boolean;
  onComplete: () => void;
}

const TenantOnboarding = ({ open, onComplete }: TenantOnboardingProps) => {
  const [step, setStep] = useState(0);

  const finish = () => {
    localStorage.setItem("onboarding_complete_tenant", "true");
    onComplete();
  };

  const dots = (
    <div className="flex items-center justify-center gap-2 pt-6">
      {[0, 1].map((i) => (
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
              <Home className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-heading font-bold text-foreground">
                Willkommen in Ihrem Mieterportal! 🏡
              </h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
                Hier verwalten Sie Ihre Wohnung, kommunizieren mit Ihrem
                Vermieter und verdienen Cashback.
              </p>
            </div>
            <Button onClick={() => setStep(1)} className="w-full">
              Weiter →
            </Button>
            {dots}
          </div>
        )}

        {step === 1 && (
          <div className="p-8 text-center space-y-5">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Gift className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-heading font-bold text-foreground">
                So funktioniert Cashback 🎁
              </h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
                Laden Sie einen 360°-Rundgang Ihrer Wohnung hoch und erhalten
                Sie bis zu 100 € Cashback von Ihrem Vermieter.
              </p>
            </div>
            <Button onClick={finish} className="w-full">
              Verstanden, loslegen!
            </Button>
            {dots}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TenantOnboarding;
