import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, MapPin, Plus, Calendar, Layers, UserPlus } from "lucide-react";
import { sal } from "@/lib/salutation";
import EmptyState from "@/components/EmptyState";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import InviteTenantDialog from "@/components/InviteTenantDialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/UserContext";

const PropertiesPage = () => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    address: "", city: "", zipCode: "", yearBuilt: "", type: "", floors: "",
    totalArea: "", plotSize: "", units: "", parking: "", heating: "", energyClass: "", notes: "",
  });

  const navigate = useNavigate();
  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));
  const { userProperties, setUserProperties, salutation } = useUser();

  const handleSubmit = async () => {
    if (!form.address || !form.city || !form.zipCode) {
      toast.error("Bitte füllen Sie mindestens Adresse, Stadt und PLZ aus.");
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Nicht eingeloggt."); return; }
    const { data: inserted, error } = await supabase.from("properties").insert({
      user_id: user.id, address: form.address.trim(), city: form.city.trim(),
      zip_code: form.zipCode.trim(), year_built: parseInt(form.yearBuilt) || 0,
      units: parseInt(form.units) || 1,
    }).select().single();
    if (error) { toast.error("Fehler: " + error.message); return; }
    if (inserted) {
      setUserProperties([...userProperties, {
        id: inserted.id, address: inserted.address, city: inserted.city,
        zipCode: inserted.zip_code, yearBuilt: inserted.year_built ?? 0, units: inserted.units ?? 1,
      }]);
    }
    toast.success("Immobilie erfolgreich angelegt!");
    setOpen(false);
    setForm({ address: "", city: "", zipCode: "", yearBuilt: "", type: "", floors: "", totalArea: "", plotSize: "", units: "", parking: "", heating: "", energyClass: "", notes: "" });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Immobilien</h1>
          <p className="text-muted-foreground text-sm mt-1.5">{userProperties.length} {userProperties.length === 1 ? "Immobilie" : "Immobilien"} verwaltet</p>
        </div>
        <Button onClick={() => setOpen(true)} size="lg">
          <Plus className="h-4 w-4 mr-2" />
          Neue Immobilie
        </Button>
      </div>

      {userProperties.length === 0 ? (
        <EmptyState
          icon={Building2}
          headline={sal(salutation || "sie", "Legen Sie Ihre erste Immobilie an", "Leg deine erste Immobilie an")}
          subtext="Adresse, Mieter und Dokumente — alles an einem Ort."
          buttonLabel="Immobilie hinzufügen"
          onAction={() => setOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {userProperties.map((p) => (
            <div key={p.id} className="bg-card rounded-2xl border border-t-4 border-t-primary overflow-hidden hover:shadow-md transition-all group">
              {/* Colored header */}
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-5 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-card flex items-center justify-center text-primary shadow-sm">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-heading font-semibold text-foreground">{p.address}</h3>
                      <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
                        <MapPin className="h-3 w-3" />
                        <span className="text-xs">{p.zipCode} {p.city}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {p.yearBuilt > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                      <span>Bj. {p.yearBuilt}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Layers className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                    <span>{p.units ?? 1} Wohnungen</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(`/properties/${p.id}`)}>Details</Button>
                  <InviteTenantDialog />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Neue Immobilie anlegen</DialogTitle>
            <DialogDescription>Geben Sie die Details der Immobilie ein.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Adresse</h3>
            <div className="grid gap-3">
              <div>
                <Label htmlFor="address">Straße & Hausnummer *</Label>
                <Input id="address" placeholder="z.B. Berliner Str. 42" value={form.address} onChange={e => update("address", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="zipCode">PLZ *</Label>
                  <Input id="zipCode" placeholder="z.B. 10115" value={form.zipCode} onChange={e => update("zipCode", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="city">Stadt *</Label>
                  <Input id="city" placeholder="z.B. Berlin" value={form.city} onChange={e => update("city", e.target.value)} />
                </div>
              </div>
            </div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mt-2">Gebäudedetails</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="type">Gebäudetyp</Label>
                <Select value={form.type} onValueChange={v => update("type", v)}>
                  <SelectTrigger id="type"><SelectValue placeholder="Auswählen" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mfh">Mehrfamilienhaus</SelectItem>
                    <SelectItem value="efh">Einfamilienhaus</SelectItem>
                    <SelectItem value="dhh">Doppelhaushälfte</SelectItem>
                    <SelectItem value="rh">Reihenhaus</SelectItem>
                    <SelectItem value="etw">Eigentumswohnung</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="yearBuilt">Baujahr</Label>
                <Input id="yearBuilt" type="number" placeholder="z.B. 1998" value={form.yearBuilt} onChange={e => update("yearBuilt", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="floors">Stockwerke</Label>
                <Input id="floors" type="number" placeholder="z.B. 3" value={form.floors} onChange={e => update("floors", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="units">Anzahl Wohnungen</Label>
                <Input id="units" type="number" placeholder="z.B. 6" value={form.units} onChange={e => update("units", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="totalArea">Gesamtfläche (m²)</Label>
                <Input id="totalArea" type="number" placeholder="z.B. 450" value={form.totalArea} onChange={e => update("totalArea", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="plotSize">Grundstücksfläche (m²)</Label>
                <Input id="plotSize" type="number" placeholder="z.B. 800" value={form.plotSize} onChange={e => update("plotSize", e.target.value)} />
              </div>
            </div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mt-2">Ausstattung</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="parking">Stellplätze</Label>
                <Input id="parking" type="number" placeholder="z.B. 4" value={form.parking} onChange={e => update("parking", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="heating">Heizungsart</Label>
                <Select value={form.heating} onValueChange={v => update("heating", v)}>
                  <SelectTrigger id="heating"><SelectValue placeholder="Auswählen" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gas">Gas</SelectItem>
                    <SelectItem value="oel">Öl</SelectItem>
                    <SelectItem value="fernwaerme">Fernwärme</SelectItem>
                    <SelectItem value="waermepumpe">Wärmepumpe</SelectItem>
                    <SelectItem value="pellets">Pellets</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="energyClass">Energieeffizienzklasse</Label>
                <Select value={form.energyClass} onValueChange={v => update("energyClass", v)}>
                  <SelectTrigger id="energyClass"><SelectValue placeholder="Auswählen" /></SelectTrigger>
                  <SelectContent>
                    {["A+", "A", "B", "C", "D", "E", "F", "G", "H"].map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-2">
              <Label htmlFor="notes">Notizen</Label>
              <Textarea id="notes" placeholder="Weitere Informationen zur Immobilie..." value={form.notes} onChange={e => update("notes", e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button>
            <Button onClick={handleSubmit}>Immobilie anlegen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PropertiesPage;
