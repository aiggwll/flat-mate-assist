import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import DwelloLogo from "@/components/DwelloLogo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

type Status = "loading" | "valid" | "already" | "invalid" | "success" | "error";

const UnsubscribePage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }

    const validate = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${token}`,
          { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } }
        );
        const data = await res.json();
        if (!res.ok) { setStatus("invalid"); return; }
        if (data.valid === false && data.reason === "already_unsubscribed") { setStatus("already"); return; }
        setStatus("valid");
      } catch { setStatus("error"); }
    };
    validate();
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!token) return;
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) { setStatus("error"); return; }
      if (data?.success) { setStatus("success"); }
      else if (data?.reason === "already_unsubscribed") { setStatus("already"); }
      else { setStatus("error"); }
    } catch { setStatus("error"); }
    finally { setProcessing(false); }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <DwelloLogo variant="light" size="lg" />

        {status === "loading" && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Wird überprüft…</p>
          </div>
        )}

        {status === "valid" && (
          <div className="space-y-4">
            <p className="text-foreground">Möchten Sie sich von E-Mail-Benachrichtigungen abmelden?</p>
            <Button onClick={handleUnsubscribe} disabled={processing} className="w-full">
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Abmelden bestätigen
            </Button>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-3">
            <CheckCircle2 className="h-10 w-10 text-primary" />
            <p className="text-foreground font-medium">Erfolgreich abgemeldet</p>
            <p className="text-sm text-muted-foreground">Sie erhalten keine weiteren E-Mail-Benachrichtigungen.</p>
          </div>
        )}

        {status === "already" && (
          <div className="flex flex-col items-center gap-3">
            <CheckCircle2 className="h-10 w-10 text-muted-foreground" />
            <p className="text-foreground font-medium">Bereits abgemeldet</p>
            <p className="text-sm text-muted-foreground">Sie sind bereits von E-Mail-Benachrichtigungen abgemeldet.</p>
          </div>
        )}

        {status === "invalid" && (
          <div className="flex flex-col items-center gap-3">
            <XCircle className="h-10 w-10 text-destructive" />
            <p className="text-foreground font-medium">Ungültiger Link</p>
            <p className="text-sm text-muted-foreground">Dieser Abmelde-Link ist ungültig oder abgelaufen.</p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-3">
            <XCircle className="h-10 w-10 text-destructive" />
            <p className="text-foreground font-medium">Fehler</p>
            <p className="text-sm text-muted-foreground">Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnsubscribePage;
