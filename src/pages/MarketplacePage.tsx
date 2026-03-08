import { marketplaceListings } from "@/lib/dummy-data";
import { MapPin, TrendingUp, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const MarketplacePage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Off-Market Marktplatz</h1>
        <p className="text-muted-foreground text-sm mt-1">Exklusive Immobilienangebote für registrierte Eigentümer</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {marketplaceListings.map(listing => (
          <div key={listing.id} className="bg-card rounded-xl border p-5 hover:border-accent/50 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                <span className="text-sm">{listing.city}</span>
              </div>
              <div className="flex items-center gap-1 text-accent font-semibold text-sm">
                <TrendingUp className="h-3.5 w-3.5" />
                {listing.rentYield}% Rendite
              </div>
            </div>
            <h3 className="font-heading font-semibold text-foreground text-lg">{listing.address}</h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{listing.description}</p>
            <div className="flex items-center justify-between mt-4 pt-3 border-t">
              <div className="space-y-0.5">
                <p className="text-xl font-heading font-bold text-foreground">{listing.price.toLocaleString("de-DE")} €</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Maximize2 className="h-3 w-3" />
                  {listing.livingArea} m²
                </div>
              </div>
              <Button variant="outline" size="sm">Details ansehen</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketplacePage;
