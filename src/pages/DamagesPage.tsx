import { properties } from "@/lib/dummy-data";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const allDamages = properties.flatMap(p =>
  p.units.flatMap(u =>
    u.damages.map(d => ({
      ...d,
      propertyAddress: p.address,
      unitNumber: u.number,
    }))
  )
);

const statusColor: Record<string, string> = {
  offen: "bg-destructive/10 text-destructive border-0",
  "in Bearbeitung": "bg-warning/10 text-warning border-0",
  erledigt: "bg-accent/10 text-accent border-0",
};

const DamagesPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Schadenmeldungen</h1>
        <p className="text-muted-foreground text-sm mt-1">{allDamages.filter(d => d.status !== "erledigt").length} offene Meldungen</p>
      </div>

      <div className="space-y-3">
        {allDamages.map(d => (
          <div key={d.id} className="bg-card rounded-xl border p-5 flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-heading font-semibold text-foreground">{d.title}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{d.description}</p>
                </div>
                <Badge className={statusColor[d.status]}>{d.status}</Badge>
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span>{d.propertyAddress} · Whg. {d.unitNumber}</span>
                <span>Kategorie: {d.category}</span>
                <span>Gemeldet: {new Date(d.reportedAt).toLocaleDateString("de-DE")}</span>
                <span>von {d.reportedBy}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DamagesPage;
