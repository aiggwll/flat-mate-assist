import { useParams, Link } from "react-router-dom";
import { Building2, MapPin, ArrowLeft, User, FileText, AlertTriangle } from "lucide-react";
import { properties } from "@/lib/dummy-data";
import { Badge } from "@/components/ui/badge";

const PropertyDetailPage = () => {
  const { id } = useParams();
  const property = properties.find(p => p.id === id);

  if (!property) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Immobilie nicht gefunden.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/properties" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" />
          Zurück
        </Link>
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">{property.address}</h1>
            <div className="flex items-center gap-1.5 text-muted-foreground mt-1">
              <MapPin className="h-3.5 w-3.5" />
              <span className="text-sm">{property.zipCode} {property.city} · Baujahr {property.yearBuilt}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="font-heading font-semibold text-foreground">Wohnungen ({property.units.length})</h2>
        <div className="space-y-3">
          {property.units.map(unit => (
            <div key={unit.id} className="bg-card rounded-xl border p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-heading font-semibold text-foreground">Whg. {unit.number}</h3>
                  <p className="text-sm text-muted-foreground">{unit.size} m² · {unit.rent.toLocaleString("de-DE")} €/Monat</p>
                </div>
                {unit.tenant ? (
                  <Badge variant="secondary" className="bg-accent/10 text-accent border-0">Vermietet</Badge>
                ) : (
                  <Badge variant="secondary" className="bg-warning/10 text-warning border-0">Leerstand</Badge>
                )}
              </div>

              {unit.tenant && (
                <div className="mt-3 pt-3 border-t flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                    {unit.tenant.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{unit.tenant.name}</p>
                    <p className="text-xs text-muted-foreground">Einzug: {new Date(unit.tenant.moveInDate).toLocaleDateString("de-DE")}</p>
                  </div>
                </div>
              )}

              <div className="mt-3 pt-3 border-t flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" />
                  <span>{unit.documents.length} Dokumente</span>
                </div>
                {unit.damages.filter(d => d.status !== "erledigt").length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-destructive">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>{unit.damages.filter(d => d.status !== "erledigt").length} offene Schäden</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailPage;
