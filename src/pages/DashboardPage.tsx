import { Building2, Home, CreditCard, MessageSquare, AlertTriangle, TrendingUp } from "lucide-react";
import StatCard from "@/components/StatCard";
import InviteTenantDialog from "@/components/InviteTenantDialog";
import { properties, messages, payments } from "@/lib/dummy-data";
import { Link } from "react-router-dom";

const DashboardPage = () => {
  const totalProperties = properties.length;
  const totalUnits = properties.reduce((sum, p) => sum + p.units.length, 0);
  const totalDamages = properties.reduce((sum, p) => sum + p.units.reduce((s, u) => s + u.damages.filter(d => d.status !== "erledigt").length, 0), 0);
  const unreadMessages = messages.filter(m => !m.read).length;
  const unpaidRents = payments.filter(p => !p.paid);
  const totalMonthlyRent = properties.reduce((sum, p) => sum + p.units.reduce((s, u) => s + u.rent, 0), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Willkommen zurück, Max.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Immobilien" value={totalProperties} icon={Building2} />
        <StatCard title="Wohnungen" value={totalUnits} icon={Home} />
        <StatCard title="Monatl. Mieteinnahmen" value={`${totalMonthlyRent.toLocaleString("de-DE")} €`} icon={TrendingUp} accent />
        <StatCard title="Offene Zahlungen" value={unpaidRents.length} icon={CreditCard} />
        <StatCard title="Neue Nachrichten" value={unreadMessages} icon={MessageSquare} />
        <StatCard title="Offene Schäden" value={totalDamages} icon={AlertTriangle} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-foreground">Letzte Zahlungen</h2>
            <Link to="/payments" className="text-sm text-accent hover:underline">Alle anzeigen</Link>
          </div>
          <div className="space-y-3">
            {payments.slice(0, 4).map(p => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{p.tenantName}</p>
                  <p className="text-xs text-muted-foreground">{p.propertyAddress} · {p.unitNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{p.amount.toLocaleString("de-DE")} €</p>
                  <span className={`text-xs font-medium ${p.paid ? "text-accent" : "text-destructive"}`}>
                    {p.paid ? "Bezahlt" : "Ausstehend"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-foreground">Letzte Nachrichten</h2>
            <Link to="/chat" className="text-sm text-accent hover:underline">Alle anzeigen</Link>
          </div>
          <div className="space-y-3">
            {messages.slice(0, 4).map(m => (
              <div key={m.id} className="flex items-start gap-3 py-2 border-b last:border-0">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${!m.read ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"}`}>
                  {m.from.split(" ").map(n => n[0]).join("")}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{m.from}</p>
                  <p className="text-xs text-muted-foreground truncate">{m.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
