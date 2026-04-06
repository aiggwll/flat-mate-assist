import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/UserContext";
import { toast } from "sonner";
import { format, isBefore, startOfMonth } from "date-fns";
import { de } from "date-fns/locale";
import { Plus, Check, Clock, AlertTriangle, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface RentPayment {
  id: string;
  unit_id: string;
  tenant_name: string;
  amount: number;
  cold_rent: number;
  nebenkosten: number;
  due_date: string;
  paid_at: string | null;
  status: string;
  created_at: string;
}

const getStatusInfo = (paidAt: string | null, dueDate: string) => {
  if (paidAt) {
    return { label: "Bezahlt", color: "text-green-600 bg-green-50 border-green-200", icon: Check };
  }
  const due = new Date(dueDate);
  const now = new Date();
  if (isBefore(due, now)) {
    return { label: "Überfällig", color: "text-red-600 bg-red-50 border-red-200", icon: AlertTriangle };
  }
  return { label: "Ausstehend", color: "text-yellow-600 bg-yellow-50 border-yellow-200", icon: Clock };
};

const RentTrackingPage = () => {
  const { user, userProperties } = useUser();
  const [payments, setPayments] = useState<RentPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ unit_id: "", tenant_name: "", cold_rent: "", nebenkosten: "" });

  const unitOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [];
    userProperties.forEach((prop) => {
      const unitCount = prop.units || 1;
      for (let i = 1; i <= unitCount; i++) {
        options.push({
          value: `${prop.address}-WE${String(i).padStart(2, "0")}`,
          label: `${prop.address} – Whg. ${i}`,
        });
      }
    });
    return options;
  }, [userProperties]);

  const loadPayments = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("rent_payments")
      .select("*")
      .order("due_date", { ascending: false });
    if (error) {
      console.error(error);
    } else {
      setPayments(
        (data || []).map((d: any) => ({
          id: d.id,
          unit_id: d.unit_id,
          tenant_name: d.tenant_name,
          amount: Number(d.amount),
          cold_rent: Number(d.cold_rent || 0),
          nebenkosten: Number(d.nebenkosten || 0),
          due_date: d.due_date,
          paid_at: d.paid_at,
          status: d.status,
          created_at: d.created_at,
        }))
      );
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const computedWarmmiete = useMemo(() => {
    const cold = parseFloat(form.cold_rent) || 0;
    const nk = parseFloat(form.nebenkosten) || 0;
    return cold + nk;
  }, [form.cold_rent, form.nebenkosten]);

  const handleAddPayment = async () => {
    if (!form.unit_id || !form.tenant_name || !form.cold_rent || !form.nebenkosten) {
      toast.error("Bitte alle Felder ausfüllen.");
      return;
    }
    if (!user) return;

    const dueDate = format(startOfMonth(new Date()), "yyyy-MM-dd");
    const coldRent = parseFloat(form.cold_rent);
    const nebenkosten = parseFloat(form.nebenkosten);
    const warmmiete = coldRent + nebenkosten;

    const { error } = await supabase.from("rent_payments").insert({
      user_id: user.id,
      unit_id: form.unit_id.trim(),
      tenant_name: form.tenant_name.trim(),
      amount: warmmiete,
      cold_rent: coldRent,
      warm_rent: warmmiete,
      nebenkosten: nebenkosten,
      due_date: dueDate,
      status: "ausstehend",
    });

    if (error) {
      toast.error("Fehler beim Anlegen: " + error.message);
    } else {
      toast.success("Mietzahlung angelegt!");
      setForm({ unit_id: "", tenant_name: "", cold_rent: "", nebenkosten: "" });
      setDialogOpen(false);
      loadPayments();
    }
  };

  const markAsPaid = async (id: string) => {
    const { error } = await supabase
      .from("rent_payments")
      .update({ status: "bezahlt", paid_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast.error("Fehler: " + error.message);
    } else {
      toast.success("Als bezahlt markiert!");
      loadPayments();
    }
  };

  const totalExpected = payments.reduce((s, p) => s + (p.cold_rent + p.nebenkosten), 0);
  const totalPaid = payments.filter(p => p.paid_at !== null).reduce((s, p) => s + (p.cold_rent + p.nebenkosten), 0);
  const totalOpen = totalExpected - totalPaid;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Mietübersicht</h1>
          <p className="text-muted-foreground text-sm mt-1">{payments.length} Einträge</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Neue Miete
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Erwartet (Warmmiete)</p>
          <p className="text-2xl font-bold text-foreground mt-1">{totalExpected.toLocaleString("de-DE")} €</p>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Erhalten</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{totalPaid.toLocaleString("de-DE")} €</p>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Offen</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{totalOpen.toLocaleString("de-DE")} €</p>
        </div>
      </div>

      {/* Payment List */}
      {loading ? (
        <p className="text-muted-foreground text-center py-8">Laden...</p>
      ) : payments.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>Noch keine Mieteinträge vorhanden.</p>
          <p className="text-sm mt-1">Klicke auf "Neue Miete" um einen Eintrag anzulegen.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => {
            const statusInfo = getStatusInfo(p.status, p.due_date);
            const StatusIcon = statusInfo.icon;
            const warmmiete = p.cold_rent + p.nebenkosten;
            return (
              <div
                key={p.id}
                className="bg-card rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground truncate">{p.tenant_name}</h3>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${statusInfo.color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {statusInfo.label}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {p.unit_id} · Kalt: {p.cold_rent.toLocaleString("de-DE")} € + NK: {p.nebenkosten.toLocaleString("de-DE")} € = {warmmiete.toLocaleString("de-DE")} € gesamt
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Fällig: {format(new Date(p.due_date), "dd. MMM yyyy", { locale: de })}
                    {p.paid_at && ` · Bezahlt am: ${format(new Date(p.paid_at), "dd. MMM yyyy", { locale: de })}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-foreground whitespace-nowrap">
                    {warmmiete.toLocaleString("de-DE")} €
                  </span>
                  {p.status !== "bezahlt" && (
                    <Button size="sm" variant="outline" onClick={() => markAsPaid(p.id)}>
                      <Check className="h-4 w-4 mr-1" />
                      Bezahlt
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Neue Mietzahlung anlegen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Immobilie & Wohnung</Label>
              <Select value={form.unit_id} onValueChange={(val) => setForm(f => ({ ...f, unit_id: val }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Wohnung auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {unitOptions.length === 0 ? (
                    <SelectItem value="_none" disabled>Keine Immobilien vorhanden</SelectItem>
                  ) : (
                    unitOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Mietername</Label>
              <Input placeholder="Max Mustermann" value={form.tenant_name} onChange={e => setForm(f => ({ ...f, tenant_name: e.target.value }))} />
            </div>
            <div>
              <Label>Kaltmiete (€)</Label>
              <Input type="number" placeholder="z.B. 850" value={form.cold_rent} onChange={e => setForm(f => ({ ...f, cold_rent: e.target.value }))} />
            </div>
            <div>
              <Label>Nebenkosten / Vorauszahlung (€)</Label>
              <Input type="number" placeholder="z.B. 150" value={form.nebenkosten} onChange={e => setForm(f => ({ ...f, nebenkosten: e.target.value }))} />
            </div>
            <div>
              <Label>Warmmiete (Gesamt)</Label>
              <div className="h-9 px-3 flex items-center rounded-md border bg-muted/50 text-sm font-medium text-foreground">
                {computedWarmmiete > 0 ? `${computedWarmmiete.toLocaleString("de-DE")} €` : "—"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Kaltmiete + Nebenkosten (automatisch berechnet)</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={handleAddPayment}>Anlegen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RentTrackingPage;
