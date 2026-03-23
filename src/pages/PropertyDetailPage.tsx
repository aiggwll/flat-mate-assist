import { useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Building2, MapPin, ArrowLeft, User, FileText, AlertTriangle, Plus, Camera, X, CheckCircle2, Clock } from "lucide-react";
import { properties, type Damage } from "@/lib/dummy-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

const statusColor: Record<string, string> = {
  offen: "bg-destructive/10 text-destructive border-0",
  "in Bearbeitung": "bg-warning/10 text-warning border-0",
  erledigt: "bg-accent/10 text-accent border-0",
};

const categoryIcon: Record<string, string> = {
  Heizung: "🔥",
  Wasser: "💧",
  Elektrik: "⚡",
  Sonstiges: "🔧",
};

interface DamageWithPhotos extends Damage {
  photos?: string[];
}

const PropertyDetailPage = () => {
  const { id } = useParams();
  const property = properties.find(p => p.id === id);

  const [extraDamages, setExtraDamages] = useState<Record<string, DamageWithPhotos[]>>({});
  const [open, setOpen] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ title: "", description: "", category: "" as Damage["category"] | "" });

  if (!property) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Immobilie nicht gefunden.</p>
      </div>
    );
  }

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handlePhotos = (files: FileList | null) => {
    if (!files) return;
    const newPhotos = Array.from(files).slice(0, 5 - photos.length).map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPhotos(prev => [...prev, ...newPhotos]);
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const openReportDialog = (unitId: string) => {
    setSelectedUnitId(unitId);
    setOpen(true);
  };

  const handleSubmit = () => {
    if (!form.title || !form.description || !form.category) {
      toast.error("Bitte füllen Sie alle Pflichtfelder aus.");
      return;
    }

    const unit = property.units.find(u => u.id === selectedUnitId);
    const newDamage: DamageWithPhotos = {
      id: `dm-new-${Date.now()}`,
      title: form.title,
      description: form.description,
      category: form.category as Damage["category"],
      status: "offen",
      reportedAt: new Date().toISOString().split("T")[0],
      reportedBy: unit?.tenant?.name ?? "Mieter",
      photos: photos.map(p => p.preview),
    };

    setExtraDamages(prev => ({
      ...prev,
      [selectedUnitId]: [...(prev[selectedUnitId] ?? []), newDamage],
    }));
    toast.success("Schaden erfolgreich gemeldet!");
    setOpen(false);
    setForm({ title: "", description: "", category: "" });
    setPhotos([]);
  };

  const getDamagesForUnit = (unitId: string, baseDamages: Damage[]): DamageWithPhotos[] => {
    return [...baseDamages, ...(extraDamages[unitId] ?? [])];
  };

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
          {property.units.map(unit => {
            const allDamages = getDamagesForUnit(unit.id, unit.damages);
            const openDamages = allDamages.filter(d => d.status !== "erledigt");

            return (
              <div key={unit.id} className="bg-card rounded-xl border p-5 space-y-0">
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
                  {openDamages.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-destructive">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>{openDamages.length} offene Schäden</span>
                    </div>
                  )}
                </div>

                {/* Damages section inline */}
                {allDamages.length > 0 && (
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Schadenmeldungen
                    </h4>
                    {allDamages.map(damage => (
                      <div key={damage.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <span className="text-lg">{categoryIcon[damage.category] ?? "🔧"}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-foreground">{damage.title}</p>
                            <Badge className={statusColor[damage.status]}>{damage.status}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{damage.description}</p>
                          {damage.photos && damage.photos.length > 0 && (
                            <div className="flex gap-1.5 mt-2">
                              {damage.photos.map((src, i) => (
                                <div key={i} className="h-12 w-12 rounded-md overflow-hidden border">
                                  <img src={src} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                                </div>
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(damage.reportedAt).toLocaleDateString("de-DE")} · {damage.reportedBy}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Report damage button */}
                {unit.tenant && (
                  <div className="mt-3 pt-3 border-t">
                    <Button variant="outline" size="sm" onClick={() => openReportDialog(unit.id)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Schaden melden
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Report Damage Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Neuen Schaden melden</DialogTitle>
            <DialogDescription>
              Beschreiben Sie den Schaden und fügen Sie optional Fotos hinzu.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div>
              <Label>Titel *</Label>
              <Input placeholder="z.B. Heizung defekt" value={form.title} onChange={e => update("title", e.target.value)} />
            </div>

            <div>
              <Label>Kategorie *</Label>
              <Select value={form.category} onValueChange={v => update("category", v)}>
                <SelectTrigger><SelectValue placeholder="Kategorie wählen" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Heizung">🔥 Heizung</SelectItem>
                  <SelectItem value="Wasser">💧 Wasser</SelectItem>
                  <SelectItem value="Elektrik">⚡ Elektrik</SelectItem>
                  <SelectItem value="Sonstiges">🔧 Sonstiges</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Beschreibung *</Label>
              <Textarea
                placeholder="Beschreiben Sie den Schaden möglichst genau..."
                value={form.description}
                onChange={e => update("description", e.target.value)}
                rows={4}
              />
            </div>

            <div>
              <Label>Fotos (max. 5)</Label>
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handlePhotos(e.target.files)} />
              <div className="mt-2 flex flex-wrap gap-3">
                {photos.map((photo, i) => (
                  <div key={i} className="relative h-20 w-20 rounded-lg overflow-hidden border group">
                    <img src={photo.preview} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                    <button
                      onClick={() => removePhoto(i)}
                      className="absolute top-1 right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {photos.length < 5 && (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="h-20 w-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-accent hover:text-accent transition-colors"
                  >
                    <Camera className="h-5 w-5" />
                    <span className="text-[10px]">Foto</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button>
            <Button onClick={handleSubmit}>Schaden melden</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PropertyDetailPage;
