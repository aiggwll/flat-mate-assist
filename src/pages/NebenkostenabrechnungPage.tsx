import { useState, useMemo, useCallback, useEffect } from "react";
import jsPDF from "jspdf";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Loader2 } from "lucide-react";

/* ─── Types ─── */
interface Vermieter {
  name: string;
  strasse: string;
  plz: string;
  ort: string;
  email: string;
}

interface Mieter {
  name: string;
  objektStrasse: string;
  objektPlzOrt: string;
  von: string;
  bis: string;
}

interface Flaeche {
  gesamt: string;
  wohnung: string;
}

interface Position {
  id: number;
  bezeichnung: string;
  gesamtkosten: string;
  schluessel: string;
}

interface TenantOption {
  userId: string;
  name: string;
  unitId: string | null;
}

const SCHLUESSEL_OPTIONS = [
  "Wohnfläche",
  "Personenzahl",
  "Verbrauch",
  "Einheit (je Wohnung)",
];

const DEFAULT_POSITIONS: Omit<Position, "id">[] = [
  { bezeichnung: "Grundsteuer", gesamtkosten: "480", schluessel: "Wohnfläche" },
  { bezeichnung: "Gebäudeversicherung", gesamtkosten: "320", schluessel: "Wohnfläche" },
  { bezeichnung: "Hausmeisterkosten", gesamtkosten: "600", schluessel: "Wohnfläche" },
  { bezeichnung: "Müllentsorgung", gesamtkosten: "240", schluessel: "Wohnfläche" },
  { bezeichnung: "Treppenhausreinigung", gesamtkosten: "180", schluessel: "Wohnfläche" },
  { bezeichnung: "Allgemeinstrom", gesamtkosten: "160", schluessel: "Wohnfläche" },
];

let nextId = 100;
const makeId = () => ++nextId;

const eur = (n: number) =>
  n.toLocaleString("de-DE", { style: "currency", currency: "EUR" });

const fmtDate = (iso: string) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
};

/* ─── Component ─── */
const NebenkostenabrechnungPage = () => {
  const { userName, userProperties, userId } = useUser();

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [tenantsLoading, setTenantsLoading] = useState(false);

  const [vermieter, setVermieter] = useState<Vermieter>({ name: "", strasse: "", plz: "", ort: "", email: "" });
  const [mieter, setMieter] = useState<Mieter>({ name: "", objektStrasse: "", objektPlzOrt: "", von: "", bis: "" });
  const [flaeche, setFlaeche] = useState<Flaeche>({ gesamt: "", wohnung: "" });
  const [positionen, setPositionen] = useState<Position[]>(
    DEFAULT_POSITIONS.map((p) => ({ ...p, id: makeId() }))
  );
  const [vorauszahlung, setVorauszahlung] = useState({ monatlich: "", monate: "12" });
  const [sendingEmail, setSendingEmail] = useState(false);

  const currentYear = new Date().getFullYear();

  // Pre-fill Vermieter from logged-in user OR demo localStorage values
  useEffect(() => {
    const demoName = typeof window !== "undefined" ? localStorage.getItem("dwello_demo_name") || "" : "";
    const isDemo = typeof window !== "undefined" ? localStorage.getItem("dwello_demo") === "true" : false;

    setVermieter((prev) => {
      const next = { ...prev };
      if (!next.name) next.name = userName || demoName || "";
      // Demo placeholder address if nothing pre-filled yet (real users get it from property below)
      if (isDemo && !next.strasse) next.strasse = "Musterstraße 1";
      if (isDemo && !next.plz) next.plz = "10115";
      if (isDemo && !next.ort) next.ort = "Berlin";
      return next;
    });
  }, [userName]);

  // Pre-fill Vermieter address from first property (owner's address proxy)
  useEffect(() => {
    if (userProperties.length === 0) return;
    // Auto-select first property if none selected
    if (!selectedPropertyId) {
      setSelectedPropertyId(userProperties[0].id);
    }
  }, [userProperties]);

  // When property changes, pre-fill object address & load tenants
  useEffect(() => {
    if (!selectedPropertyId) return;
    const prop = userProperties.find((p) => p.id === selectedPropertyId);
    if (!prop) return;

    // Pre-fill Vermieter address from property data (as a reasonable default)
    // The owner can always edit these fields
    setVermieter((prev) => ({
      ...prev,
      strasse: prev.strasse || prop.address,
      plz: prev.plz || prop.zipCode,
      ort: prev.ort || prop.city,
    }));

    // Pre-fill Mieter object address
    setMieter((prev) => ({
      ...prev,
      objektStrasse: prop.address,
      objektPlzOrt: `${prop.zipCode} ${prop.city}`,
      von: prev.von || `${currentYear}-01-01`,
      bis: prev.bis || `${currentYear}-12-31`,
    }));

    // Load tenants for this property
    const loadTenants = async () => {
      setTenantsLoading(true);
      try {
        const propertyMatch = `${prop.address}, ${prop.city}`;
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, name, unit_id, property_id")
          .eq("role", "tenant");

        if (profiles) {
          const matched = profiles.filter(
            (p) =>
              p.property_id === selectedPropertyId ||
              p.property_id === propertyMatch ||
              (p.property_id && prop.address && p.property_id.includes(prop.address))
          );
          const opts: TenantOption[] = matched.map((p) => ({
            userId: p.user_id,
            name: p.name || "Unbenannter Mieter",
            unitId: p.unit_id,
          }));
          setTenants(opts);
          // Auto-select if only one tenant
          if (opts.length === 1) {
            setSelectedTenantId(opts[0].userId);
          } else {
            setSelectedTenantId("");
          }
        }
      } catch (e) {
        console.error("Error loading tenants:", e);
      } finally {
        setTenantsLoading(false);
      }
    };
    loadTenants();
  }, [selectedPropertyId, userProperties, currentYear]);

  // When tenant changes, pre-fill Mieter name
  useEffect(() => {
    if (!selectedTenantId) return;
    const tenant = tenants.find((t) => t.userId === selectedTenantId);
    if (tenant) {
      setMieter((prev) => ({
        ...prev,
        name: tenant.name,
        objektStrasse: prev.objektStrasse + (tenant.unitId ? `, ${tenant.unitId}` : ""),
      }));
    }
  }, [selectedTenantId]);

  const anteilPct = useMemo(() => {
    const g = parseFloat(flaeche.gesamt) || 0;
    const w = parseFloat(flaeche.wohnung) || 0;
    return g > 0 ? (w / g) * 100 : 0;
  }, [flaeche]);

  const anteilLabel = useMemo(() => {
    const g = parseFloat(flaeche.gesamt) || 0;
    const w = parseFloat(flaeche.wohnung) || 0;
    if (g <= 0 || w <= 0) return "—";
    return `${(anteilPct).toFixed(1)}% (${w} / ${g} m²)`;
  }, [flaeche, anteilPct]);

  const gesamtBK = useMemo(
    () => positionen.reduce((s, p) => s + (parseFloat(p.gesamtkosten) || 0), 0),
    [positionen]
  );

  const anteilEur = gesamtBK * (anteilPct / 100);
  const gezahlt = (parseFloat(vorauszahlung.monatlich) || 0) * (parseFloat(vorauszahlung.monate) || 0);
  const saldo = anteilEur - gezahlt;
  const isNachzahlung = saldo > 0;

  const posAnteil = useCallback(
    (p: Position) => (parseFloat(p.gesamtkosten) || 0) * (anteilPct / 100),
    [anteilPct]
  );

  const addPosition = () =>
    setPositionen((prev) => [...prev, { id: makeId(), bezeichnung: "", gesamtkosten: "", schluessel: "Wohnfläche" }]);

  const removePosition = (id: number) =>
    setPositionen((prev) => prev.filter((p) => p.id !== id));

  const updatePosition = (id: number, field: keyof Omit<Position, "id">, value: string) =>
    setPositionen((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));

  /* ─── PDF ─── */
  const generatePDF = () => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const W = 210;
    const ML = 25;
    const MR = 25;
    const CW = W - ML - MR;
    let y = 20;

    const green = [45, 90, 61] as const;
    const muted = [122, 117, 112] as const;
    const lightGreen: [number, number, number] = [232, 240, 235];
    const altRow: [number, number, number] = [249, 248, 246];

    // Header
    doc.setFontSize(9);
    doc.setTextColor(...green);
    doc.text("dwello Verwaltung", ML, y);
    y += 8;

    // Absenderzeile
    doc.setFontSize(7);
    doc.setTextColor(...muted);
    const absender = `${vermieter.name} · ${vermieter.strasse} · ${vermieter.plz} ${vermieter.ort}`;
    doc.text(absender, ML, y);
    y += 2;
    doc.setDrawColor(200, 200, 200);
    doc.line(ML, y, ML + CW, y);
    y += 10;

    // Empfänger
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text(mieter.name || "—", ML, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(mieter.objektStrasse || "", ML, y);
    y += 5;
    doc.text(mieter.objektPlzOrt || "", ML, y);
    y += 5;

    // Date
    const today = new Date().toLocaleDateString("de-DE");
    doc.setFontSize(9);
    doc.setTextColor(...muted);
    doc.text(today, W - MR, 28, { align: "right" });

    y += 8;

    // Title
    doc.setFontSize(15);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("Nebenkostenabrechnung", ML, y);
    y += 6;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Abrechnungszeitraum: ${fmtDate(mieter.von)} bis ${fmtDate(mieter.bis)}`, ML, y);
    y += 3;
    doc.setDrawColor(...green);
    doc.setLineWidth(0.6);
    doc.line(ML, y, ML + CW, y);
    y += 8;

    // Verteilerschlüssel info
    doc.setFontSize(9);
    doc.setTextColor(...muted);
    const g = parseFloat(flaeche.gesamt) || 0;
    const w = parseFloat(flaeche.wohnung) || 0;
    doc.text(
      `Gesamtfläche Objekt: ${g} m²  |  Wohnfläche: ${w} m²  |  Ihr Anteil: ${anteilPct.toFixed(1)}%`,
      ML, y
    );
    y += 8;

    // Table header
    const colX = [ML, ML + 70, ML + 100, ML + 135];
    const colLabels = ["Position", "Schlüssel", "Gesamtkosten", "Ihr Anteil"];

    doc.setFillColor(...lightGreen);
    doc.rect(ML, y - 4, CW, 7, "F");
    doc.setFontSize(8.5);
    doc.setTextColor(...green);
    doc.setFont("helvetica", "bold");
    colLabels.forEach((l, i) => {
      if (i >= 2) doc.text(l, colX[i] + 25, y, { align: "right" });
      else doc.text(l, colX[i], y);
    });
    y += 6;

    // Table rows
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    positionen.forEach((p, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(...altRow);
        doc.rect(ML, y - 4, CW, 6, "F");
      }
      doc.setFontSize(8.5);
      doc.text(p.bezeichnung || "—", colX[0], y);
      doc.text(p.schluessel, colX[1], y);
      doc.text(eur(parseFloat(p.gesamtkosten) || 0), colX[2] + 25, y, { align: "right" });
      doc.text(eur(posAnteil(p)), colX[3] + 25, y, { align: "right" });
      y += 6;
    });

    y += 6;

    // Summary
    doc.setFontSize(9);
    const summaryX = ML + 100;
    const summaryValX = ML + CW;

    const summaryLine = (label: string, val: string, bold = false) => {
      if (bold) doc.setFont("helvetica", "bold");
      else doc.setFont("helvetica", "normal");
      doc.text(label, summaryX, y);
      doc.text(val, summaryValX, y, { align: "right" });
      y += 5.5;
    };

    doc.setTextColor(0, 0, 0);
    summaryLine("Gesamtbetriebskosten", eur(gesamtBK));
    summaryLine(`Ihr Anteil (${anteilPct.toFixed(1)}%)`, eur(anteilEur));
    summaryLine("Geleistete Vorauszahlungen", `– ${eur(gezahlt)}`);

    doc.setDrawColor(...green);
    doc.setLineWidth(0.4);
    doc.line(summaryX, y - 1, summaryValX, y - 1);
    y += 3;

    if (isNachzahlung) {
      doc.setTextColor(180, 40, 40);
      summaryLine("Nachzahlung durch Mieter", eur(Math.abs(saldo)), true);
    } else {
      doc.setTextColor(...green);
      summaryLine("Guthaben für Mieter", eur(Math.abs(saldo)), true);
    }

    y += 6;

    // Info box
    doc.setFillColor(...lightGreen);
    doc.roundedRect(ML, y - 3, CW, 14, 2, 2, "F");
    doc.setFontSize(8);
    doc.setTextColor(...green);
    doc.setFont("helvetica", "normal");
    if (isNachzahlung) {
      doc.text(
        `Bitte überweisen Sie den Betrag von ${eur(Math.abs(saldo))} innerhalb von 30 Tagen nach Erhalt dieser Abrechnung.`,
        ML + 4, y + 4, { maxWidth: CW - 8 }
      );
    } else {
      doc.text(
        `Wir werden das Guthaben von ${eur(Math.abs(saldo))} mit Ihrer nächsten Vorauszahlung verrechnen.`,
        ML + 4, y + 4, { maxWidth: CW - 8 }
      );
    }
    y += 20;

    // Legal footer
    doc.setFontSize(7);
    doc.setTextColor(...muted);
    doc.text(
      "Diese Abrechnung ergeht gemäß § 556 BGB. Sie haben das Recht, die Belege innerhalb von 12 Monaten nach Zugang einzusehen (§ 259 BGB). Die Abrechnungsfrist endet 12 Monate nach dem Ende des Abrechnungszeitraums.",
      ML, y, { maxWidth: CW }
    );
    y += 14;

    // Signature
    doc.setDrawColor(0, 0, 0);
    doc.line(ML, y, ML + 60, y);
    y += 4;
    doc.setFontSize(8);
    doc.setTextColor(...muted);
    doc.text(`${vermieter.name || "Name"}, Datum`, ML, y);

    // Page footer
    const pageH = 297;
    doc.setFontSize(7);
    doc.setTextColor(...muted);
    doc.text("Seite 1 von 1", W / 2, pageH - 10, { align: "center" });
    doc.text("Erstellt mit dwello – www.dwello.de", W - MR, pageH - 10, { align: "right" });

    const year = mieter.bis ? mieter.bis.split("-")[0] : new Date().getFullYear();
    const safeName = (mieter.name || "Mieter").replace(/\s+/g, "_");
    doc.save(`Nebenkostenabrechnung_${safeName}_${year}.pdf`);
  };

  /* ─── Send via Email ─── */
  const sendAbrechnungEmail = async () => {
    if (!selectedTenantId) {
      toast.error("Bitte wählen Sie zuerst einen Mieter aus.");
      return;
    }
    const tenant = tenants.find(t => t.userId === selectedTenantId);
    if (!tenant) return;

    // Find tenant's email
    const { data: tenantProfile } = await supabase
      .from("profiles")
      .select("email")
      .eq("user_id", selectedTenantId)
      .maybeSingle();

    if (!tenantProfile?.email) {
      toast.error("E-Mail-Adresse des Mieters nicht gefunden.");
      return;
    }

    setSendingEmail(true);
    try {
      const jahr = mieter.bis ? mieter.bis.split("-")[0] : String(currentYear);
      const emailId = crypto.randomUUID();
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "nebenkostenabrechnung",
          recipientEmail: tenantProfile.email,
          idempotencyKey: `nebenkostenabrechnung-${emailId}`,
          templateData: {
            objektAdresse: `${mieter.objektStrasse}, ${mieter.objektPlzOrt}`,
            abrechnungsZeitraum: `${fmtDate(mieter.von)} – ${fmtDate(mieter.bis)}`,
            jahr,
            gesamtKosten: eur(gesamtBK),
            anteil: eur(anteilEur),
            vorauszahlungen: eur(gezahlt),
            ergebnis: eur(Math.abs(saldo)),
            istNachzahlung: isNachzahlung,
          },
        },
      });
      toast.success(`Abrechnung per E-Mail an ${tenantProfile.email} gesendet.`);
    } catch (err) {
      console.error("Failed to send Nebenkostenabrechnung email:", err);
      toast.error("E-Mail konnte nicht gesendet werden. Bitte versuche es erneut.");
    } finally {
      setSendingEmail(false);
    }
  };

  const inputCls =
    "w-full rounded-[10px] border border-[#E0DBD3] bg-white px-3 py-2.5 text-sm text-[#1a1a1a] placeholder:text-[#b5b0aa] focus:outline-none focus:ring-2 focus:ring-[#2D5A3D]/30 focus:border-[#2D5A3D] transition";
  const labelCls = "block text-xs font-medium text-[#7A7570] mb-1";
  const cardCls = "bg-white rounded-[10px] border border-[#E0DBD3] p-5 md:p-6";
  const sectionTitle = "text-base font-semibold text-[#1a1a1a] mb-4";

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap"
        rel="stylesheet"
      />

      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1
            className="text-3xl md:text-4xl mb-1"
            style={{ fontFamily: "'DM Serif Display', serif", color: "#2D5A3D" }}
          >
            dwello{" "}
            <span className="text-[#7A7570] text-xl md:text-2xl" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 400 }}>
              Verwaltung
            </span>
          </h1>
          <p className="text-sm text-[#7A7570] mt-1">
            Rechtssicher nach § 556 BGB · PDF-Download in einem Klick
          </p>
        </div>

        {/* 0 — Property & Tenant Selection */}
        {userProperties.length > 0 && (
          <section className={`${cardCls} mb-4`}>
            <h2 className={sectionTitle}>Immobilie & Mieter auswählen</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Immobilie</label>
                <select
                  className={inputCls}
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(e.target.value)}
                >
                  <option value="">— Immobilie wählen —</option>
                  {userProperties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.address}, {p.zipCode} {p.city}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Mieter</label>
                {tenantsLoading ? (
                  <div className={`${inputCls} bg-[#F5F3EF] text-[#7A7570]`}>Lade Mieter…</div>
                ) : tenants.length === 0 ? (
                  <div className={`${inputCls} bg-[#F5F3EF] text-[#7A7570]`}>
                    {selectedPropertyId ? "Keine Mieter gefunden" : "Bitte Immobilie wählen"}
                  </div>
                ) : tenants.length === 1 ? (
                  <input readOnly className={`${inputCls} bg-[#F5F3EF] cursor-default`} value={tenants[0].name} />
                ) : (
                  <select
                    className={inputCls}
                    value={selectedTenantId}
                    onChange={(e) => setSelectedTenantId(e.target.value)}
                  >
                    <option value="">— Mieter wählen —</option>
                    {tenants.map((t) => (
                      <option key={t.userId} value={t.userId}>
                        {t.name}{t.unitId ? ` (${t.unitId})` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </section>
        )}

        {/* 1 — Vermieter */}
        <section className={`${cardCls} mb-4`}>
          <h2 className={sectionTitle}>Vermieter</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Name / Firma</label>
              <input className={inputCls} value={vermieter.name} onChange={(e) => setVermieter({ ...vermieter, name: e.target.value })} placeholder="Max Mustermann GmbH" />
            </div>
            <div>
              <label className={labelCls}>Straße</label>
              <input className={inputCls} value={vermieter.strasse} onChange={(e) => setVermieter({ ...vermieter, strasse: e.target.value })} placeholder="Musterstraße 1" />
            </div>
            <div>
              <label className={labelCls}>PLZ</label>
              <input className={inputCls} value={vermieter.plz} onChange={(e) => setVermieter({ ...vermieter, plz: e.target.value })} placeholder="10115" />
            </div>
            <div>
              <label className={labelCls}>Ort</label>
              <input className={inputCls} value={vermieter.ort} onChange={(e) => setVermieter({ ...vermieter, ort: e.target.value })} placeholder="Berlin" />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>E-Mail</label>
              <input type="email" className={inputCls} value={vermieter.email} onChange={(e) => setVermieter({ ...vermieter, email: e.target.value })} placeholder="vermieter@example.com" />
            </div>
          </div>
        </section>

        {/* 2 — Mieter */}
        <section className={`${cardCls} mb-4`}>
          <h2 className={sectionTitle}>Mieter & Mietobjekt</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Mietername</label>
              <input className={inputCls} value={mieter.name} onChange={(e) => setMieter({ ...mieter, name: e.target.value })} placeholder="Anna Beispiel" />
            </div>
            <div>
              <label className={labelCls}>Objektanschrift</label>
              <input className={inputCls} value={mieter.objektStrasse} onChange={(e) => setMieter({ ...mieter, objektStrasse: e.target.value })} placeholder="Beispielweg 5" />
            </div>
            <div>
              <label className={labelCls}>PLZ & Ort</label>
              <input className={inputCls} value={mieter.objektPlzOrt} onChange={(e) => setMieter({ ...mieter, objektPlzOrt: e.target.value })} placeholder="10115 Berlin" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Von</label>
                <input type="date" className={inputCls} value={mieter.von} onChange={(e) => setMieter({ ...mieter, von: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Bis</label>
                <input type="date" className={inputCls} value={mieter.bis} onChange={(e) => setMieter({ ...mieter, bis: e.target.value })} />
              </div>
            </div>
          </div>
        </section>

        {/* 3 — Fläche */}
        <section className={`${cardCls} mb-4`}>
          <h2 className={sectionTitle}>Verteilerschlüssel Wohnfläche</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Gesamtfläche (m²)</label>
              <input type="number" className={inputCls} value={flaeche.gesamt} onChange={(e) => setFlaeche({ ...flaeche, gesamt: e.target.value })} placeholder="300" />
            </div>
            <div>
              <label className={labelCls}>Fläche dieser Wohnung (m²)</label>
              <input type="number" className={inputCls} value={flaeche.wohnung} onChange={(e) => setFlaeche({ ...flaeche, wohnung: e.target.value })} placeholder="75" />
            </div>
            <div>
              <label className={labelCls}>Anteil</label>
              <input readOnly className={`${inputCls} bg-[#F5F3EF] cursor-default`} value={anteilLabel} />
            </div>
          </div>
        </section>

        {/* 4 — Positionen */}
        <section className={`${cardCls} mb-4`}>
          <h2 className={sectionTitle}>Betriebskostenpositionen</h2>
          <div className="space-y-3">
            {/* Header row (desktop) */}
            <div className="hidden md:grid md:grid-cols-[1fr_140px_100px_100px_36px] gap-2 text-xs font-medium text-[#7A7570] px-1">
              <span>Bezeichnung</span>
              <span>Schlüssel</span>
              <span>Gesamtkosten €</span>
              <span>Anteil €</span>
              <span />
            </div>
            {positionen.map((p) => (
              <div key={p.id} className="grid grid-cols-1 md:grid-cols-[1fr_140px_100px_100px_36px] gap-2 items-end">
                <div>
                  <label className={`${labelCls} md:hidden`}>Bezeichnung</label>
                  <input className={inputCls} value={p.bezeichnung} onChange={(e) => updatePosition(p.id, "bezeichnung", e.target.value)} placeholder="Position" />
                </div>
                <div>
                  <label className={`${labelCls} md:hidden`}>Schlüssel</label>
                  <select
                    className={inputCls}
                    value={p.schluessel}
                    onChange={(e) => updatePosition(p.id, "schluessel", e.target.value)}
                  >
                    {SCHLUESSEL_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`${labelCls} md:hidden`}>Gesamtkosten €</label>
                  <input type="number" className={inputCls} value={p.gesamtkosten} onChange={(e) => updatePosition(p.id, "gesamtkosten", e.target.value)} placeholder="0" />
                </div>
                <div>
                  <label className={`${labelCls} md:hidden`}>Anteil €</label>
                  <input readOnly className={`${inputCls} bg-[#F5F3EF] cursor-default`} value={anteilPct > 0 ? eur(posAnteil(p)) : "—"} />
                </div>
                <button
                  onClick={() => removePosition(p.id)}
                  className="h-[42px] w-9 rounded-[10px] border border-[#E0DBD3] text-[#7A7570] hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition flex items-center justify-center text-lg"
                  title="Entfernen"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={addPosition}
            className="mt-3 w-full rounded-[10px] border border-dashed border-[#2D5A3D]/40 text-[#2D5A3D] py-2 text-sm font-medium hover:bg-[#E8F0EB] transition"
          >
            + Position hinzufügen
          </button>
        </section>

        {/* 5 — Vorauszahlungen */}
        <section className={`${cardCls} mb-4`}>
          <h2 className={sectionTitle}>Vorauszahlungen</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Monatliche Vorauszahlung (€)</label>
              <input type="number" className={inputCls} value={vorauszahlung.monatlich} onChange={(e) => setVorauszahlung({ ...vorauszahlung, monatlich: e.target.value })} placeholder="150" />
            </div>
            <div>
              <label className={labelCls}>Gezahlte Monate</label>
              <input type="number" className={inputCls} value={vorauszahlung.monate} onChange={(e) => setVorauszahlung({ ...vorauszahlung, monate: e.target.value })} placeholder="12" />
            </div>
          </div>
        </section>

        {/* Summary */}
        <div className="rounded-[10px] p-5 mb-4" style={{ background: "#E8F0EB" }}>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#7A7570]">Gesamte Betriebskosten</span>
              <span className="font-medium">{eur(gesamtBK)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7A7570]">Anteil Mieter ({anteilPct.toFixed(1)}%)</span>
              <span className="font-medium">{eur(anteilEur)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7A7570]">Geleistete Vorauszahlungen</span>
              <span className="font-medium">– {eur(gezahlt)}</span>
            </div>
            <hr className="border-[#2D5A3D]/20" />
            <div className="flex justify-between text-base font-bold">
              <span>{isNachzahlung ? "Nachzahlung durch Mieter" : "Guthaben für Mieter"}</span>
              <span style={{ color: isNachzahlung ? "#b42828" : "#2D5A3D" }}>
                {eur(Math.abs(saldo))}
              </span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={generatePDF}
            className="flex-1 py-3.5 rounded-[10px] text-white font-semibold text-base transition hover:opacity-90"
            style={{ background: "#2D5A3D", fontFamily: "'DM Serif Display', serif" }}
          >
            PDF herunterladen
          </button>
          <button
            onClick={sendAbrechnungEmail}
            disabled={sendingEmail || !selectedTenantId}
            className="flex-1 py-3.5 rounded-[10px] border-2 font-semibold text-base transition hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ borderColor: "#2D5A3D", color: "#2D5A3D", fontFamily: "'DM Serif Display', serif" }}
          >
            {sendingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            Per E-Mail senden
          </button>
        </div>

        {/* Legal note */}
        <div className="mt-4 rounded-[10px] border border-[#E0DBD3] bg-[#F5F3EF] p-4 text-xs text-[#7A7570] leading-relaxed">
          Diese Abrechnung entspricht den Anforderungen des § 556 BGB i.V.m. der Betriebskostenverordnung (BetrKV). Die Abrechnung muss dem Mieter spätestens 12 Monate nach Ende des Abrechnungszeitraums zugehen.
        </div>
      </div>
    </div>
  );
};

export default NebenkostenabrechnungPage;
