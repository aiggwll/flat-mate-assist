import { payments } from "@/lib/dummy-data";
import { CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";

const PaymentsPage = () => {
  const [paymentState, setPaymentState] = useState(payments.map(p => ({ ...p })));

  const markAsPaid = (id: string) => {
    setPaymentState(prev => prev.map(p => p.id === id ? { ...p, paid: true } : p));
  };

  const totalExpected = paymentState.reduce((s, p) => s + p.amount, 0);
  const totalReceived = paymentState.filter(p => p.paid).reduce((s, p) => s + p.amount, 0);
  const openCount = paymentState.filter(p => !p.paid).length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl md:text-2xl font-heading font-bold text-foreground">Zahlungen</h1>
        <p className="text-muted-foreground text-sm mt-0.5">März 2026</p>
      </div>

      {/* Summary Cards - mobile optimized */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card rounded-xl border p-3 md:p-4">
          <p className="text-[11px] text-muted-foreground">Erwartet</p>
          <p className="text-base md:text-lg font-bold text-foreground mt-0.5">{formatCurrency(totalExpected)}</p>
        </div>
        <div className="bg-card rounded-xl border p-3 md:p-4">
          <p className="text-[11px] text-muted-foreground">Erhalten</p>
          <p className="text-base md:text-lg font-bold text-accent mt-0.5">{formatCurrency(totalReceived)}</p>
        </div>
        <div className="bg-card rounded-xl border p-3 md:p-4">
          <p className="text-[11px] text-muted-foreground">Offen</p>
          <p className="text-base md:text-lg font-bold text-destructive mt-0.5">{openCount}</p>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-card rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Mieter</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Immobilie</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Betrag</th>
              <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Aktion</th>
            </tr>
          </thead>
          <tbody>
            {paymentState.map(p => (
              <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-5 py-3.5 text-sm font-medium text-foreground">{p.tenantName}</td>
                <td className="px-5 py-3.5 text-sm text-muted-foreground">{p.propertyAddress} · {p.unitNumber}</td>
                <td className="px-5 py-3.5 text-sm font-medium text-foreground text-right">{formatCurrency(p.amount)}</td>
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

      {/* Mobile Card List */}
      <div className="md:hidden space-y-2.5">
        {paymentState.map(p => (
          <div key={p.id} className="bg-card rounded-xl border p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">{p.tenantName}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{p.propertyAddress} · {p.unitNumber}</p>
              </div>
              <div className="text-right ml-3">
                <p className="text-sm font-bold text-foreground">{formatCurrency(p.amount)}</p>
                {p.paid ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-accent mt-0.5">
                    <CheckCircle2 className="h-3 w-3" />
                    Bezahlt
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-destructive mt-0.5">
                    <Clock className="h-3 w-3" />
                    Offen
                  </span>
                )}
              </div>
            </div>
            {!p.paid && (
              <Button variant="outline" size="sm" className="w-full mt-3 h-8 text-xs" onClick={() => markAsPaid(p.id)}>
                Als bezahlt markieren
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaymentsPage;
