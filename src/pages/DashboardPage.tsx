import { useState } from "react";
import { Building2, AlertTriangle, ArrowRight, TrendingUp, Info, Video, Camera, MapPin } from "lucide-react";
import InviteTenantDialog from "@/components/InviteTenantDialog";
import { properties as dummyProperties, messages, payments } from "@/lib/dummy-data";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useUser } from "@/contexts/UserContext";

const DashboardPage = () => {
  const { userName, userProperties, isNewUser } = useUser();
  const displayName = userName || "Max";
  const hasUserProperties = userProperties.length > 0;

  // Use dummy data for existing users, user-created data for new users
  const properties = hasUserProperties ? [] : dummyProperties;

  const totalUnits = hasUserProperties
    ? userProperties.reduce((sum, p) => sum + p.units, 0)
    : properties.reduce((sum, p) => sum + p.units.length, 0);
  const totalDamages = properties.reduce((sum, p) => sum + p.units.reduce((s, u) => s + u.damages.filter(d => d.status !== "erledigt").length, 0), 0);
  const totalMonthlyRent = properties.reduce((sum, p) => sum + p.units.filter(u => u.tenant).reduce((s, u) => s + u.rent, 0), 0);
  const unpaidPayments = hasUserProperties ? [] : payments.filter(p => !p.paid);
  const unreadMessages = hasUserProperties ? [] : messages.filter(m => !m.read);

  const recentMediaUploads = hasUserProperties ? [] : [
    { id: "mu1", tenantName: "Anna Müller", property: "Musterstraße 12", room: "Küche", type: "video" as const, date: "2026-03-23" },
    { id: "mu2", tenantName: "Anna Müller", property: "Musterstraße 12", room: "Badezimmer", type: "video" as const, date: "2026-03-23" },
    { id: "mu3", tenantName: "Thomas Schmidt", property: "Hauptstraße 5", room: "Wohnzimmer", type: "photo" as const, date: "2026-03-22" },
    { id: "mu4", tenantName: "Thomas Schmidt", property: "Hauptstraße 5", room: "Flur", type: "video" as const, date: "2026-03-21" },
  ];

  const rentIncreaseUnits = properties.flatMap(p =>
    p.units.filter(u => {
      if (!u.tenant) return false;
      const months = (Date.now() - new Date(u.tenant.moveInDate).getTime()) / (1000 * 60 * 60 * 24 * 30);
      return months >= 15;
    }).map(u => ({ property: p, unit: u }))
  );

  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const propertyCount = hasUserProperties ? userProperties.length : properties.length;

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
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Mieteinnahmen</p>
          <p className="text-2xl font-heading font-bold text-accent mt-1">
            {hasUserProperties ? "–" : `${totalMonthlyRent.toLocaleString("de-DE")} €`}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {hasUserProperties ? "Noch keine Mieter hinterlegt" : "pro Monat"}
          </p>
        </div>
        <div className="bg-card rounded-xl border p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Offene Zahlungen</p>
          <p className={`text-2xl font-heading font-bold mt-1 ${unpaidPayments.length > 0 ? "text-destructive" : "text-foreground"}`}>{unpaidPayments.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {hasUserProperties ? "Keine ausstehend" : `${unpaidPayments.reduce((s, p) => s + p.amount, 0).toLocaleString("de-DE")} € ausstehend`}
          </p>
        </div>
        <div className="bg-card rounded-xl border p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Offene Schäden</p>
          <p className={`text-2xl font-heading font-bold mt-1 ${totalDamages > 0 ? "text-destructive" : "text-foreground"}`}>{totalDamages}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {hasUserProperties ? "Keine gemeldet" : `in ${properties.filter(p => p.units.some(u => u.damages.some(d => d.status !== "erledigt"))).length} Immobilien`}
          </p>
        </div>
      </div>

      {/* Rent increase hint (only for dummy data) */}
      {rentIncreaseUnits.length > 0 && (
        <div className="bg-accent/5 border border-accent/20 rounded-xl p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                <TrendingUp className="h-4 w-4 text-accent" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Mieterhöhung möglich</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Bei {rentIncreaseUnits.length} {rentIncreaseUnits.length === 1 ? "Wohnung" : "Wohnungen"} könnte eine Mietanpassung geprüft werden.
                </p>
              </div>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => setShowDisclaimer(!showDisclaimer)} className="text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5">
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs text-xs">
                Hinweis anzeigen / ausblenden
              </TooltipContent>
            </Tooltip>
          </div>

          {showDisclaimer && (
            <div className="bg-card rounded-lg border px-4 py-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Diese Angaben dienen ausschließlich der unverbindlichen Information und stellen keine Rechtsberatung dar. WillProp übernimmt keine Haftung für die Richtigkeit, Vollständigkeit oder Aktualität der angezeigten Daten. Bitte prüfen Sie Mieterhöhungen stets unter Berücksichtigung der geltenden gesetzlichen Regelungen (insb. §558 BGB) oder konsultieren Sie einen Fachanwalt.
              </p>
            </div>
          )}

          <div className="space-y-2">
            {rentIncreaseUnits.map(({ property: p, unit: u }) => (
              <Link key={u.id} to={`/properties/${p.id}`} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-accent/5 transition-colors">
                <div>
                  <p className="text-sm text-foreground">{p.address} · Whg. {u.number}</p>
                  <p className="text-xs text-muted-foreground">{u.tenant?.name} · seit {new Date(u.tenant!.moveInDate).toLocaleDateString("de-DE")}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium text-foreground">{u.rent.toLocaleString("de-DE")} €</p>
                  <p className="text-xs text-accent">prüfen</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Properties overview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading font-semibold text-foreground">Meine Immobilien</h2>
          {!hasUserProperties && (
            <Link to="/properties" className="text-sm text-accent hover:underline flex items-center gap-1">
              Alle anzeigen <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {hasUserProperties ? (
          /* User-created properties */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {userProperties.map(p => (
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
                  <p className="text-xs text-muted-foreground italic">Noch keine Mieter hinterlegt</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Dummy properties */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {dummyProperties.map(p => {
              const occupied = p.units.filter(u => u.tenant).length;
              const rent = p.units.filter(u => u.tenant).reduce((s, u) => s + u.rent, 0);
              const openDmg = p.units.reduce((s, u) => s + u.damages.filter(d => d.status !== "erledigt").length, 0);

              return (
                <Link key={p.id} to={`/properties/${p.id}`} className="bg-card rounded-xl border p-4 hover:border-accent/40 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary shrink-0">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground group-hover:text-accent transition-colors truncate">{p.address}</p>
                      <p className="text-xs text-muted-foreground">{p.city} · {occupied}/{p.units.length} vermietet</p>
                    </div>
                    <p className="text-sm font-heading font-semibold text-foreground shrink-0">{rent.toLocaleString("de-DE")} €</p>
                  </div>
                  {openDmg > 0 && (
                    <div className="mt-2 pt-2 border-t flex items-center gap-1.5 text-xs text-destructive">
                      <AlertTriangle className="h-3 w-3" />
                      {openDmg} offene {openDmg === 1 ? "Meldung" : "Meldungen"}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Activity feed (only for dummy data) */}
      {!hasUserProperties && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-semibold text-foreground text-sm">Ausstehende Zahlungen</h2>
              <Link to="/payments" className="text-xs text-accent hover:underline">Alle</Link>
            </div>
            {unpaidPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Alle Mieten eingegangen</p>
            ) : (
              <div className="space-y-0 divide-y">
                {unpaidPayments.slice(0, 4).map(p => (
                  <div key={p.id} className="flex items-center justify-between py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{p.tenantName}</p>
                      <p className="text-xs text-muted-foreground">{p.propertyAddress}</p>
                    </div>
                    <p className="text-sm font-semibold text-destructive shrink-0">{p.amount.toLocaleString("de-DE")} €</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card rounded-xl border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-semibold text-foreground text-sm">
                Neue Nachrichten
                {unreadMessages.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-accent/10 text-accent border-0 text-[10px]">{unreadMessages.length}</Badge>
                )}
              </h2>
              <Link to="/chat" className="text-xs text-accent hover:underline">Alle</Link>
            </div>
            {unreadMessages.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Keine neuen Nachrichten</p>
            ) : (
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
            )}
          </div>
        </div>
      )}

      {/* Media uploads (only for dummy data) */}
      {!hasUserProperties && (
        <div className="bg-card rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-foreground text-sm">
              Videobegehungen & Uploads
              {recentMediaUploads.length > 0 && (
                <Badge variant="secondary" className="ml-2 bg-accent/10 text-accent border-0 text-[10px]">{recentMediaUploads.length}</Badge>
              )}
            </h2>
          </div>
          <div className="space-y-0 divide-y">
            {recentMediaUploads.map(upload => (
              <div key={upload.id} className="flex items-center gap-3 py-2.5">
                <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  {upload.type === "video" ? (
                    <Video className="h-4 w-4 text-accent" />
                  ) : (
                    <Camera className="h-4 w-4 text-accent" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{upload.tenantName}</p>
                  <p className="text-xs text-muted-foreground">{upload.property} · {upload.room}</p>
                </div>
                <div className="text-right shrink-0">
                  <Badge variant="secondary" className="bg-muted text-muted-foreground border-0 text-[10px]">
                    {upload.type === "video" ? "Video" : "Foto"}
                  </Badge>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(upload.date).toLocaleDateString("de-DE")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state hint for new users */}
      {hasUserProperties && (
        <div className="bg-accent/5 border border-accent/20 rounded-xl p-6 text-center space-y-2">
          <p className="text-sm font-medium text-foreground">🎉 Ihre Immobilien wurden angelegt!</p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Im nächsten Schritt können Sie Wohneinheiten anlegen und Mieter einladen, um alle Funktionen wie Zahlungsübersicht, Schadenmeldungen und Kommunikation zu nutzen.
          </p>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
