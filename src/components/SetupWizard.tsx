import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/UserContext";
import { sal } from "@/lib/salutation";

const SetupWizard = () => {
  const [step, setStep] = useState(0);
  const [salutation, setSalutationLocal] = useState<"sie" | "du">("sie");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState<"" | "Herr" | "Frau">("");
  const [address, setAddress] = useState("");
  const [sqm, setSqm] = useState("");
  const [coldRent, setColdRent] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { user, setUserName, setSalutation, setUserProperties, userProperties } = useUser();

  const progress = [25, 50, 75, 100][step];
  const s = salutation;

  const inputClass =
    "w-full h-9 px-3 text-sm border border-border/50 rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary";

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
          .update({
            name: fullName,
            salutation,
            gender: gender || null,
          } as any)
          .eq("user_id", user.id);
        setUserName(fullName);
        setSalutation(salutation);
        localStorage.setItem("dwello_salutation", salutation);
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
        const parts = address.split(",").map((p) => p.trim());
        const addr = parts[0] || address.trim();
        const city = parts[1] || "";
        const { data } = await supabase
          .from("properties")
          .insert({ user_id: user.id, address: addr, city, zip_code: "", units: 1 })
          .select();
        if (data?.length) {
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

  const finish = async () => {
    setSaving(true);
    try {
      if (user) {
        await supabase
          .from("profiles")
          .update({ setup_wizard_complete: true } as any)
          .eq("user_id", user.id);
      }
    } catch (e) {
      console.error("Error saving wizard completion:", e);
    }
    localStorage.setItem("dwello_setup_complete", "true");
    localStorage.setItem("dwello_welcome_seen", "true");
    setSaving(false);
    console.log("Navigating to dashboard");
    try {
      navigate("/dashboard");
    } catch {
      // fallback
    }
    // Fallback: force navigation if navigate didn't work
    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 300);
  };

  // Step 4 title
  const getStep4Title = () => {
    if (s === "sie" && gender && lastName.trim()) {
      return `Alles bereit, ${gender} ${lastName.trim()}.`;
    }
    return `Alles bereit, ${firstName || "du"}${s === "sie" ? "." : "!"}`;
  };

  const tenantSteps = salutation === "sie"
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

  const toggleBtnStyle = (active: boolean) =>
    active
      ? { backgroundColor: "#1D9E75", color: "#fff", borderColor: "#1D9E75" }
      : { backgroundColor: "transparent", color: "inherit", borderColor: "hsl(var(--border))" };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Progress bar */}
      <div className="w-full h-[3px] bg-muted">
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%`, backgroundColor: "#1D9E75" }}
        />
      </div>

      <p className="text-[13px] text-muted-foreground px-6 pt-5">
        Schritt {step + 1} von 4
      </p>

      <div className="flex-1 flex flex-col px-6 pt-4 pb-6 max-w-lg mx-auto w-full">
        {/* STEP 1 */}
        {step === 0 && (
          <div className="flex flex-col flex-1">
            <h1 className="text-[20px] font-medium text-foreground leading-tight">
              Wie möchten Sie angesprochen werden?
            </h1>
            <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed">
              Für eine persönliche Erfahrung in Dwello.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3">
              <button
                onClick={() => setSalutationLocal("sie")}
                className="h-10 rounded-lg text-sm font-medium transition-colors border"
                style={toggleBtnStyle(salutation === "sie")}
              >
                Sie
              </button>
              <button
                onClick={() => setSalutationLocal("du")}
                className="h-10 rounded-lg text-sm font-medium transition-colors border"
                style={toggleBtnStyle(salutation === "du")}
              >
                Du
              </button>
            </div>

            <div className="my-6 h-px bg-border/50" />

            {/* Gender (optional) */}
            <div className="mb-4">
              <label className="text-sm font-medium text-foreground">
                Anrede{" "}
                <span className="text-muted-foreground font-normal text-xs">optional</span>
              </label>
              <div className="mt-1.5 grid grid-cols-2 gap-3">
                <button
                  onClick={() => setGender(gender === "Herr" ? "" : "Herr")}
                  className="h-9 rounded-lg text-sm font-medium transition-colors border"
                  style={toggleBtnStyle(gender === "Herr")}
                >
                  Herr
                </button>
                <button
                  onClick={() => setGender(gender === "Frau" ? "" : "Frau")}
                  className="h-9 rounded-lg text-sm font-medium transition-colors border"
                  style={toggleBtnStyle(gender === "Frau")}
                >
                  Frau
                </button>
              </div>
            </div>

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

        {/* STEP 2 */}
        {step === 1 && (
          <div className="flex flex-col flex-1">
            <h1 className="text-[20px] font-medium text-foreground leading-tight">
              Wohnung Nr. 1.
            </h1>
            <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed">
              {sal(
                s,
                "Erfassen Sie Ihre erste Immobilie. Weitere Details können jederzeit ergänzt werden.",
                "Erfasse deine erste Immobilie. Weitere Details kannst du jederzeit ergänzen."
              )}
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

        {/* STEP 3 */}
        {step === 2 && (
          <div className="flex flex-col flex-1">
            <h1 className="text-[20px] font-medium text-foreground leading-tight">
              Mieter einladen. In Sekunden.
            </h1>
            <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed">
              {sal(
                s,
                "Dwello übernimmt die Kommunikation mit Ihren Mietern — vollständig automatisiert.",
                "Dwello übernimmt die Kommunikation mit deinen Mietern — vollständig automatisiert."
              )}
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

        {/* STEP 4 */}
        {step === 3 && (
          <div className="flex flex-col flex-1 items-center justify-center text-center">
            <div
              className="h-[72px] w-[72px] rounded-full flex items-center justify-center mb-6"
              style={{ backgroundColor: "#E1F5EE" }}
            >
              <Check className="h-8 w-8" style={{ color: "#1D9E75" }} strokeWidth={2.5} />
            </div>
            <h1
              className="text-[20px] leading-tight"
              style={{ fontWeight: 600, color: "#111" }}
            >
              {getStep4Title()}
            </h1>
            <p className="text-[14px] text-muted-foreground mt-3 leading-relaxed max-w-[280px]">
              {sal(
                s,
                "Willkommen bei Dwello. Ihre Immobilien, jetzt digital verwaltet.",
                "Willkommen bei Dwello. Deine Immobilien, jetzt digital verwaltet."
              )}
            </p>
            <div className="w-full mt-8">
              <button
                onClick={finish}
                disabled={saving}
                className="w-full h-12 rounded-xl text-sm transition-colors disabled:opacity-40"
                style={{ backgroundColor: "#1D9E75", color: "#fff", fontWeight: 600 }}
              >
                {saving ? "Wird gespeichert…" : "Zum Dashboard"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SetupWizard;
