import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Home, Plus, X, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/integrations/supabase/client";

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPropertySetup, setShowPropertySetup] = useState(false);
  const [showTenantPropertyInfo, setShowTenantPropertyInfo] = useState(false);
  const [properties, setProperties] = useState<PropertyForm[]>([{ ...emptyProperty }]);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const navigate = useNavigate();
  const { user: contextUser, setUserName, setUserProperties, setIsNewUser, setUserRole } = useUser();
  const [nameField, setNameField] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPasswordError("");

    try {
      if (isLogin) {
        // Login with timeout to prevent hanging
        const loginPromise = supabase.auth.signInWithPassword({ email, password });
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("TIMEOUT")), 8000)
        );

        let signInResult;
        try {
          signInResult = await Promise.race([loginPromise, timeoutPromise]);
        } catch (err: any) {
          if (err?.message === "TIMEOUT") {
            setPasswordError("Verbindungsfehler. Bitte versuchen Sie es erneut.");
            console.error("Login timeout after 8s");
            return;
          }
          throw err;
        }

        const { data: signInData, error } = signInResult;
        if (error) {
          console.error("Login error:", error);
          setPasswordError(error.message === "Invalid login credentials"
            ? "Ungültige E-Mail oder Passwort."
            : error.message);
          return;
        }

        localStorage.setItem("rememberMe", rememberMe ? "true" : "false");
        const signedInUser = signInData?.user;

        if (signedInUser) {
          // Profile fetch with timeout — navigate even if it fails
          let targetRoute = (signedInUser.user_metadata?.role === "owner") ? "/dashboard" : "/tenant-dashboard";
          try {
            const profilePromise = supabase
              .from("profiles")
              .select("name, role")
              .eq("user_id", signedInUser.id)
              .single();
            const profileTimeout = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error("PROFILE_TIMEOUT")), 5000)
            );
            const { data: profile } = await Promise.race([profilePromise, profileTimeout]);
            if (profile) {
              setUserName(profile.name);
              setUserRole(profile.role as Role);
              targetRoute = profile.role === "owner" ? "/dashboard" : "/tenant-dashboard";
            }
          } catch (profileErr) {
            console.error("Profile fetch failed, using fallback:", profileErr);
            const metaRole = signedInUser.user_metadata?.role as Role || "tenant";
            setUserRole(metaRole);
          }
          setTimeout(() => navigate(targetRoute), 100);
        }
      } else {
        // Register
        if (password.length < 6) {
          setPasswordError("Passwort muss mindestens 6 Zeichen lang sein.");
          setLoading(false);
          return;
        }
        if (password !== passwordConfirm) {
          setPasswordError("Passwörter stimmen nicht überein.");
          setLoading(false);
          return;
        }

        const role = selectedRole || "tenant";
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name: nameField.trim(), role },
            emailRedirectTo: window.location.origin,
          },
        });

        if (error) {
          setPasswordError(error.message);
          setLoading(false);
          return;
        }

        setUserName(nameField.trim() || (role === "owner" ? "Eigentümer" : "Mieter"));
        setUserRole(role);
        setIsNewUser(true);

        // For tenants: save invite property info to profile
        if (role === "tenant" && inviteProperty) {
          const { data: { user: newUser } } = await supabase.auth.getUser();
          if (newUser) {
            await supabase.from("profiles").update({
              property_id: inviteProperty,
              unit_id: searchParams.get("unit") || "",
              owner_name: searchParams.get("owner") || "",
            }).eq("user_id", newUser.id);
          }
        }

        if (role === "owner") {
          setShowPropertySetup(true);
        } else {
          setShowTenantPropertyInfo(true);
        }
      }
    } catch (err) {
      setPasswordError("Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.");
    } finally {
      setLoading(false);
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

  const handlePropertySubmit = async () => {
    const incomplete = properties.some(p => !p.address.trim() || !p.city.trim() || !p.zipCode.trim());
    if (incomplete) {
      toast.error("Bitte füllen Sie mindestens Adresse, Stadt und PLZ aus.");
      return;
    }

    // Try multiple methods to get user: session → context → getUser
    let currentUser = contextUser;
    if (!currentUser) {
      const { data: { session } } = await supabase.auth.getSession();
      currentUser = session?.user ?? null;
    }
    if (!currentUser) {
      const { data: { user: fetchedUser } } = await supabase.auth.getUser();
      currentUser = fetchedUser;
    }

    const rows = properties.map(p => ({
      address: p.address.trim(),
      city: p.city.trim(),
      zip_code: p.zipCode.trim(),
      year_built: parseInt(p.yearBuilt) || 0,
      units: parseInt(p.units) || 1,
    }));

    if (!currentUser) {
      // Fallback: save to localStorage, will sync after next login
      // NOTE: Enable email confirmation in production
      localStorage.setItem("pendingProperties", JSON.stringify(rows));
      toast.info("Immobilien werden nach dem nächsten Login synchronisiert.");
      setUserProperties(rows.map((r, i) => ({
        id: `pending-${i}`,
        address: r.address,
        city: r.city,
        zipCode: r.zip_code,
        yearBuilt: r.year_built,
        units: r.units,
      })));
      navigate("/dashboard");
      return;
    }

    const insertRows = rows.map(r => ({ ...r, user_id: currentUser!.id }));
    const { data: inserted, error } = await supabase.from("properties").insert(insertRows).select();
    if (error) {
      toast.error("Fehler beim Speichern: " + error.message);
      return;
    }
    if (inserted) {
      setUserProperties(inserted.map(p => ({
        id: p.id,
        address: p.address,
        city: p.city,
        zipCode: p.zip_code,
        yearBuilt: p.year_built ?? 0,
        units: p.units ?? 1,
      })));
    }
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
              Dwell<span className="text-accent">o</span>
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
                Dwell<span className="text-accent">o</span>
              </h1>
            </div>

            <h2 className="text-2xl font-heading font-bold text-foreground">Willkommen</h2>
            <p className="text-muted-foreground text-sm mt-1 mb-8">
              Wie möchten Sie Dwello nutzen?
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

  // Tenant property info screen (after registration)
  if (showTenantPropertyInfo) {
    const propertyAddress = inviteProperty || "Berliner Str. 42, Berlin";
    const unitLabel = searchParams.get("unit") || "Whg. 1";
    const ownerName = searchParams.get("owner") || "Ihr Vermieter";

    return (
      <div className="min-h-screen bg-primary flex">
        <div className="flex-1 hidden lg:flex items-center justify-center p-12">
          <div className="max-w-md">
            <h1 className="text-4xl font-heading font-bold text-primary-foreground mb-4 tracking-tight">
              Dwell<span className="text-accent">o</span>
            </h1>
            <p className="text-primary-foreground/70 text-lg leading-relaxed">
              Willkommen in Ihrem Mieterportal. Hier finden Sie alle Informationen zu Ihrer Wohnung.
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
                Dwell<span className="text-accent">o</span>
              </h1>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-5 w-5 text-accent" />
              <span className="text-sm font-medium text-accent">Registrierung erfolgreich</span>
            </div>

            <h2 className="text-2xl font-heading font-bold text-foreground">
              Hallo, {nameField.trim() || "Mieter"}!
            </h2>
            <p className="text-muted-foreground text-sm mt-1 mb-6">
              Hier sind die Informationen zu Ihrer Wohnung.
            </p>

            <div className="p-5 rounded-xl border bg-card space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent shrink-0">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-heading font-semibold text-foreground text-sm">Ihre Wohnung</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Zugewiesen durch Ihren Vermieter</p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Adresse</span>
                  <span className="font-medium text-foreground">{propertyAddress}</span>
                </div>
                <div className="border-t" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Wohnung</span>
                  <span className="font-medium text-foreground">{unitLabel}</span>
                </div>
                <div className="border-t" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vermieter</span>
                  <span className="font-medium text-foreground">{ownerName}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Button className="w-full" onClick={() => navigate("/tenant-dashboard")}>
                Zum Mieterportal →
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Sie können Nachrichten senden, Schäden melden und Dokumente einsehen.
              </p>
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
              Dwell<span className="text-accent">o</span>
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
                Dwell<span className="text-accent">o</span>
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
            Dwell<span className="text-accent">o</span>
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
              Dwell<span className="text-accent">o</span>
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
            {isLogin ? "Melden Sie sich an, um fortzufahren." : "Erstellen Sie Ihr Dwello Konto."}
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
              <Input id="email" type="email" placeholder="name@beispiel.de" required value={email} onChange={e => setEmail(e.target.value)} />
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
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-muted-foreground">Angemeldet bleiben</span>
                </label>
                <button
                  type="button"
                  className="text-sm text-accent hover:underline"
                  onClick={async () => {
                    if (!email) {
                      toast.error("Bitte geben Sie Ihre E-Mail-Adresse ein.");
                      return;
                    }
                    const { error } = await supabase.auth.resetPasswordForEmail(email, {
                      redirectTo: window.location.origin,
                    });
                    if (error) {
                      toast.error(`Fehler: ${error.message}`);
                    } else {
                      toast.success("Eine E-Mail zum Zurücksetzen des Passworts wurde gesendet.");
                    }
                  }}
                >
                  Passwort vergessen?
                </button>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Bitte warten..." : (isLogin ? "Anmelden" : "Registrieren")}
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
