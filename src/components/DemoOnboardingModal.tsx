import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDemo } from "@/contexts/DemoContext";

interface Props {
  open: boolean;
  onComplete: () => void;
}

const DemoOnboardingModal = ({ open, onComplete }: Props) => {
  const { setDemoOnboarding } = useDemo();
  const [name, setName] = useState("");
  const [formal, setFormal] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDemoOnboarding(name.trim() || "Nutzer", formal);
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-heading font-bold text-foreground">Herzlich willkommen</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Bevor wir starten – wie dürfen wir Sie ansprechen?
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="demo-name">Vorname</Label>
              <Input
                id="demo-name"
                name="demo-name"
                placeholder="Ihr Vorname"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label>Anrede</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormal(true)}
                  className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all ${
                    formal
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  Sie
                </button>
                <button
                  type="button"
                  onClick={() => setFormal(false)}
                  className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all ${
                    !formal
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  Du
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full">Los geht's</Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DemoOnboardingModal;
