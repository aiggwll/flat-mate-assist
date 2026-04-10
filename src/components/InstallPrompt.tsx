import { useState, useEffect } from "react";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem("dwello-install-dismissed") === "true");
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (isStandalone || dismissed || !deferredPrompt) return null;

  const handleInstall = async () => {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem("dwello-install-dismissed", "true");
    setDismissed(true);
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-3 mb-4">
      <Download className="h-5 w-5 text-primary shrink-0" />
      <p className="text-sm flex-1 min-w-0">
        <span className="font-semibold">dwello als App installieren</span>
        <span className="hidden sm:inline"> – schneller Zugriff ohne Browser</span>
      </p>
      <Button size="sm" onClick={handleInstall} className="shrink-0">
        Installieren
      </Button>
      <button onClick={handleDismiss} className="p-2 text-muted-foreground hover:text-foreground shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default InstallPrompt;
