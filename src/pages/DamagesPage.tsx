import { useState, useRef } from "react";
import { useUser } from "@/contexts/UserContext";
import { type Damage } from "@/lib/dummy-data";
import { AlertTriangle, Plus, ImagePlus, X, Camera } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

interface DamageWithContext extends Damage {
  propertyAddress: string;
  unitNumber: string;
  photos?: string[];
}

const initialDamages: DamageWithContext[] = [];

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

const DamagesPage = () => {
  const [damages, setDamages] = useState<DamageWithContext[]>(initialDamages);
  const [open, setOpen] = useState(false);
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "" as Damage["category"] | "",
    propertyId: "",
    unitId: "",
  });

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const selectedProperty = properties.find(p => p.id === form.propertyId);
  const availableUnits = selectedProperty?.units ?? [];

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

  const handleSubmit = () => {
    if (!form.title || !form.description || !form.category || !form.propertyId || !form.unitId) {
      toast.error("Bitte füllen Sie alle Pflichtfelder aus.");
      return;
    }

    const property = properties.find(p => p.id === form.propertyId);
    const unit = property?.units.find(u => u.id === form.unitId);

    const newDamage: DamageWithContext = {
      id: `dm-new-${Date.now()}`,
      title: form.title,
      description: form.description,
      category: form.category as Damage["category"],
      status: "offen",
      reportedAt: new Date().toISOString().split("T")[0],
      reportedBy: unit?.tenant?.name ?? "Mieter",
      propertyAddress: property?.address ?? "",
      unitNumber: unit?.number ?? "",
      photos: photos.map(p => p.preview),
    };

    setDamages(prev => [newDamage, ...prev]);
    toast.success("Schaden erfolgreich gemeldet!");
    setOpen(false);
    setForm({ title: "", description: "", category: "", propertyId: "", unitId: "" });
    setPhotos([]);
  };

  const openDamages = damages.filter(d => d.status !== "erledigt");
  const closedDamages = damages.filter(d => d.status === "erledigt");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Schadenmeldungen</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {openDamages.length} offene Meldungen
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Schaden melden
        </Button>
      </div>

      {/* Damage List */}
      <div className="space-y-3">
        {openDamages.map(d => (
          <DamageCard key={d.id} damage={d} />
        ))}
      </div>

      {closedDamages.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-heading font-semibold text-muted-foreground">
            Erledigte Meldungen ({closedDamages.length})
          </h2>
          {closedDamages.map(d => (
            <DamageCard key={d.id} damage={d} />
          ))}
        </div>
      )}

      {/* New Damage Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Neuen Schaden melden</DialogTitle>
            <DialogDescription>
              Beschreiben Sie den Schaden und fügen Sie optional Fotos hinzu.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Property & Unit Selection */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Immobilie *</Label>
                <Select value={form.propertyId} onValueChange={v => { update("propertyId", v); update("unitId", ""); }}>
                  <SelectTrigger><SelectValue placeholder="Auswählen" /></SelectTrigger>
                  <SelectContent>
                    {properties.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.address}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Wohnung *</Label>
                <Select value={form.unitId} onValueChange={v => update("unitId", v)} disabled={!form.propertyId}>
                  <SelectTrigger><SelectValue placeholder="Auswählen" /></SelectTrigger>
                  <SelectContent>
                    {availableUnits.map(u => (
                      <SelectItem key={u.id} value={u.id}>Whg. {u.number}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Title */}
            <div>
              <Label>Titel *</Label>
              <Input placeholder="z.B. Heizung defekt" value={form.title} onChange={e => update("title", e.target.value)} />
            </div>

            {/* Category */}
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

            {/* Description */}
            <div>
              <Label>Beschreibung *</Label>
              <Textarea
                placeholder="Beschreiben Sie den Schaden möglichst genau..."
                value={form.description}
                onChange={e => update("description", e.target.value)}
                rows={4}
              />
            </div>

            {/* Photo Upload */}
            <div>
              <Label>Fotos (max. 5)</Label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={e => handlePhotos(e.target.files)}
              />
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

const DamageCard = ({ damage }: { damage: DamageWithContext }) => (
  <div className="bg-card rounded-xl border p-5">
    <div className="flex items-start gap-4">
      <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center text-lg shrink-0">
        {categoryIcon[damage.category] ?? "🔧"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-heading font-semibold text-foreground">{damage.title}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">{damage.description}</p>
          </div>
          <Badge className={statusColor[damage.status]}>{damage.status}</Badge>
        </div>

        {damage.photos && damage.photos.length > 0 && (
          <div className="flex gap-2 mt-3">
            {damage.photos.map((src, i) => (
              <div key={i} className="h-16 w-16 rounded-lg overflow-hidden border">
                <img src={src} alt={`Schaden Foto ${i + 1}`} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 mt-3 pt-3 border-t text-xs text-muted-foreground flex-wrap">
          <span>{damage.propertyAddress} · Whg. {damage.unitNumber}</span>
          <span>Kategorie: {damage.category}</span>
          <span>Gemeldet: {new Date(damage.reportedAt).toLocaleDateString("de-DE")}</span>
          <span>von {damage.reportedBy}</span>
        </div>
      </div>
    </div>
  </div>
);

export default DamagesPage;
