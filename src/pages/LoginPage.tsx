import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Home, Plus, X, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";

type Role = "owner" | "tenant";

interface PropertyForm {
  address: string;
  city: string;
  zipCode: string;
  yearBuilt: string;
  units: string;
}

const emptyProperty: PropertyForm = { address: "", city: "", zipCode: "", yearBuilt: "", units: "1" };

const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const inviteRole = searchParams.get("role") as Role | null;
  const inviteProperty = searchParams.get("property");

  const [isLogin, setIsLogin] = useState(!inviteRole);
  const [selectedRole, setSelectedRole] = useState<Role | null>(inviteRole);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPropertySetup, setShowPropertySetup] = useState(false);
  const [showTenantPropertyInfo, setShowTenantPropertyInfo] = useState(false);
  const [properties, setProperties] = useState<PropertyForm[]>([{ ...emptyProperty }]);
  const navigate = useNavigate();
  const { setUserName, setUserProperties, setIsNewUser } = useUser();
  const [nameField, setNameField] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLogin) {
      if (password.length < 6) {
        setPasswordError("Passwort muss mindestens 6 Zeichen lang sein.");
        return;
      }
      if (password !== passwordConfirm) {
        setPasswordError("Passwörter stimmen nicht überein.");
        return;
      }
      setPasswordError("");

      if (selectedRole === "owner") {
        setUserName(nameField.trim() || "Eigentümer");
        setIsNewUser(true);
        setShowPropertySetup(true);
        return;
      }
      // Tenant: save name
      setUserName(nameField.trim() || "Mieter");
    }

    if (selectedRole === "tenant") {
      navigate("/tenant-dashboard");
    } else {
      navigate("/dashboard");
    }
  };

  const updateProperty = (index: number, field: keyof PropertyForm, value: string) => {
    setProperties(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const addProperty = () => {
    if (properties.length >= 10) return;
    setProperties(prev => [...prev, { ...emptyProperty }]);
  };

  const removeProperty = (index: number) => {
    if (properties.length <= 1) return;
    setProperties(prev => prev.filter((_, i) => i !== index));
  };

  const handlePropertySubmit = () => {
    const incomplete = properties.some(p => !p.address.trim() || !p.city.trim() || !p.zipCode.trim());
    if (incomplete) {
      toast.error("Bitte füllen Sie mindestens Adresse, Stadt und PLZ aus.");
      return;
    }
    const mapped = properties.map((p, i) => ({
      id: `user-p${i + 1}`,
      address: p.address.trim(),
      city: p.city.trim(),
      zipCode: p.zipCode.trim(),
      yearBuilt: parseInt(p.yearBuilt) || 0,
      units: parseInt(p.units) || 1,
    }));
    setUserProperties(mapped);
    toast.success(`${properties.length} ${properties.length === 1 ? "Immobilie" : "Immobilien"} angelegt!`);
    navigate("/dashboard");
  };

  // Step 1: Role selection
  if (!selectedRole) {
    return (
      <div className="min-h-screen bg-primary flex">
        <div className="flex-1 hidden lg:flex items-center justify-center p-12">
          <div className="max-w-md">
            <h1 className="text-4xl font-heading font-bold text-primary-foreground mb-4 tracking-tight">
              Will<span className="text-accent">Prop</span>
            </h1>
            <p className="text-primary-foreground/70 text-lg leading-relaxed">
              Die All-in-One Plattform für private Vermieter. Verwalten Sie Ihre Immobilien, kommunizieren Sie mit Mietern und behalten Sie den Überblick.
            </p>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-8 bg-background rounded-l-3xl lg:max-w-lg">
          <div className="w-full max-w-sm">
            <div className="lg:hidden mb-8">
              <h1 className="text-2xl font-heading font-bold text-foreground">
                Will<span className="text-accent">Prop</span>
              </h1>
            </div>

            <h2 className="text-2xl font-heading font-bold text-foreground">Willkommen</h2>
            <p className="text-muted-foreground text-sm mt-1 mb-8">
              Wie möchten Sie WillProp nutzen?
            </p>

            <div className="space-y-4">
              <button
                onClick={() => setSelectedRole("owner")}
                className="w-full flex items-center gap-4 p-5 rounded-xl border-2 border-border bg-card hover:border-accent hover:bg-accent/5 transition-all text-left group"
              >
                <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-heading font-semibold text-foreground">Vermieter</p>
                  <p className="text-sm text-muted-foreground">Immobilien verwalten & Mieter managen</p>
                </div>
              </button>

              <button
                onClick={() => setSelectedRole("tenant")}
                className="w-full flex items-center gap-4 p-5 rounded-xl border-2 border-border bg-card hover:border-accent hover:bg-accent/5 transition-all text-left group"
              >
                <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                  <Home className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-heading font-semibold text-foreground">Mieter</p>
                  <p className="text-sm text-muted-foreground">Schäden melden & mit Vermieter kommunizieren</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Property setup (owner only, after registration)
  if (showPropertySetup) {
    return (
      <div className="min-h-screen bg-primary flex">
        <div className="flex-1 hidden lg:flex items-center justify-center p-12">
          <div className="max-w-md">
            <h1 className="text-4xl font-heading font-bold text-primary-foreground mb-4 tracking-tight">
              Will<span className="text-accent">Prop</span>
            </h1>
            <p className="text-primary-foreground/70 text-lg leading-relaxed">
              Legen Sie Ihre Immobilien an, um direkt loslegen zu können. Sie können später jederzeit weitere hinzufügen.
            </p>
            <div className="mt-8 flex items-center gap-3 text-primary-foreground/50">
              <CheckCircle2 className="h-5 w-5 text-accent" />
              <span className="text-sm">Konto erfolgreich erstellt</span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-8 bg-background rounded-l-3xl lg:max-w-lg">
          <div className="w-full max-w-sm">
            <div className="lg:hidden mb-6">
              <h1 className="text-2xl font-heading font-bold text-foreground">
                Will<span className="text-accent">Prop</span>
              </h1>
            </div>

            <h2 className="text-2xl font-heading font-bold text-foreground">Immobilie anlegen</h2>
            <p className="text-muted-foreground text-sm mt-1 mb-6">
              Fügen Sie Ihre erste Immobilie hinzu.
            </p>

            <div className="space-y-5 max-h-[55vh] overflow-y-auto pr-1">
              {properties.map((prop, index) => (
                <div key={index} className="space-y-3 p-4 rounded-xl border bg-card relative">
                  {properties.length > 1 && (
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-muted-foreground">Immobilie {index + 1}</p>
                      <button onClick={() => removeProperty(index)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label className="text-xs">Adresse *</Label>
                    <Input
                      placeholder="z.B. Berliner Str. 42"
                      value={prop.address}
                      onChange={e => updateProperty(index, "address", e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">PLZ *</Label>
                      <Input
                        placeholder="10115"
                        value={prop.zipCode}
                        onChange={e => updateProperty(index, "zipCode", e.target.value)}
                        className="h-9 text-sm"
                        maxLength={5}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Stadt *</Label>
                      <Input
                        placeholder="Berlin"
                        value={prop.city}
                        onChange={e => updateProperty(index, "city", e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Baujahr</Label>
                      <Input
                        placeholder="2000"
                        value={prop.yearBuilt}
                        onChange={e => updateProperty(index, "yearBuilt", e.target.value)}
                        className="h-9 text-sm"
                        maxLength={4}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Wohneinheiten</Label>
                      <Input
                        type="number"
                        min="1"
                        max="50"
                        value={prop.units}
                        onChange={e => updateProperty(index, "units", e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-3">
              {properties.length < 10 && (
                <Button variant="outline" size="sm" className="w-full gap-2" onClick={addProperty}>
                  <Plus className="h-4 w-4" />
                  Weitere Immobilie
                </Button>
              )}
              <Button className="w-full" onClick={handlePropertySubmit}>
                {properties.length === 1 ? "Immobilie anlegen & starten" : `${properties.length} Immobilien anlegen & starten`}
              </Button>
              <button
                onClick={() => navigate("/dashboard")}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Später einrichten →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Login/Register form
  return (
    <div className="min-h-screen bg-primary flex">
      <div className="flex-1 hidden lg:flex items-center justify-center p-12">
        <div className="max-w-md">
          <h1 className="text-4xl font-heading font-bold text-primary-foreground mb-4 tracking-tight">
            Will<span className="text-accent">Prop</span>
          </h1>
          <p className="text-primary-foreground/70 text-lg leading-relaxed">
            {selectedRole === "owner"
              ? "Verwalten Sie Ihre Immobilien, kommunizieren Sie mit Mietern und behalten Sie den Überblick."
              : "Kommunizieren Sie mit Ihrem Vermieter, melden Sie Schäden und verwalten Sie Ihre Dokumente."}
          </p>
          <div className="mt-8 space-y-4">
            {(selectedRole === "owner"
              ? ["Immobilien einfach verwalten", "Direkte Kommunikation mit Mietern", "Schadenmeldungen digital organisieren"]
              : ["Schäden schnell melden", "Direkt mit dem Vermieter kommunizieren", "Dokumente jederzeit einsehen"]
            ).map((item) => (
              <div key={item} className="flex items-center gap-3 text-primary-foreground/60">
                <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-background rounded-l-3xl lg:max-w-lg">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <h1 className="text-2xl font-heading font-bold text-foreground">
              Will<span className="text-accent">Prop</span>
            </h1>
          </div>

          {inviteProperty && !isLogin && (
            <div className="mb-4 p-3 rounded-lg bg-accent/10 border border-accent/20">
              <p className="text-sm text-accent font-medium">
                Sie wurden als Mieter eingeladen
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Erstellen Sie ein Konto, um fortzufahren.
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={() => { setSelectedRole(null); setPasswordError(""); setPassword(""); setPasswordConfirm(""); }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Zurück
            </button>
            <span className="text-muted-foreground">·</span>
            <span className="text-sm font-medium text-accent flex items-center gap-1.5">
              {selectedRole === "owner" ? <Building2 className="h-3.5 w-3.5" /> : <Home className="h-3.5 w-3.5" />}
              {selectedRole === "owner" ? "Vermieter" : "Mieter"}
            </span>
          </div>

          <h2 className="text-2xl font-heading font-bold text-foreground">
            {isLogin ? "Willkommen zurück" : "Konto erstellen"}
          </h2>
          <p className="text-muted-foreground text-sm mt-1 mb-6">
            {isLogin ? "Melden Sie sich an, um fortzufahren." : "Erstellen Sie Ihr WillProp Konto."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Max Mustermann" required value={nameField} onChange={e => setNameField(e.target.value)} />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input id="email" type="email" placeholder="name@beispiel.de" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); setPasswordError(""); }}
                required
                minLength={6}
              />
            </div>
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="passwordConfirm">Passwort bestätigen</Label>
                <Input
                  id="passwordConfirm"
                  type="password"
                  placeholder="••••••••"
                  value={passwordConfirm}
                  onChange={e => { setPasswordConfirm(e.target.value); setPasswordError(""); }}
                  required
                  minLength={6}
                />
              </div>
            )}
            {passwordError && (
              <p className="text-sm text-destructive">{passwordError}</p>
            )}
            {isLogin && (
              <button type="button" className="text-sm text-accent hover:underline">
                Passwort vergessen?
              </button>
            )}
            <Button type="submit" className="w-full">
              {isLogin ? "Anmelden" : "Registrieren"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {isLogin ? "Noch kein Konto?" : "Bereits registriert?"}{" "}
            <button onClick={() => { setIsLogin(!isLogin); setPasswordError(""); setPassword(""); setPasswordConfirm(""); }} className="text-accent font-medium hover:underline">
              {isLogin ? "Jetzt registrieren" : "Anmelden"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
