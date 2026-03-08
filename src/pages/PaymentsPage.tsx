import { payments } from "@/lib/dummy-data";
import { CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const PaymentsPage = () => {
  const [paymentState, setPaymentState] = useState(payments.map(p => ({ ...p })));

  const markAsPaid = (id: string) => {
    setPaymentState(prev => prev.map(p => p.id === id ? { ...p, paid: true } : p));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Zahlungen</h1>
        <p className="text-muted-foreground text-sm mt-1">Mieteingang für März 2026</p>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Mieter</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Immobilie</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Wohnung</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Betrag</th>
              <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Aktion</th>
            </tr>
          </thead>
          <tbody>
            {paymentState.map(p => (
              <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-5 py-3.5 text-sm font-medium text-foreground">{p.tenantName}</td>
                <td className="px-5 py-3.5 text-sm text-muted-foreground">{p.propertyAddress}</td>
                <td className="px-5 py-3.5 text-sm text-muted-foreground">{p.unitNumber}</td>
                <td className="px-5 py-3.5 text-sm font-medium text-foreground text-right">{p.amount.toLocaleString("de-DE")} €</td>
                <td className="px-5 py-3.5 text-center">
                  {p.paid ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-accent">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Bezahlt
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
                      <Clock className="h-3.5 w-3.5" />
                      Ausstehend
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-right">
                  {!p.paid && (
                    <Button variant="outline" size="sm" onClick={() => markAsPaid(p.id)}>
                      Als bezahlt markieren
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaymentsPage;
