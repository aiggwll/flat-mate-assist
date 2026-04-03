import { useState, useEffect } from "react";
import { Building2, ArrowRight, TrendingUp, Info, MapPin, MessageSquare, AlertTriangle } from "lucide-react";
import InviteTenantDialog from "@/components/InviteTenantDialog";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useUser } from "@/contexts/UserContext";
import { useMessages } from "@/contexts/MessagesContext";
import { supabase } from "@/integrations/supabase/client";

interface TenantInfo {
  name: string;
  email: string;
  property_id: string;
  unit_id: string;
}

const DashboardPage = () => {
  const { userName, userProperties } = useUser();
  const { messages } = useMessages();
  const displayName = userName || "Eigentümer";

  const [tenants, setTenants] = useState<TenantInfo[]>([]);

  // Load real tenants from DB
  useEffect(() => {
    const loadTenants = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("name, email, property_id, unit_id")
        .eq("role", "tenant")
        .not("property_id", "is", null);
      if (data) {
        setTenants(data.map(t => ({
          name: t.name,
          email: t.email,
          property_id: t.property_id || "",
          unit_id: t.unit_id || "",
        })));
      }
    };
    loadTenants();
  }, []);

  const propertyCount = userProperties.length;
  const totalUnits = userProperties.reduce((sum, p) => sum + p.units, 0);

  // Count unread messages for this owner
  const unreadMessages = messages.filter(m => m.to === displayName && !m.read);

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Hallo, {displayName.split(" ")[0]}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {propertyCount} {propertyCount === 1 ? "Immobilie" : "Immobilien"} · {totalUnits} {totalUnits === 1 ? "Wohnung" : "Wohnungen"}
          </p>
        </div>
        <InviteTenantDialog />
      </div>

      {/* Key numbers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Mieter</p>
          <p className="text-2xl font-heading font-bold text-accent mt-1">{tenants.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {tenants.length === 0 ? "Noch keine Mieter registriert" : "registrierte Mieter"}
          </p>
        </div>
        <div className="bg-card rounded-xl border p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Nachrichten</p>
          <p className={`text-2xl font-heading font-bold mt-1 ${unreadMessages.length > 0 ? "text-accent" : "text-foreground"}`}>
            {unreadMessages.length}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {unreadMessages.length === 0 ? "Keine ungelesenen" : "ungelesene Nachrichten"}
          </p>
        </div>
        <Link to="/damages" className="bg-card rounded-xl border p-5 hover:border-accent/40 transition-colors block">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Offene Schäden</p>
          <p className="text-2xl font-heading font-bold mt-1 text-foreground">0</p>
          <p className="text-xs text-muted-foreground mt-0.5">Keine gemeldet</p>
        </Link>
      </div>

      {/* Properties overview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading font-semibold text-foreground">Meine Immobilien</h2>
        </div>

        {propertyCount === 0 ? (
          <div className="bg-card rounded-xl border p-12 text-center space-y-3">
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mx-auto">
              <Building2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">Noch keine Immobilien angelegt</p>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Legen Sie Ihre erste Immobilie an, um Mieter einladen zu können.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {userProperties.map(p => {
              // Find tenants assigned to this property
              const propertyTenants = tenants.filter(t =>
                t.property_id === `${p.address}, ${p.city}` || t.property_id.includes(p.address)
              );

              return (
                <div key={p.id} className="bg-card rounded-xl border p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary shrink-0">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{p.address}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{p.zipCode} {p.city}</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Wohneinheiten</p>
                      <p className="text-sm font-semibold text-foreground">{p.units}</p>
                    </div>
                    {p.yearBuilt > 0 && (
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Baujahr</p>
                        <p className="text-sm font-semibold text-foreground">{p.yearBuilt}</p>
                      </div>
                    )}
                  </div>
                  <div className="pt-2 border-t">
                    {propertyTenants.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">Noch keine Mieter hinterlegt</p>
                    ) : (
                      <div className="space-y-1">
                        {propertyTenants.map((t, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="h-5 w-5 rounded-full bg-accent/10 flex items-center justify-center">
                              <span className="text-[8px] font-bold text-accent">
                                {t.name.split(" ").map(n => n[0]).join("")}
                              </span>
                            </div>
                            <p className="text-xs text-foreground">{t.name}</p>
                            <p className="text-[10px] text-muted-foreground">· {t.unit_id}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent messages */}
      {unreadMessages.length > 0 && (
        <div className="bg-card rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-foreground text-sm">
              Neue Nachrichten
              <Badge variant="secondary" className="ml-2 bg-accent/10 text-accent border-0 text-[10px]">
                {unreadMessages.length}
              </Badge>
            </h2>
            <Link to="/chat" className="text-xs text-accent hover:underline">Alle</Link>
          </div>
          <div className="space-y-0 divide-y">
            {unreadMessages.slice(0, 4).map(m => (
              <div key={m.id} className="flex items-start gap-3 py-2.5">
                <div className="h-7 w-7 rounded-full bg-accent/10 flex items-center justify-center text-[10px] font-bold text-accent shrink-0 mt-0.5">
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
        <div className="bg-accent/5 border border-accent/20 rounded-xl p-6 text-center space-y-2">
          <p className="text-sm font-medium text-foreground">🎉 Ihre Immobilien wurden angelegt!</p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Im nächsten Schritt können Sie Mieter einladen, um alle Funktionen wie Nachrichten, Schadenmeldungen und Dokumentenverwaltung zu nutzen.
          </p>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
