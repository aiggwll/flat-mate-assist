import { useState } from "react";
import { Store, Sparkles, Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const MarketplacePage = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleNotify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      toast.error("Bitte geben Sie eine gültige E-Mail-Adresse ein.");
      return;
    }
    setSubmitted(true);
    toast.success("Wir benachrichtigen Sie, sobald der Marktplatz live geht.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Off-Market Marktplatz</h1>
        <p className="text-muted-foreground text-sm mt-1">Exklusive Immobilienangebote für registrierte Eigentümer</p>
      </div>

      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="max-w-md w-full text-center space-y-6 bg-card border rounded-2xl p-10 shadow-sm">
          <div className="relative inline-flex mx-auto">
            <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Store className="h-10 w-10 text-primary" />
            </div>
            <Sparkles className="h-5 w-5 text-accent absolute -top-1 -right-1" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-primary/10 text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Coming Soon
            </span>
            <h2 className="text-2xl font-heading font-bold text-foreground pt-2">Off-Market Marktplatz</h2>
            <p className="text-sm font-medium text-accent">Demnächst verfügbar</p>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            Exklusive Immobilienangebote für registrierte Eigentümer – der Marktplatz wird in Kürze freigeschaltet.
          </p>

          {submitted ? (
            <div className="flex items-center justify-center gap-2 text-sm text-primary font-medium pt-2">
              <Check className="h-4 w-4" />
              Sie werden benachrichtigt
            </div>
          ) : (
            <form onSubmit={handleNotify} className="flex flex-col sm:flex-row gap-2 pt-2">
              <Input
                type="email"
                name="notify-email"
                id="notify-email"
                placeholder="Ihre E-Mail-Adresse"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="default">
                <Bell className="h-4 w-4" />
                Benachrichtigen
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketplacePage;
