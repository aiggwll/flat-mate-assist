import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/UserContext";
import { toast } from "sonner";
import { format, isBefore, parse } from "date-fns";
import { de } from "date-fns/locale";
import { Plus, Check, Clock, AlertTriangle, CreditCard, Euro, MoreVertical, Undo2, Trash2, Pencil, CalendarIcon, Info } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { sal } from "@/lib/salutation";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { z } from "zod";

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

const defaultDueDate = format(new Date(), "yyyy-MM-dd");
const firstOfMonth = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd");

const rentSchema = z.object({
  unit_id: z.string().min(1, "Bitte Immobilie & Wohnung auswählen"),
  tenant_name: z.string().trim().min(1, "Mietername ist erforderlich"),
  due_date: z.string().min(1, "Fälligkeitsdatum ist erforderlich"),
  cold_rent: z.string().refine(v => !isNaN(parseFloat(v)) && parseFloat(v) > 0, "Kaltmiete muss eine positive Zahl sein"),
  nebenkosten: z.string().refine(v => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, "Nebenkosten dürfen nicht negativ sein"),
});

const RentTrackingPage = () => {
  const { user, userProperties, salutation } = useUser();
  const [payments, setPayments] = useState<RentPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ unit_id: "", tenant_name: "", due_date: defaultDueDate, cold_rent: "", nebenkosten: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [attempted, setAttempted] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [autoFillHint, setAutoFillHint] = useState<string | null>(null);

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

  const handleUnitSelected = useCallback(async (unitId: string) => {
    setForm(f => ({ ...f, unit_id: unitId }));
    setAutoFillHint(null);
    if (!unitId) return;

    const [{ data: tenantProfiles }, { data: lastPayment }] = await Promise.all([
      supabase.from("profiles").select("name").eq("role", "tenant").eq("unit_id", unitId).limit(1),
      supabase.from("rent_payments").select("cold_rent, nebenkosten, tenant_name").eq("unit_id", unitId).order("due_date", { ascending: false }).limit(1),
    ]);

    const tenant = tenantProfiles?.[0];
    const prev = lastPayment?.[0];

    if (!tenant && !prev) {
      setAutoFillHint("Für diese Immobilie sind noch keine Mietdaten hinterlegt.");
      setForm(f => ({ ...f, due_date: firstOfMonth }));
      return;
    }

    setForm(f => ({
      ...f,
      tenant_name: f.tenant_name || (prev?.tenant_name || tenant?.name || ""),
      cold_rent: f.cold_rent || (prev ? String(prev.cold_rent) : ""),
      nebenkosten: f.nebenkosten || (prev ? String(prev.nebenkosten) : ""),
      due_date: f.due_date === defaultDueDate ? firstOfMonth : f.due_date,
    }));
  }, []);

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
    const cold = parseFloat(form.cold_rent);
    const nk = parseFloat(form.nebenkosten);
    if (isNaN(cold) || cold <= 0 || isNaN(nk) || nk < 0) return 0;
    return cold + nk;
  }, [form.cold_rent, form.nebenkosten]);

  const validateForm = useCallback(() => {
    const result = rentSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(e => { fieldErrors[e.path[0] as string] = e.message; });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  }, [form]);

  useEffect(() => {
    if (attempted) validateForm();
  }, [form, attempted, validateForm]);

  const isFormValid = rentSchema.safeParse(form).success;

  const openEditDialog = (p: RentPayment) => {
    setEditingId(p.id);
    setForm({
      unit_id: p.unit_id,
      tenant_name: p.tenant_name,
      due_date: p.due_date,
      cold_rent: String(p.cold_rent),
      nebenkosten: String(p.nebenkosten),
    });
    setErrors({});
    setAttempted(false);
    setAutoFillHint(null);
    setDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingId(null);
    setForm({ unit_id: "", tenant_name: "", due_date: defaultDueDate, cold_rent: "", nebenkosten: "" });
    setErrors({});
    setAttempted(false);
    setAutoFillHint(null);
    setDialogOpen(true);
  };

  const handleSavePayment = async () => {
    setAttempted(true);
    if (!validateForm()) return;
    if (!user) return;

    const coldRent = parseFloat(form.cold_rent);
    const nebenkosten = parseFloat(form.nebenkosten);
    const warmmiete = coldRent + nebenkosten;

    if (editingId) {
      const { error } = await supabase.from("rent_payments").update({
        unit_id: form.unit_id.trim(),
        tenant_name: form.tenant_name.trim(),
        amount: warmmiete,
        cold_rent: coldRent,
        warm_rent: warmmiete,
        nebenkosten: nebenkosten,
        due_date: form.due_date,
      }).eq("id", editingId);

      if (error) {
        toast.error("Fehler beim Speichern: " + error.message);
      } else {
        toast.success("Mietzahlung aktualisiert!");
        setDialogOpen(false);
        setEditingId(null);
        loadPayments();
      }
    } else {
      const { error } = await supabase.from("rent_payments").insert({
        user_id: user.id,
        unit_id: form.unit_id.trim(),
        tenant_name: form.tenant_name.trim(),
        amount: warmmiete,
        cold_rent: coldRent,
        warm_rent: warmmiete,
        nebenkosten: nebenkosten,
        due_date: form.due_date,
        status: "ausstehend",
      });

      if (error) {
        toast.error("Fehler beim Anlegen: " + error.message);
      } else {
        toast.success("Mietzahlung angelegt!");
        setDialogOpen(false);
        loadPayments();
      }
    }
    setForm({ unit_id: "", tenant_name: "", due_date: defaultDueDate, cold_rent: "", nebenkosten: "" });
    setErrors({});
    setAttempted(false);
  };

  const markAsPaid = async (id: string) => {
    const payment = payments.find(p => p.id === id);
    const { error } = await supabase
      .from("rent_payments")
      .update({ status: "bezahlt", paid_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast.error("Fehler: " + error.message);
    } else {
      toast.success("Als bezahlt markiert!");
      loadPayments();

      // Send payment confirmation email to tenant
      if (payment) {
        try {
          // Find tenant profile by name match to get email
          const { data: tenantProfile } = await supabase
            .from("profiles")
            .select("email")
            .eq("name", payment.tenant_name)
            .eq("role", "tenant")
            .maybeSingle();

          if (tenantProfile?.email) {
            const dueDate = new Date(payment.due_date);
            const monat = format(dueDate, "MMMM", { locale: de });
            const jahr = dueDate.getFullYear();
            await supabase.functions.invoke("send-transactional-email", {
              body: {
                templateName: "zahlung-bestaetigung",
                recipientEmail: tenantProfile.email,
                idempotencyKey: `zahlung-bestaetigung-${id}`,
                templateData: {
                  mietObjekt: payment.unit_id,
                  zeitraum: `${monat} ${jahr}`,
                  betrag: formatCurrency(payment.cold_rent + payment.nebenkosten).replace("€", "").trim(),
                },
              },
            });
          }
        } catch (err) {
          console.error("Failed to send payment confirmation email:", err);
        }
      }
    }
  };

  const markAsOpen = async (id: string) => {
    const { error } = await supabase
      .from("rent_payments")
      .update({ status: "ausstehend", paid_at: null })
      .eq("id", id);
    if (error) {
      toast.error("Fehler: " + error.message);
    } else {
      toast.success("Status zurückgesetzt auf offen.");
      loadPayments();
    }
  };

  const deletePayment = async (id: string) => {
    const { error } = await supabase
      .from("rent_payments")
      .delete()
      .eq("id", id);
    if (error) {
      toast.error("Fehler: " + error.message);
    } else {
      toast.success("Eintrag gelöscht.");
      loadPayments();
    }
    setDeleteTarget(null);
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
        <Button onClick={openNewDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Neue Miete
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Erwartet (Warmmiete)</p>
          <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(totalExpected)}</p>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Erhalten</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Offen</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(totalOpen)}</p>
        </div>
      </div>

      {/* Payment List */}
      {loading ? (
        <p className="text-muted-foreground text-center py-8">Laden...</p>
      ) : payments.length === 0 ? (
        <EmptyState
          icon={Euro}
          headline="Noch keine Mietzahlungen erfasst"
          subtext={sal(salutation || "sie",
            "Tragen Sie Ihre erste Miete ein und behalten Sie jeden Monat den Überblick.",
            "Trag deine erste Miete ein und behalte jeden Monat den Überblick."
          )}
          buttonLabel="Erste Miete eintragen"
          onAction={openNewDialog}
        />
      ) : (
        <div className="space-y-3">
          {payments.map((p) => {
            const statusInfo = getStatusInfo(p.paid_at, p.due_date);
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
                    {p.unit_id} · Kalt: {formatCurrency(p.cold_rent)} + NK: {formatCurrency(p.nebenkosten)} = {formatCurrency(warmmiete)} gesamt
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Fällig: {format(new Date(p.due_date), "dd. MMM yyyy", { locale: de })}
                    {p.paid_at && ` · Bezahlt am: ${format(new Date(p.paid_at), "dd. MMM yyyy", { locale: de })}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-foreground whitespace-nowrap">
                    {formatCurrency(warmmiete)}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {p.paid_at ? (
                        <DropdownMenuItem onClick={() => markAsOpen(p.id)}>
                          <Undo2 className="h-4 w-4 mr-2" />
                          Als offen markieren
                        </DropdownMenuItem>
                      ) : (
                        <>
                          <DropdownMenuItem onClick={() => openEditDialog(p)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Bearbeiten
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => markAsPaid(p.id)}>
                            <Check className="h-4 w-4 mr-2" />
                            Als bezahlt markieren
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuItem onClick={() => setDeleteTarget(p.id)} className="text-destructive focus:text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eintrag löschen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
            <DialogTitle>{editingId ? "Mietzahlung bearbeiten" : "Neue Mietzahlung anlegen"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Immobilie & Wohnung *</Label>
              <Select value={form.unit_id} onValueChange={(val) => editingId ? setForm(f => ({ ...f, unit_id: val })) : handleUnitSelected(val)}>
                <SelectTrigger className={errors.unit_id ? "border-destructive" : ""}>
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
              {errors.unit_id && <p className="text-xs text-destructive mt-1">{errors.unit_id}</p>}
              {autoFillHint && (
                <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                  <Info className="h-3 w-3 shrink-0" />
                  {autoFillHint}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="mietername">Mietername *</Label>
              <Input id="mietername" name="mietername" aria-required="true" className={errors.tenant_name ? "border-destructive" : ""} placeholder="Max Mustermann" value={form.tenant_name} onChange={e => setForm(f => ({ ...f, tenant_name: e.target.value }))} />
              {errors.tenant_name && <p className="text-xs text-destructive mt-1">{errors.tenant_name}</p>}
            </div>
            <div>
              <Label>Fälligkeitsdatum *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !form.due_date && "text-muted-foreground",
                      errors.due_date && "border-destructive"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.due_date
                      ? format(new Date(form.due_date), "dd. MMMM yyyy", { locale: de })
                      : "Datum wählen"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.due_date ? new Date(form.due_date) : undefined}
                    onSelect={(date) => {
                      if (date) setForm(f => ({ ...f, due_date: format(date, "yyyy-MM-dd") }));
                    }}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              {errors.due_date && <p className="text-xs text-destructive mt-1">{errors.due_date}</p>}
            </div>
            <div>
              <Label htmlFor="kaltmiete">Kaltmiete (€) *</Label>
              <Input id="kaltmiete" name="kaltmiete" aria-required="true" className={errors.cold_rent ? "border-destructive" : ""} type="number" min="0.01" step="0.01" placeholder="z.B. 850" value={form.cold_rent} onChange={e => setForm(f => ({ ...f, cold_rent: e.target.value }))} />
              {errors.cold_rent && <p className="text-xs text-destructive mt-1">{errors.cold_rent}</p>}
            </div>
            <div>
              <Label htmlFor="nebenkosten">Nebenkosten / Vorauszahlung (€) *</Label>
              <Input id="nebenkosten" name="nebenkosten" aria-required="true" className={errors.nebenkosten ? "border-destructive" : ""} type="number" min="0" step="0.01" placeholder="z.B. 150" value={form.nebenkosten} onChange={e => setForm(f => ({ ...f, nebenkosten: e.target.value }))} />
              {errors.nebenkosten && <p className="text-xs text-destructive mt-1">{errors.nebenkosten}</p>}
              <p className="text-xs text-muted-foreground mt-1">Wenn keine Nebenkosten vereinbart: 0 eingeben</p>
            </div>
            <div>
              <Label>Warmmiete (Gesamt)</Label>
              <div className="h-9 px-3 flex items-center rounded-md border bg-muted/50 text-sm font-medium text-foreground">
                {computedWarmmiete > 0 ? `${formatCurrency(computedWarmmiete)}` : "—"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Kaltmiete + Nebenkosten (automatisch berechnet)</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); setEditingId(null); setErrors({}); setAttempted(false); }}>Abbrechen</Button>
            <Button onClick={handleSavePayment} disabled={attempted && !isFormValid}>{editingId ? "Speichern" : "Anlegen"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eintrag wirklich löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Der Mietzahlungseintrag wird dauerhaft entfernt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTarget && deletePayment(deleteTarget)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RentTrackingPage;
