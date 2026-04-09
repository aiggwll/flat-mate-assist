import { useState, useEffect } from "react";
import { Building2, Users, MessageSquare, AlertTriangle, ArrowRight, MapPin, UserPlus, Clock, CheckCircle2, RotateCcw } from "lucide-react";
import WelcomeSlider from "@/components/WelcomeSlider";
import InviteTenantDialog from "@/components/InviteTenantDialog";
import LandlordOnboarding from "@/components/LandlordOnboarding";
import SetupChecklist from "@/components/SetupChecklist";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/contexts/UserContext";
import { useMessages } from "@/contexts/MessagesContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface TenantInfo {
  name: string;
  email: string;
  property_id: string;
  unit_id: string;
}

interface InvitationInfo {
  id: string;
  email: string;
  tenant_name: string;
  property_id: string;
  unit_id: string;
  status: string;
  invited_at: string;
}

const DashboardPage = () => {
  const { userName, userProperties, salutation, userId, setupWizardComplete, gender, lastName } = useUser();
  const { messages } = useMessages();
  const displayName = userName || "Eigentümer";
  const effectiveSalutation = salutation || "sie";
  const [tenants, setTenants] = useState<TenantInfo[]>([]);
  const [invitations, setInvitations] = useState<InvitationInfo[]>([]);
  const [resending, setResending] = useState<string | null>(null);
  const [hasPayments, setHasPayments] = useState(false);
  const [hasDocuments, setHasDocuments] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem("onboarding_complete_owner") && !setupWizardComplete
  );
  const [showWelcome, setShowWelcome] = useState(
    () => !localStorage.getItem("dwello_welcome_seen") && !setupWizardComplete
  );

  useEffect(() => {
    const loadTenants = async () => {
      if (userProperties.length === 0) {
        setTenants([]);
        return;
      }
      // Build property identifiers to match tenant property_id values
      const propertyIdentifiers = userProperties.flatMap(p => [
        `${p.address}, ${p.city}`,
        p.address,
        p.id,
      ]);
      const { data } = await supabase
        .from("profiles")
        .select("name, email, property_id, unit_id")
        .eq("role", "tenant")
        .not("property_id", "is", null);
      if (data) {
        const filtered = data.filter(t =>
          propertyIdentifiers.some(pid => t.property_id === pid || (t.property_id && t.property_id.includes(pid)))
        );
        setTenants(filtered.map(t => ({
          name: t.name,
          email: t.email,
          property_id: t.property_id || "",
          unit_id: t.unit_id || "",
        })));
      }
    };
    const loadInvitations = async () => {
      if (!userId) return;
      const { data } = await supabase
        .from("invitations" as any)
        .select("id, email, tenant_name, property_id, unit_id, status, invited_at")
        .eq("invited_by", userId)
        .order("invited_at", { ascending: false });
      if (data) {
        setInvitations((data as any[]).map(inv => ({
          id: inv.id,
          email: inv.email,
          tenant_name: inv.tenant_name,
          property_id: inv.property_id,
          unit_id: inv.unit_id,
          status: inv.status,
          invited_at: inv.invited_at,
        })));
      }
    };
    loadTenants();
    loadInvitations();
  }, [userProperties, userId]);

  useEffect(() => {
    if (!userId) return;
    // Reset to false immediately when userId changes to avoid stale state
    setHasPayments(false);
    setHasDocuments(false);
    const checkPayments = async () => {
      const { count } = await supabase
        .from("rent_payments")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      setHasPayments((count ?? 0) > 0);
    };
    const checkDocuments = async () => {
      const { count } = await supabase
        .from("documents")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("category", "Mietvertrag");
      setHasDocuments((count ?? 0) > 0);
    };
    checkPayments();
    checkDocuments();
  }, [userId]);

  const propertyCount = userProperties.length;
  const totalUnits = userProperties.reduce((sum, p) => sum + p.units, 0);
  const unreadMessages = messages.filter(m => m.to === displayName && !m.read);

  return (
    <div className="space-y-10">
      {showWelcome && <WelcomeSlider onComplete={() => setShowWelcome(false)} />}
      <LandlordOnboarding open={showOnboarding && !showWelcome} onComplete={() => setShowOnboarding(false)} />
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/15 via-primary/8 to-primary/3 border p-10">
        <div className="relative z-10">
          <p className="text-sm text-muted-foreground font-medium">Willkommen zurück</p>
          <h1 className="text-3xl font-heading font-extrabold text-foreground mt-1">
            {salutation === "du"
              ? `Hallo, ${displayName.split(" ")[0]}!`
              : gender && lastName
                ? `Guten Tag, ${gender === "Frau" ? "Frau" : "Herr"} ${lastName}.`
                : `Guten Tag, ${displayName.split(" ")[0]}.`}
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            {propertyCount === 0
              ? (salutation === "du" ? "Lege deine erste Immobilie an, um loszulegen." : "Legen Sie Ihre erste Immobilie an, um loszulegen.")
              : (salutation === "du"
                ? `Du verwaltest ${propertyCount} ${propertyCount === 1 ? "Immobilie" : "Immobilien"} mit ${totalUnits} ${totalUnits === 1 ? "Wohneinheit" : "Wohneinheiten"}.`
                : `Sie verwalten ${propertyCount} ${propertyCount === 1 ? "Immobilie" : "Immobilien"} mit ${totalUnits} ${totalUnits === 1 ? "Wohneinheit" : "Wohneinheiten"}.`)}
          </p>
          <div className="mt-5">
            <InviteTenantDialog />
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 right-16 w-32 h-32 bg-primary/3 rounded-full translate-y-1/2" />
      </div>

      {/* Setup Checklist */}
      <SetupChecklist
        hasProperties={userProperties.length > 0}
        hasTenants={tenants.length > 0}
        hasPayments={hasPayments}
        hasMietvertrag={hasDocuments}
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-card rounded-2xl border p-6 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Mieter</p>
            <div className="h-9 w-9 rounded-xl bg-primary/8 flex items-center justify-center">
              <Users className="h-4 w-4 text-primary" />
            </div>
          </div>
          {tenants.length === 0 ? (
            <Link to="/dashboard" className="text-sm text-primary font-medium hover:underline mt-2 block">
              Ersten Mieter einladen →
            </Link>
          ) : (
            <>
              <p className="text-3xl font-heading font-bold text-foreground">{tenants.length}</p>
              <p className="text-xs text-muted-foreground">registrierte Mieter</p>
            </>
          )}
        </div>

        <Link to="/chat" className="bg-card rounded-2xl border p-6 space-y-1 hover:border-primary/30 transition-colors block">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Nachrichten</p>
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${unreadMessages.length > 0 ? "bg-primary/10" : "bg-muted"}`}>
              <MessageSquare className={`h-4 w-4 ${unreadMessages.length > 0 ? "text-primary" : "text-muted-foreground"}`} />
            </div>
          </div>
          {unreadMessages.length === 0 ? (
            <p className="text-sm text-muted-foreground mt-2">Keine ungelesenen</p>
          ) : (
            <>
              <p className="text-3xl font-heading font-bold text-primary">{unreadMessages.length}</p>
              <p className="text-xs text-muted-foreground">ungelesene Nachrichten</p>
            </>
          )}
        </Link>

        <Link to="/damages" className="bg-card rounded-2xl border p-6 space-y-1 hover:border-primary/30 transition-colors block">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Offene Schäden</p>
            <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">Keine gemeldet</p>
        </Link>
      </div>

      {/* Properties */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-heading font-semibold text-foreground">Meine Immobilien</h2>
          {propertyCount > 0 && (
            <Link to="/properties" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
              Alle anzeigen <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {propertyCount === 0 ? (
          <div className="bg-card rounded-2xl border p-14 text-center space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto">
              <Building2 className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="text-base font-medium text-foreground">Noch keine Immobilien angelegt</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                {salutation === "du"
                  ? "Lege deine erste Immobilie an, um Mieter einladen und alle Funktionen nutzen zu können."
                  : "Legen Sie Ihre erste Immobilie an, um Mieter einladen und alle Funktionen nutzen zu können."}
              </p>
            </div>
            <Link to="/properties">
              <Button className="mt-2">
                <Building2 className="h-4 w-4 mr-2" /> Immobilie anlegen
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userProperties.map(p => {
              const propertyTenants = tenants.filter(t =>
                t.property_id === `${p.address}, ${p.city}` || t.property_id.includes(p.address)
              );

              return (
                <div key={p.id} className="bg-card rounded-2xl border overflow-hidden hover:shadow-md transition-all">
                  {/* Colored header */}
                  <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-card flex items-center justify-center text-primary shrink-0 shadow-sm">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-heading font-semibold text-foreground truncate">{p.address}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{p.zipCode} {p.city}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 py-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Wohneinheiten</p>
                        <p className="text-sm font-semibold text-foreground mt-0.5">{p.units}</p>
                      </div>
                      {p.yearBuilt > 0 && (
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Baujahr</p>
                          <p className="text-sm font-semibold text-foreground mt-0.5">{p.yearBuilt}</p>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t">
                      {propertyTenants.length === 0 ? (
                        <InviteTenantDialog />
                      ) : (
                        <div className="space-y-1.5">
                          {propertyTenants.map((t, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-primary/8 flex items-center justify-center">
                                <span className="text-[9px] font-bold text-primary">
                                  {t.name.split(" ").map(n => n[0]).join("")}
                                </span>
                              </div>
                              <p className="text-sm text-foreground">{t.name}</p>
                              <p className="text-xs text-muted-foreground">· {t.unit_id}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent messages */}
      {unreadMessages.length > 0 && (
        <div className="bg-card rounded-2xl border p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-heading font-semibold text-foreground">
              Neue Nachrichten
              <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary border-0 text-[10px]">
                {unreadMessages.length}
              </Badge>
            </h2>
            <Link to="/chat" className="text-sm text-primary font-medium hover:underline">Alle anzeigen</Link>
          </div>
          <div className="space-y-0 divide-y">
            {unreadMessages.slice(0, 4).map(m => (
              <div key={m.id} className="flex items-start gap-3 py-3">
                <div className="h-8 w-8 rounded-full bg-primary/8 flex items-center justify-center text-[10px] font-bold text-primary shrink-0 mt-0.5">
                  {m.from.split(" ").map(n => n[0]).join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{m.from}</p>
                  <p className="text-xs text-muted-foreground truncate">{m.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state hint */}
      {propertyCount > 0 && tenants.length === 0 && (
        <div className="bg-primary/5 border border-primary/15 rounded-2xl p-8 text-center space-y-2">
          <p className="text-base font-medium text-foreground">Ihre Immobilien wurden angelegt</p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {salutation === "du"
              ? "Im nächsten Schritt kannst du Mieter einladen, um alle Funktionen wie Nachrichten, Schadenmeldungen und Dokumentenverwaltung zu nutzen."
              : "Im nächsten Schritt können Sie Mieter einladen, um alle Funktionen wie Nachrichten, Schadenmeldungen und Dokumentenverwaltung zu nutzen."}
          </p>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
