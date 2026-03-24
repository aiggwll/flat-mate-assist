import { Building2, AlertTriangle, ArrowRight, CircleDot } from "lucide-react";
import InviteTenantDialog from "@/components/InviteTenantDialog";
import { properties, messages, payments } from "@/lib/dummy-data";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

const DashboardPage = () => {
  const totalUnits = properties.reduce((sum, p) => sum + p.units.length, 0);
  const occupiedUnits = properties.reduce((sum, p) => sum + p.units.filter(u => u.tenant).length, 0);
  const totalDamages = properties.reduce((sum, p) => sum + p.units.reduce((s, u) => s + u.damages.filter(d => d.status !== "erledigt").length, 0), 0);
  const totalMonthlyRent = properties.reduce((sum, p) => sum + p.units.filter(u => u.tenant).reduce((s, u) => s + u.rent, 0), 0);
  const unpaidPayments = payments.filter(p => !p.paid);
  const unreadMessages = messages.filter(m => !m.read);
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Hallo, Max</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {properties.length} {properties.length === 1 ? "Immobilie" : "Immobilien"} · {totalUnits} Wohnungen
          </p>
        </div>
        <InviteTenantDialog />
      </div>

      {/* Key numbers – single hero row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Mieteinnahmen</p>
          <p className="text-2xl font-heading font-bold text-accent mt-1">{totalMonthlyRent.toLocaleString("de-DE")} €</p>
          <p className="text-xs text-muted-foreground mt-0.5">pro Monat</p>
        </div>
        <div className="bg-card rounded-xl border p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Auslastung</p>
          <p className="text-2xl font-heading font-bold text-foreground mt-1">{occupancyRate}%</p>
          <p className="text-xs text-muted-foreground mt-0.5">{occupiedUnits} von {totalUnits} vermietet</p>
        </div>
        <div className="bg-card rounded-xl border p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Offene Zahlungen</p>
          <p className={`text-2xl font-heading font-bold mt-1 ${unpaidPayments.length > 0 ? "text-destructive" : "text-foreground"}`}>{unpaidPayments.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{unpaidPayments.reduce((s, p) => s + p.amount, 0).toLocaleString("de-DE")} € ausstehend</p>
        </div>
        <div className="bg-card rounded-xl border p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Offene Schäden</p>
          <p className={`text-2xl font-heading font-bold mt-1 ${totalDamages > 0 ? "text-destructive" : "text-foreground"}`}>{totalDamages}</p>
          <p className="text-xs text-muted-foreground mt-0.5">in {properties.filter(p => p.units.some(u => u.damages.some(d => d.status !== "erledigt"))).length} Immobilien</p>
        </div>
      </div>

      {/* Properties quick overview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading font-semibold text-foreground">Meine Immobilien</h2>
          <Link to="/properties" className="text-sm text-accent hover:underline flex items-center gap-1">
            Alle anzeigen <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {properties.map(p => {
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
      </div>

      {/* Activity feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending payments */}
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

        {/* Unread messages */}
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
    </div>
  );
};

export default DashboardPage;
