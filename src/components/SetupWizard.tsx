import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/UserContext";

const SetupWizard = () => {
  const [step, setStep] = useState(0);
  const [sal, setSal] = useState<"sie" | "du">("sie");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [sqm, setSqm] = useState("");
  const [coldRent, setColdRent] = useState("");
  const [saving, setSaving] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const navigate = useNavigate();
  const { user, setUserName, setSalutation, setUserProperties, userProperties } = useUser();

  const progress = [25, 50, 75, 100][step];
  const isSie = sal === "sie";

  const saveStep1 = async () => {
    if (!firstName.trim()) return;
    setSaving(true);
    try {
      if (user) {
        const fullName = lastName.trim()
          ? `${firstName.trim()} ${lastName.trim()}`
          : firstName.trim();
        await supabase
          .from("profiles")
          .update({ name: fullName, salutation: sal })
          .eq("user_id", user.id);
        setUserName(fullName);
        setSalutation(sal);
      }
    } catch (e) {
      console.error("Error saving name:", e);
    }
    setSaving(false);
    setStep(1);
  };

  const saveProperty = async () => {
    if (!address.trim()) return;
    setSaving(true);
    try {
      if (user) {
        const parts = address.split(",").map((s) => s.trim());
        const addr = parts[0] || address.trim();
        const city = parts[1] || "";
        const { data } = await supabase
          .from("properties")
          .insert({
            user_id: user.id,
            address: addr,
            city,
            zip_code: "",
            units: 1,
          })
          .select();
        if (data && data.length > 0) {
          setUserProperties([
            ...userProperties,
            ...data.map((p) => ({
              id: p.id,
              address: p.address,
              city: p.city,
              zipCode: p.zip_code,
              yearBuilt: p.year_built ?? 0,
              units: p.units ?? 1,
            })),
          ]);
        }
      }
    } catch (e) {
      console.error("Error saving property:", e);
    }
    setSaving(false);
    setStep(2);
  };

  const finish = () => {
    setShowConfetti(true);
    localStorage.setItem("dwello_setup_complete", "true");
    localStorage.setItem("dwello_welcome_seen", "true");
    setTimeout(() => {
      navigate("/dashboard");
    }, 2000);
  };

  const inputClass =
    "w-full h-9 px-3 text-sm border border-border/50 rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary";

  const tenantSteps = isSie
    ? [
        "Sie erfassen die E-Mail-Adresse Ihres Mieters.",
        "Dwello versendet automatisch eine Einladung.",
        "Ihr Mieter vervollständigt seine Daten eigenständig — Sie können sich zurücklehnen.",
      ]
    : [
        "Du gibst die E-Mail-Adresse deines Mieters ein.",
        "Dwello versendet automatisch eine Einladung.",
        "Dein Mieter vervollständigt seine Daten eigenständig — du kannst dich zurücklehnen.",
      ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Confetti overlay */}
      {showConfetti && <ConfettiOverlay />}

      {/* Progress bar */}
      <div className="w-full h-[3px] bg-muted">
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%`, backgroundColor: "#1D9E75" }}
        />
      </div>

      {/* Step indicator */}
      <p className="text-[13px] text-muted-foreground px-6 pt-5">
        Schritt {step + 1} von 4
      </p>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 pt-4 pb-6 max-w-lg mx-auto w-full">
        {/* STEP 1 — Anrede & Name */}
        {step === 0 && (
          <div className="flex flex-col flex-1">
            <h1 className="text-[20px] font-medium text-foreground leading-tight">
              Wie möchten Sie angesprochen werden?
            </h1>
            <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed">
              Für eine persönliche Erfahrung in Dwello.
            </p>

            {/* Toggle */}
            <div className="mt-8 grid grid-cols-2 gap-3">
              <button
                onClick={() => setSal("sie")}
                className="h-10 rounded-lg text-sm font-medium transition-colors border"
                style={
                  sal === "sie"
                    ? { backgroundColor: "#1D9E75", color: "#fff", borderColor: "#1D9E75" }
                    : { backgroundColor: "transparent", color: "inherit", borderColor: "hsl(var(--border))" }
                }
              >
                Sie
              </button>
              <button
                onClick={() => setSal("du")}
                className="h-10 rounded-lg text-sm font-medium transition-colors border"
                style={
                  sal === "du"
                    ? { backgroundColor: "#1D9E75", color: "#fff", borderColor: "#1D9E75" }
                    : { backgroundColor: "transparent", color: "inherit", borderColor: "hsl(var(--border))" }
                }
              >
                Du
              </button>
            </div>

            <div className="my-6 h-px bg-border/50" />

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Vorname</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="z.B. Thomas"
                  className={`mt-1.5 ${inputClass}`}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">
                  Nachname{" "}
                  <span className="text-muted-foreground font-normal text-xs">optional</span>
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="z.B. Müller"
                  className={`mt-1.5 ${inputClass}`}
                />
              </div>
            </div>

            <div className="mt-auto pt-6">
              <button
                onClick={saveStep1}
                disabled={!firstName.trim() || saving}
                className="w-full h-11 rounded-xl font-semibold text-sm transition-colors disabled:opacity-40"
                style={{ backgroundColor: "#1D9E75", color: "#E1F5EE" }}
              >
                {saving ? "Wird gespeichert…" : "Weiter"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 — Erste Immobilie */}
        {step === 1 && (
          <div className="flex flex-col flex-1">
            <h1 className="text-[20px] font-medium text-foreground leading-tight">
              Wohnung Nr. 1.
            </h1>
            <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed">
              {isSie
                ? "Erfassen Sie Ihre erste Immobilie. Weitere Details können jederzeit ergänzt werden."
                : "Erfasse deine erste Immobilie. Weitere Details kannst du jederzeit ergänzen."}
            </p>
            <div className="mt-8 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Adresse</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Musterstraße 12, Berlin"
                  className={`mt-1.5 ${inputClass}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground">
                    Wohnfläche{" "}
                    <span className="text-muted-foreground font-normal text-xs">optional</span>
                  </label>
                  <input
                    type="text"
                    value={sqm}
                    onChange={(e) => setSqm(e.target.value)}
                    placeholder="72 m²"
                    className={`mt-1.5 ${inputClass}`}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">
                    Kaltmiete{" "}
                    <span className="text-muted-foreground font-normal text-xs">optional</span>
                  </label>
                  <input
                    type="text"
                    value={coldRent}
                    onChange={(e) => setColdRent(e.target.value)}
                    placeholder="850 €"
                    className={`mt-1.5 ${inputClass}`}
                  />
                </div>
              </div>
            </div>
            <div className="mt-auto pt-6 space-y-3">
              <button
                onClick={saveProperty}
                disabled={!address.trim() || saving}
                className="w-full h-11 rounded-xl font-semibold text-sm transition-colors disabled:opacity-40"
                style={{ backgroundColor: "#1D9E75", color: "#E1F5EE" }}
              >
                {saving ? "Wird gespeichert…" : "Weiter"}
              </button>
              <button
                onClick={() => setStep(2)}
                className="w-full h-11 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Später ergänzen
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — Mieter-Vorschau */}
        {step === 2 && (
          <div className="flex flex-col flex-1">
            <h1 className="text-[20px] font-medium text-foreground leading-tight">
              Mieter einladen. In Sekunden.
            </h1>
            <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed">
              {isSie
                ? "Dwello übernimmt die Kommunikation mit Ihren Mietern — vollständig automatisiert."
                : "Dwello übernimmt die Kommunikation mit deinen Mietern — vollständig automatisiert."}
            </p>
            <div
              className="mt-8 rounded-xl p-5 space-y-4"
              style={{ backgroundColor: "#EEEDFE", color: "#3C3489" }}
            >
              {tenantSteps.map((text, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div
                    className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                    style={{ backgroundColor: "#7F77DD", color: "#fff" }}
                  >
                    {i + 1}
                  </div>
                  <p className="text-sm leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
            <div className="mt-auto pt-6">
              <button
                onClick={() => setStep(3)}
                className="w-full h-11 rounded-xl font-semibold text-sm transition-colors"
                style={{ backgroundColor: "#1D9E75", color: "#E1F5EE" }}
              >
                Weiter
              </button>
            </div>
          </div>
        )}

        {/* STEP 4 — Abschluss */}
        {step === 3 && (
          <div className="flex flex-col flex-1 items-center justify-center text-center">
            <div
              className="h-16 w-16 rounded-full flex items-center justify-center mb-6"
              style={{ backgroundColor: "#E8F5E9" }}
            >
              <Check className="h-8 w-8" style={{ color: "#1D9E75" }} />
            </div>
            <h1 className="text-[22px] font-bold text-foreground leading-tight">
              Willkommen bei Dwello, {firstName || "du"}.
            </h1>
            <p className="text-[14px] text-muted-foreground mt-2 leading-relaxed max-w-xs">
              {isSie
                ? "Ihr Konto ist eingerichtet. Alles Weitere erledigen Sie in Ihrem eigenen Tempo."
                : "Dein Konto ist eingerichtet. Alles Weitere erledigst du in deinem eigenen Tempo."}
            </p>

            {/* Feature pills */}
            <div className="flex gap-2 mt-6 flex-wrap justify-center">
              {["🏠 Immobilien", "💬 Kommunikation", "📊 Finanzen"].map((label) => (
                <span
                  key={label}
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{ backgroundColor: "#F0FDF4", color: "#1D9E75" }}
                >
                  {label}
                </span>
              ))}
            </div>

            <div className="w-full mt-10">
              <button
                onClick={finish}
                className="w-full h-11 rounded-xl font-semibold text-sm transition-colors"
                style={{ backgroundColor: "#1D9E75", color: "#E1F5EE" }}
              >
                Zum Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* Simple confetti animation */
const ConfettiOverlay = () => {
  const [particles] = useState(() =>
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 1.5 + Math.random() * 1.5,
      color: ["#1D9E75", "#7F77DD", "#F59E0B", "#EA4C2A", "#2D6A4F"][i % 5],
      size: 6 + Math.random() * 6,
    }))
  );

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.x}%`,
            top: "-10px",
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animation: `confettiFall ${p.duration}s ease-in ${p.delay}s forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default SetupWizard;
