import { useState, useEffect, useRef } from "react";
import { Building2, Users, CreditCard, FileText, Check, ChevronRight, PartyPopper } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import InviteTenantDialog from "@/components/InviteTenantDialog";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/integrations/supabase/client";
import { sal } from "@/lib/salutation";
import { toast } from "sonner";

interface SetupChecklistProps {
  hasProperties: boolean;
  hasTenants: boolean;
  hasPayments: boolean;
  hasMietvertrag: boolean;
}

const SetupChecklist = ({ hasProperties, hasTenants, hasPayments, hasMietvertrag }: SetupChecklistProps) => {
  const navigate = useNavigate();
  const { salutation, userId } = useUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const [dismissed, setDismissed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [highlight, setHighlight] = useState(false);
  const [initiallyComplete, setInitiallyComplete] = useState<boolean | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const toastShownRef = useRef(false);

  // Check if already permanently complete
  useEffect(() => {
    if (!userId) return;
    const check = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("setup_checklist_complete")
        .eq("user_id", userId)
        .single();
      const complete = (data as any)?.setup_checklist_complete === true;
      setInitiallyComplete(complete);
      if (complete) setDismissed(true);
    };
    check();
  }, [userId]);

  useEffect(() => {
    if (searchParams.get("setup") === "1") {
      setHighlight(true);
      searchParams.delete("setup");
      setSearchParams(searchParams, { replace: true });
      cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      const t = setTimeout(() => setHighlight(false), 3000);
      return () => clearTimeout(t);
    }
  }, [searchParams, setSearchParams]);

  const steps = [
    { key: "property", label: "Immobilie anlegen", icon: Building2, done: hasProperties, action: () => navigate("/properties") },
    { key: "tenant", label: "Mieter einladen", icon: Users, done: hasTenants, action: "dialog" as const },
    { key: "payment", label: "Mietbetrag eintragen", icon: CreditCard, done: hasPayments, action: () => navigate("/payments") },
    { key: "document", label: "Mietvertrag hochladen", icon: FileText, done: hasMietvertrag, action: () => navigate("/documents") },
  ];

  const completedCount = steps.filter(s => s.done).length;
  const allDone = completedCount === 4;
  const progressValue = (completedCount / 4) * 100;

  // When all done → show confetti, persist, toast
  useEffect(() => {
    if (allDone && !dismissed && initiallyComplete === false && !toastShownRef.current) {
      toastShownRef.current = true;
      setShowConfetti(true);
      toast.success(
        sal(salutation,
          "Ihr Konto ist vollständig eingerichtet. Willkommen bei Dwello!",
          "Dein Konto ist vollständig eingerichtet. Willkommen bei Dwello!"
        )
      );
      // Persist to DB
      if (userId) {
        supabase.from("profiles").update({ setup_checklist_complete: true } as any).eq("user_id", userId).then();
      }
      const timer = setTimeout(() => {
        setDismissed(true);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [allDone, dismissed, initiallyComplete, salutation, userId]);

  // Still loading initial state
  if (initiallyComplete === null) return null;
  if (dismissed && !showConfetti) return null;

  if (showConfetti) {
    return (
      <div className="bg-card rounded-2xl border p-8 text-center space-y-3 animate-fade-in">
        <div className="flex justify-center">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <PartyPopper className="h-7 w-7 text-primary" />
          </div>
        </div>
        <p className="text-lg font-heading font-bold text-foreground">
          {sal(salutation, "🎉 Ihr Konto ist vollständig eingerichtet!", "🎉 Dein Konto ist vollständig eingerichtet!")}
        </p>
        <p className="text-sm text-muted-foreground">
          {sal(salutation, "Sie können jetzt alle Funktionen von Dwello nutzen.", "Du kannst jetzt alle Funktionen von Dwello nutzen.")}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      className={`bg-card rounded-2xl border p-6 space-y-5 transition-shadow duration-700 ${highlight ? "ring-2 ring-primary/40 shadow-lg animate-pulse" : ""}`}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-heading font-semibold text-foreground">{sal(salutation, "Ihr Profil vervollständigen", "Dein Profil vervollständigen")}</h3>
          <span className="text-xs text-muted-foreground font-medium">{completedCount} von 4 erledigt</span>
        </div>
        <p className="text-sm text-muted-foreground">{sal(salutation, "Schließen Sie die Einrichtung ab, um alle Funktionen nutzen zu können.", "Schließe die Einrichtung ab, um alle Funktionen nutzen zu können.")}</p>
        <Progress value={progressValue} className="h-2 bg-muted" />
      </div>

      <div className="space-y-1">
        {steps.map((step) => {
          const Icon = step.icon;

          const content = (
            <div
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                step.done
                  ? "opacity-60"
                  : "hover:bg-muted/50 cursor-pointer"
              }`}
            >
              <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                step.done ? "bg-primary/10" : "border-2 border-muted-foreground/20"
              }`}>
                {step.done ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className={`text-sm font-medium ${
                  step.done ? "line-through text-muted-foreground" : "text-foreground"
                }`}>
                  {step.label}
                </span>
                {step.key === "document" && !step.done && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {sal(salutation,
                      "Laden Sie den Mietvertrag hoch, um die Einrichtung abzuschließen.",
                      "Lade den Mietvertrag hoch, um die Einrichtung abzuschließen."
                    )}
                  </p>
                )}
              </div>
              {!step.done && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </div>
          );

          if (step.done) return <div key={step.key}>{content}</div>;

          if (step.action === "dialog") {
            return (
              <InviteTenantDialog key={step.key} trigger={content} />
            );
          }

          return (
            <div key={step.key} onClick={step.action as () => void}>
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SetupChecklist;
