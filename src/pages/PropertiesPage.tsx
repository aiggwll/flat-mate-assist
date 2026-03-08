import { Building2, MapPin, Home, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { properties } from "@/lib/dummy-data";

const PropertiesPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Immobilien</h1>
          <p className="text-muted-foreground text-sm mt-1">{properties.length} Immobilien verwaltet</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Neue Immobilie
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {properties.map((p) => {
          const occupiedUnits = p.units.filter(u => u.tenant).length;
          const totalRent = p.units.reduce((sum, u) => sum + u.rent, 0);
          return (
            <Link
              key={p.id}
              to={`/properties/${p.id}`}
              className="bg-card rounded-xl border hover:border-accent/50 hover:shadow-md transition-all p-5 group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary group-hover:bg-accent/10 group-hover:text-accent transition-colors">
                  <Building2 className="h-5 w-5" />
                </div>
                <span className="text-xs text-muted-foreground">Bj. {p.yearBuilt}</span>
              </div>
              <h3 className="font-heading font-semibold text-foreground">{p.address}</h3>
              <div className="flex items-center gap-1 text-muted-foreground mt-1">
                <MapPin className="h-3 w-3" />
                <span className="text-xs">{p.zipCode} {p.city}</span>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Home className="h-3.5 w-3.5" />
                  <span>{occupiedUnits}/{p.units.length} vermietet</span>
                </div>
                <span className="text-sm font-semibold text-accent">{totalRent.toLocaleString("de-DE")} €/M</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default PropertiesPage;
