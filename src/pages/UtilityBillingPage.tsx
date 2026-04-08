import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Info, Receipt, Calculator, Download } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { sal } from "@/lib/salutation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

const CATEGORIES = [
  { key: "grundsteuer", label: "Grundsteuer", info: "Grundsteuer wird nach dem Verhältnis der Wohnfläche auf die Mieter umgelegt." },
  { key: "wasser", label: "Wasserversorgung & Entwässerung", info: "Kosten für Frischwasser, Abwasser und Niederschlagswasser — Verteilung nach Verbrauch oder Wohnfläche." },
  { key: "heizung", label: "Heizkosten", info: "Heizkosten werden zu 50–70 % nach Verbrauch und 30–50 % nach Wohnfläche umgelegt (§ 7 HeizKV)." },
  { key: "warmwasser", label: "Warmwasser", info: "Kosten für die Warmwasserbereitung — Verteilung analog zu Heizkosten nach HeizKV." },
  { key: "muell", label: "Müllbeseitigung", info: "Gebühren für Müllabfuhr und Entsorgung — häufig pro Wohneinheit oder nach Personenzahl." },
  { key: "versicherung", label: "Gebäudeversicherung", info: "Sach- und Haftpflichtversicherung des Gebäudes — Umlage nach Wohnfläche üblich." },
  { key: "hausmeister", label: "Hausmeister", info: "Vergütung für Hausmeisterdienste — Umlage nach Wohneinheit oder Wohnfläche." },
  { key: "garten", label: "Gartenpflege", info: "Pflege von Außenanlagen, Rasen, Hecken — gleichmäßig auf alle Mieter verteilt." },
  { key: "beleuchtung", label: "Beleuchtung (Gemeinschaftsflächen)", info: "Strom für Treppenhaus, Keller, Außenbeleuchtung — pro Wohneinheit oder Wohnfläche." },
  { key: "sonstige", label: "Sonstige Betriebskosten", info: "Weitere umlagefähige Betriebskosten nach § 2 BetrKV." },
];

interface CostEntry {
  category: string;
  amount: string;
  perSqm: boolean;
}

interface TenantRow {
  tenantId: string;
  tenantName: string;
  unitId: string;
  sqm: string;
  monthlyAdvance: string;
}

const currentYear = new Date().getFullYear();

const UtilityBillingPage = () => {
  const { userProperties, userId, salutation } = useUser();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [costs, setCosts] = useState<CostEntry[]>(
    CATEGORIES.map(c => ({ category: c.key, amount: "", perSqm: false }))
  );
  const [tenantRows, setTenantRows] = useState<TenantRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [finalized, setFinalized] = useState(false);
  const [existingPeriodId, setExistingPeriodId] = useState<string | null>(null);

  // Auto-select first property
  useEffect(() => {
    if (userProperties.length > 0 && !selectedPropertyId) {
      setSelectedPropertyId(userProperties[0].id);
    }
  }, [userProperties, selectedPropertyId]);

  // Load tenants for selected property
  useEffect(() => {
    if (!selectedPropertyId) return;
    const loadTenants = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, name, unit_id")
        .eq("property_id", selectedPropertyId)
        .eq("role", "tenant");
      if (data && data.length > 0) {
        setTenantRows(data.map(t => ({
          tenantId: t.user_id,
          tenantName: t.name || "Mieter",
          unitId: t.unit_id || "",
          sqm: "",
          monthlyAdvance: "",
        })));
      } else {
        setTenantRows([]);
      }
    };
    loadTenants();
  }, [selectedPropertyId]);

  // Check for existing period
  useEffect(() => {
    if (!selectedPropertyId || !selectedYear) return;
    const check = async () => {
      const { data } = await supabase
        .from("utility_periods")
        .select("id, status")
        .eq("property_id", selectedPropertyId)
        .eq("year", parseInt(selectedYear))
        .maybeSingle();
      if (data) {
        setExistingPeriodId(data.id);
        setFinalized(data.status === "finalized");
        // Load existing costs
        const { data: costsData } = await supabase
          .from("utility_costs")
          .select("*")
          .eq("period_id", data.id);
        if (costsData) {
          setCosts(CATEGORIES.map(c => {
            const existing = costsData.find(cd => cd.category === c.key);
            return {
              category: c.key,
              amount: existing ? String(existing.total_amount) : "",
              perSqm: existing ? existing.distribution_key === "per_sqm" : false,
            };
          }));
        }
        // Load existing results
        const { data: resultsData } = await supabase
          .from("utility_results")
          .select("*")
          .eq("period_id", data.id);
        if (resultsData && resultsData.length > 0) {
          setTenantRows(resultsData.map(r => ({
            tenantId: r.tenant_id,
            tenantName: r.tenant_name,
            unitId: r.unit_id,
            sqm: String(r.sqm),
            monthlyAdvance: r.advance_paid ? String(Math.round(r.advance_paid / 12)) : "",
          })));
        }
      } else {
        setExistingPeriodId(null);
        setFinalized(false);
        setCosts(CATEGORIES.map(c => ({ category: c.key, amount: "", perSqm: false })));
      }
    };
    check();
  }, [selectedPropertyId, selectedYear]);

  const totalCosts = useMemo(() => {
    return costs.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
  }, [costs]);

  const totalUnits = tenantRows.length;
  const totalSqm = tenantRows.reduce((s, t) => s + (parseFloat(t.sqm) || 0), 0);

  const tenantResults = useMemo(() => {
    return tenantRows.map(t => {
      const sqm = parseFloat(t.sqm) || 0;
      let allocated = 0;
      costs.forEach(c => {
        const amount = parseFloat(c.amount) || 0;
        if (c.perSqm && totalSqm > 0) {
          allocated += (sqm / totalSqm) * amount;
        } else if (!c.perSqm && totalUnits > 0) {
          allocated += amount / totalUnits;
        }
      });
      const advancePaid = (parseFloat(t.monthlyAdvance) || 0) * 12;
      const balance = advancePaid - allocated;
      return { ...t, allocated: Math.round(allocated * 100) / 100, advancePaid, balance: Math.round(balance * 100) / 100 };
    });
  }, [tenantRows, costs, totalSqm, totalUnits]);

  const totalAdvance = tenantResults.reduce((s, t) => s + t.advancePaid, 0);

  const updateCost = (idx: number, field: "amount" | "perSqm", value: string | boolean) => {
    setCosts(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  };

  const updateTenant = (idx: number, field: keyof TenantRow, value: string) => {
    setTenantRows(prev => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t));
  };

  const handleFinalize = async () => {
    if (!selectedPropertyId) return;
    setSaving(true);
    try {
      let periodId = existingPeriodId;

      if (!periodId) {
        const { data, error } = await supabase
          .from("utility_periods")
          .insert({ property_id: selectedPropertyId, year: parseInt(selectedYear), status: "finalized" })
          .select("id")
          .single();
        if (error) throw error;
        periodId = data.id;
      } else {
        await supabase.from("utility_periods").update({ status: "finalized" }).eq("id", periodId);
        await supabase.from("utility_costs").delete().eq("period_id", periodId);
        await supabase.from("utility_results").delete().eq("period_id", periodId);
      }

      const costRows = costs
        .filter(c => parseFloat(c.amount) > 0)
        .map(c => ({
          period_id: periodId!,
          category: c.category,
          total_amount: parseFloat(c.amount),
          distribution_key: c.perSqm ? "per_sqm" : "per_unit",
        }));
      if (costRows.length > 0) {
        const { error } = await supabase.from("utility_costs").insert(costRows);
        if (error) throw error;
      }

      const resultRows = tenantResults.map(t => ({
        period_id: periodId!,
        tenant_id: t.tenantId,
        tenant_name: t.tenantName,
        unit_id: t.unitId,
        sqm: parseFloat(t.sqm) || 0,
        advance_paid: t.advancePaid,
        allocated_costs: t.allocated,
        balance: t.balance,
      }));
      if (resultRows.length > 0) {
        const { error } = await supabase.from("utility_results").insert(resultRows);
        if (error) throw error;
      }

      setFinalized(true);
      setExistingPeriodId(periodId);
      toast.success(`Abrechnung für ${selectedYear} wurde gespeichert.`);
    } catch (e: any) {
      console.error("Finalize error:", e);
      toast.error("Fehler beim Speichern: " + (e.message || "Unbekannter Fehler"));
    } finally {
      setSaving(false);
    }
  };

  const handleNewBilling = () => {
    setFinalized(false);
    setExistingPeriodId(null);
    setCosts(CATEGORIES.map(c => ({ category: c.key, amount: "", perSqm: false })));
  };

  const selectedProperty = userProperties.find(p => p.id === selectedPropertyId);

  const handlePdfExport = useCallback(async () => {
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    let y = 20;

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Nebenkostenabrechnung", pageW / 2, y, { align: "center" });
    y += 10;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Abrechnungszeitraum: 01.01.${selectedYear} – 31.12.${selectedYear}`, pageW / 2, y, { align: "center" });
    y += 12;

    // Property info
    if (selectedProperty) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Immobilie:", 20, y);
      doc.setFont("helvetica", "normal");
      doc.text(`${selectedProperty.address}, ${selectedProperty.zipCode} ${selectedProperty.city}`, 55, y);
      y += 7;
    }

    doc.setFont("helvetica", "bold");
    doc.text("Jahr:", 20, y);
    doc.setFont("helvetica", "normal");
    doc.text(selectedYear, 55, y);
    y += 12;

    // Cost categories table
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Betriebskosten", 20, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Kategorie", 20, y);
    doc.text("Betrag", pageW - 20, y, { align: "right" });
    y += 2;
    doc.setDrawColor(200);
    doc.line(20, y, pageW - 20, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    const activeCosts = costs.filter(c => parseFloat(c.amount) > 0);
    activeCosts.forEach(c => {
      const cat = CATEGORIES.find(cat => cat.key === c.category);
      const amount = parseFloat(c.amount);
      doc.text(cat?.label || c.category, 20, y);
      doc.text(new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(amount), pageW - 20, y, { align: "right" });
      y += 6;
    });

    y += 2;
    doc.line(20, y, pageW - 20, y);
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.text("Gesamtkosten", 20, y);
    doc.text(new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(totalCosts), pageW - 20, y, { align: "right" });
    y += 12;

    // Tenant results
    if (tenantResults.length > 0) {
      doc.setFontSize(13);
      doc.text("Mieterabrechnung", 20, y);
      y += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Mieter", 20, y);
      doc.text("Wohnung", 70, y);
      doc.text("Vorauszahlung", 110, y);
      doc.text("Anteil", 145, y);
      doc.text("Saldo", pageW - 20, y, { align: "right" });
      y += 2;
      doc.line(20, y, pageW - 20, y);
      y += 5;

      doc.setFont("helvetica", "normal");
      tenantResults.forEach(t => {
        const fmt = (v: number) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(v);
        doc.text(t.tenantName, 20, y);
        doc.text(t.unitId || "–", 70, y);
        doc.text(fmt(t.advancePaid), 110, y);
        doc.text(fmt(t.allocated), 145, y);
        doc.text(fmt(t.balance), pageW - 20, y, { align: "right" });
        y += 6;
      });
    }

    // Footer
    y += 10;
    doc.setFontSize(9);
    doc.setTextColor(130);
    doc.text(`Erstellt am ${new Date().toLocaleDateString("de-DE")} mit Dwello`, pageW / 2, y, { align: "center" });

    doc.save(`Nebenkostenabrechnung_${selectedYear}.pdf`);
  }, [selectedYear, selectedProperty, costs, totalCosts, tenantResults]);

  const years = [...new Set([...Array.from({ length: 3 }, (_, i) => String(currentYear - i)), String(currentYear)])].sort((a, b) => b.localeCompare(a));

  return (
    <div className={`space-y-8 ${!finalized && selectedPropertyId ? "pb-24" : ""}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Nebenkostenabrechnung</h1>
          <p className="text-sm text-muted-foreground mt-1">Erstellen und verwalten Sie Ihre Betriebskostenabrechnungen</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Immobilie auswählen *" />
            </SelectTrigger>
            <SelectContent>
              {userProperties.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.address}, {p.city}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {finalized && (
            <Button onClick={handleNewBilling} className="rounded-xl h-11 font-semibold">
              <Plus className="h-4 w-4 mr-2" />
              Neue Abrechnung
            </Button>
          )}
        </div>
      </div>

      {finalized && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center space-y-3">
          <Receipt className="h-8 w-8 text-primary mx-auto" />
          <p className="text-lg font-heading font-bold text-foreground">Abrechnung {selectedYear} finalisiert</p>
          <p className="text-sm text-muted-foreground">Die Nebenkostenabrechnung wurde gespeichert.</p>
          <Button onClick={handlePdfExport} variant="outline" className="mt-2">
            <Download className="h-4 w-4 mr-2" />
            Als PDF herunterladen
          </Button>
        </div>
      )}

      {!selectedPropertyId && (
        <EmptyState
          icon={Calculator}
          headline={sal(salutation || "sie",
            "Erstellen Sie Ihre erste Nebenkostenabrechnung",
            "Erstelle deine erste Nebenkostenabrechnung"
          )}
          subtext="Was früher Stunden gedauert hat, erledigen Sie jetzt in Minuten."
          buttonLabel="Immobilie anlegen"
          onAction={() => window.location.href = "/properties"}
        />
      )}

      {selectedPropertyId && !finalized && (
        <>
          {/* Cost input section */}
          <div className="bg-card rounded-2xl border">
            <div className="p-5 border-b">
              <h2 className="text-base font-heading font-semibold text-foreground">Betriebskosten eingeben</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Tragen Sie die jährlichen Gesamtkosten pro Kategorie ein</p>
            </div>
            <div className="divide-y">
              {CATEGORIES.map((cat, idx) => {
                const inputId = cat.key === "wasser" ? "wasserversorgung"
                  : cat.key === "muell" ? "muellbeseitigung"
                  : cat.key === "versicherung" ? "gebaeudeversicherung"
                  : cat.key === "sonstige" ? "sonstige_betriebskosten"
                  : cat.key;
                return (
                <div key={cat.key} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <label htmlFor={inputId} className="text-sm font-medium text-foreground truncate">{cat.label}</label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-xs">
                        {cat.info}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="relative w-32">
                      <Input
                        id={inputId}
                        name={inputId}
                        aria-label={cat.label}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0,00"
                        value={costs[idx].amount}
                        onChange={e => updateCost(idx, "amount", e.target.value)}
                        className="pr-7 text-right text-sm"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">€</span>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5 w-24 cursor-help">
                          <Switch
                            checked={costs[idx].perSqm}
                            onCheckedChange={v => updateCost(idx, "perSqm", v)}
                            className="scale-75"
                          />
                          <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                            {costs[idx].perSqm ? "pro m²" : "pro Whg."}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs text-xs">
                        {costs[idx].perSqm
                          ? "Betrag wird anteilig nach Wohnfläche (m²) auf die Mieter verteilt"
                          : "Betrag wird gleichmäßig auf alle Wohneinheiten verteilt"}
                      </TooltipContent>
                    </Tooltip>
                    {costs[idx].perSqm && totalSqm > 0 && parseFloat(costs[idx].amount) > 0 && (
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        = {formatCurrency(parseFloat(costs[idx].amount) / totalSqm)}/m²
                      </span>
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          </div>

          {/* Tenant overview */}
          <div className="bg-card rounded-2xl border">
            <div className="p-5 border-b">
              <h2 className="text-base font-heading font-semibold text-foreground">Mieterübersicht</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Wohnfläche und Vorauszahlungen je Mieter</p>
            </div>
            {tenantRows.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Keine Mieter für diese Immobilie gefunden. Laden Sie zuerst Mieter ein.
              </div>
            ) : (
              <div className="divide-y">
                {tenantResults.map((t, idx) => (
                  <div key={t.tenantId} className="px-5 py-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{t.tenantName}</p>
                        <p className="text-xs text-muted-foreground">{t.unitId || "Keine Wohnung"}</p>
                      </div>
                      {t.balance !== 0 && (parseFloat(tenantRows[idx].sqm) > 0 || !costs.some(c => c.perSqm)) && (
                        <Badge variant={t.balance >= 0 ? "default" : "destructive"} className={`text-xs font-semibold ${t.balance >= 0 ? "bg-primary/10 text-primary hover:bg-primary/10" : ""}`}>
                          {t.balance >= 0 ? `Rückerstattung ${formatCurrency(t.balance)}` : `Nachzahlung ${formatCurrency(Math.abs(t.balance))}`}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="space-y-1">
                        <label htmlFor={`sqm-${t.tenantId}`} className="text-[11px] text-muted-foreground font-medium">Wohnfläche (m²)</label>
                        <Input
                          id={`sqm-${t.tenantId}`}
                          name={`sqm-${t.tenantId}`}
                          aria-label={`Wohnfläche ${t.tenantName}`}
                          type="number"
                          min="0"
                          placeholder="z.B. 65"
                          value={tenantRows[idx].sqm}
                          onChange={e => updateTenant(idx, "sqm", e.target.value)}
                          className="w-28 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor={`advance-${t.tenantId}`} className="text-[11px] text-muted-foreground font-medium">Vorauszahlung/Monat (€)</label>
                        <Input
                          id={`advance-${t.tenantId}`}
                          name={`advance-${t.tenantId}`}
                          aria-label={`Vorauszahlung ${t.tenantName}`}
                          type="number"
                          min="0"
                          placeholder="z.B. 200"
                          value={tenantRows[idx].monthlyAdvance}
                          onChange={e => updateTenant(idx, "monthlyAdvance", e.target.value)}
                          className="w-32 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] text-muted-foreground font-medium">Vorausz. gesamt</label>
                        <p className="text-sm font-medium text-foreground pt-2">{formatCurrency(t.advancePaid)}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] text-muted-foreground font-medium">Anteil Kosten</label>
                        <p className="text-sm font-medium text-foreground pt-2">{formatCurrency(t.allocated)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="bg-card rounded-2xl border p-6 space-y-4">
            <h2 className="text-base font-heading font-semibold text-foreground">Zusammenfassung</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground font-medium">Gesamtkosten</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(totalCosts)}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground font-medium">Davon umlagefähig</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(totalCosts)}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground font-medium">Alle Vorauszahlungen</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(totalAdvance)}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground font-medium">Status</p>
                <Badge variant={Math.abs(totalCosts - totalAdvance) < 1 ? "default" : "secondary"} className="text-xs">
                  {Math.abs(totalCosts - totalAdvance) < 1 ? "Ausgeglichen" : "Differenz vorhanden"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Sticky bottom save bar */}
          <div className="fixed bottom-0 left-0 md:left-64 right-0 bg-card border-t px-6 py-4 flex items-center justify-between z-40">
            <p className="text-sm font-medium text-foreground">
              Gesamtkosten: <span className="font-bold">{formatCurrency(totalCosts)}</span>
            </p>
            <Button
              onClick={handleFinalize}
              disabled={saving || totalCosts === 0}
              className="rounded-xl h-11 px-8 font-semibold"
            >
              {saving ? "Wird gespeichert..." : "Abrechnung speichern"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default UtilityBillingPage;
