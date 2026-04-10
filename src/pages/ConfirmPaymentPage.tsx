import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Check, Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import DwelloLogo from "@/components/DwelloLogo";

const ConfirmPaymentPage = () => {
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get("id");
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [payment, setPayment] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPayment = async () => {
      if (!paymentId) {
        setError("Kein Zahlungs-Link gefunden.");
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("rent_payments")
        .select("id, tenant_name, unit_id, cold_rent, nebenkosten, due_date, status, paid_at")
        .eq("id", paymentId)
        .maybeSingle();

      if (fetchError || !data) {
        setError("Zahlung nicht gefunden.");
      } else if (data.paid_at || data.status === "bezahlt") {
        setConfirmed(true);
        setPayment(data);
      } else if (data.status === "überwiesen") {
        setConfirmed(true);
        setPayment(data);
      } else {
        setPayment(data);
      }
      setLoading(false);
    };
    loadPayment();
  }, [paymentId]);

  const handleConfirm = async () => {
    if (!paymentId) return;
    setConfirming(true);
    try {
      const { error: invokeError } = await supabase.functions.invoke("confirm-payment", {
        body: { paymentId },
      });
      if (invokeError) throw invokeError;
      setConfirmed(true);
      toast.success("Zahlung als überwiesen markiert.");
    } catch (err) {
      console.error(err);
      toast.error("Fehler beim Bestätigen. Bitte versuche es erneut.");
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <DwelloLogo />
          <p className="mt-4 text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const warmmiete = (payment?.cold_rent || 0) + (payment?.nebenkosten || 0);
  const formattedAmount = warmmiete.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
  const dueDate = payment?.due_date ? new Date(payment.due_date).toLocaleDateString("de-DE") : "";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <DwelloLogo />
        </div>

        <div className="bg-card rounded-xl border p-6 space-y-4">
          {confirmed ? (
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
                <Check className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                {payment?.status === "bezahlt" ? "Zahlung bestätigt" : "Als überwiesen markiert"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {payment?.status === "bezahlt"
                  ? "Diese Zahlung wurde bereits vom Vermieter bestätigt."
                  : "Ihr Vermieter wird benachrichtigt und die Zahlung prüfen."}
              </p>
            </div>
          ) : (
            <>
              <div className="text-center">
                <CreditCard className="h-8 w-8 text-primary mx-auto mb-2" />
                <h2 className="text-lg font-semibold text-foreground">Zahlung bestätigen</h2>
              </div>

              <div className="space-y-2 rounded-lg bg-muted p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mieter</span>
                  <span className="font-medium">{payment?.tenant_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Objekt</span>
                  <span className="font-medium">{payment?.unit_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fällig am</span>
                  <span className="font-medium">{dueDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Betrag</span>
                  <span className="font-bold text-foreground">{formattedAmount}</span>
                </div>
              </div>

              <Button onClick={handleConfirm} disabled={confirming} className="w-full gap-2">
                {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Ich habe überwiesen
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Ihr Vermieter wird über die Überweisung informiert und bestätigt den Eingang.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfirmPaymentPage;
