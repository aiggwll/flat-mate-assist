import { useState } from "react";
import { marketplaceListings, type MarketplaceListing } from "@/lib/dummy-data";
import { MapPin, TrendingUp, Maximize2, X, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const MarketplacePage = () => {
  const [selected, setSelected] = useState<MarketplaceListing | null>(null);

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
                <p className="text-xl font-heading font-bold text-foreground">{formatCurrency(listing.price)}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Maximize2 className="h-3 w-3" />
                  {listing.livingArea} m²
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setSelected(listing)}>Details ansehen</Button>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="sm:max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-heading">{selected.address}</DialogTitle>
              </DialogHeader>

              {/* Placeholder image */}
              <div className="w-full h-48 bg-muted rounded-xl flex items-center justify-center">
                <MapPin className="h-12 w-12 text-muted-foreground/30" />
              </div>

              <div className="space-y-4">
                {/* Key stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Kaufpreis</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">{formatCurrency(selected.price)}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Wohnfläche</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">{selected.livingArea} m²</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Rendite</p>
                    <p className="text-sm font-bold text-accent mt-0.5">{selected.rentYield}%</p>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Standort</p>
                  <div className="flex items-center gap-1.5 text-sm text-foreground">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {selected.address}, {selected.city}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Beschreibung</p>
                  <p className="text-sm text-foreground leading-relaxed">{selected.description}</p>
                </div>

                {/* Price per sqm */}
                <div className="bg-muted/30 rounded-lg p-3 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Preis pro m²</span>
                  <span className="text-sm font-semibold text-foreground">
                    {formatCurrency(Math.round(selected.price / selected.livingArea))}
                  </span>
                </div>

                {/* CTA */}
                <Button
                  className="w-full"
                  onClick={() => {
                    toast.success("Ihre Anfrage wurde versendet. Wir melden uns bei Ihnen.");
                    setSelected(null);
                  }}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Interesse bekunden
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MarketplacePage;