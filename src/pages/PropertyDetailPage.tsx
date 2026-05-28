import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Building2, MapPin, ArrowLeft, Plus, Camera, X, FileText, Video, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/integrations/supabase/client";

interface Damage {
  id: string;
  title: string;
  description: string;
  category: string;
  status: "offen" | "in Bearbeitung" | "erledigt";
  reportedAt: string;
  reportedBy: string;
  photos?: string[];
}

const statusColor: Record<string, string> = {
  offen: "bg-destructive/10 text-destructive border-0",
  "in Bearbeitung": "bg-warning/10 text-warning border-0",
  erledigt: "bg-accent/10 text-accent border-0",
};

const PropertyDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProperties, setUserProperties } = useUser();
  const property = userProperties.find(p => p.id === id);

  const [damages, setDamages] = useState<Damage[]>([]);
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasActiveTenants, setHasActiveTenants] = useState(false);
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ title: "", description: "", category: "" as Damage["category"] | "" });

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (!property) return;
    const loadActiveTenants = async () => {
      try {
        const propertyMatch = `${property.address}, ${property.city}`;
        const { data } = await supabase
          .from("profiles")
          .select("user_id, property_id")
          .eq("role", "tenant");
        const active = (data || []).some(
          (profile) =>
            profile.property_id === property.id ||
            profile.property_id === propertyMatch ||
            (profile.property_id && property.address && profile.property_id.includes(property.address))
        );
        setHasActiveTenants(active);
      } catch (e) {
        console.error("Error checking active tenants:", e);
      }
    };
    loadActiveTenants();
  }, [property]);

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
    if (!form.title || !form.description || !form.category) {
      toast.error("Bitte füllen Sie alle Pflichtfelder aus.");
      return;
    }

    const newDamage: Damage = {
      id: `dm-new-${Date.now()}`,
      title: form.title,
      description: form.description,
      category: form.category as Damage["category"],
      status: "offen",
      reportedAt: new Date().toISOString().split("T")[0],
      reportedBy: "Vermieter",
      photos: photos.map(p => p.preview),
    };

    setDamages(prev => [newDamage, ...prev]);
    toast.success("Schaden erfolgreich gemeldet!");
    setOpen(false);
    setForm({ title: "", description: "", category: "" });
    setPhotos([]);
  };

  const handleDeleteProperty = async () => {
    if (!property) return;
    setIsDeleting(true);
    try {
      const isDemo = typeof window !== "undefined" && localStorage.getItem("dwello_demo") === "true";
      const next = userProperties.filter(p => p.id !== property.id);
      if (isDemo) {
        setUserProperties(next);
        localStorage.setItem("dwello_demo_properties", JSON.stringify(next));
      } else {
        await supabase.from("profiles").update({ property_id: null, unit_id: null }).eq("property_id", property.id);
        const { error } = await supabase.from("properties").delete().eq("id", property.id);
        if (error) throw error;
        setUserProperties(next);
      }
      toast.success("Immobilie wurde gelöscht");
      navigate("/properties");
    } catch (e: any) {
      toast.error("Immobilie konnte nicht gelöscht werden: " + (e.message || "Unbekannter Fehler"));
    } finally {
      setIsDeleting(false);
      setDeleteOpen(false);
    }
  };

  if (!property) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Immobilie nicht gefunden.</p>
      </div>
    );
  }

  const openDamages = damages.filter(d => d.status !== "erledigt");
  const unitCount = property.units ?? 1;
  const units = Array.from({ length: unitCount }, (_, i) => ({ id: `${i + 1}`, number: `${i + 1}` }));

  return (
    <div className="space-y-6">
      {/* Header */}
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
              <span className="text-sm">{property.zipCode} {property.city}{property.yearBuilt ? ` · Baujahr ${property.yearBuilt}` : ""}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="units" className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="units" className="text-xs sm:text-sm">Wohnungen</TabsTrigger>
          <TabsTrigger value="documents" className="text-xs sm:text-sm">Dokumente</TabsTrigger>
          <TabsTrigger value="media" className="text-xs sm:text-sm">Begehungen</TabsTrigger>
        </TabsList>

        {/* === Wohnungen Tab === */}
        <TabsContent value="units" className="mt-4">
          <div className="space-y-3">
            {units.map(unit => (
              <div key={unit.id} className="bg-card rounded-xl border p-5 space-y-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading font-semibold text-foreground">Whg. {unit.number}</h3>
                  </div>
                  <Badge variant="secondary" className="bg-warning/10 text-warning border-0">Leerstand</Badge>
                </div>
                <div className="mt-3 pt-3 border-t">
                  <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Schaden melden
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* === Dokumente Tab === */}
        <TabsContent value="documents" className="mt-4">
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <FileText className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm font-medium text-foreground mb-1">Noch keine Dokumente hochgeladen</p>
            <p className="text-xs text-muted-foreground">Laden Sie Ihr erstes Dokument hoch.</p>
          </div>
        </TabsContent>

        {/* === Begehungen Tab === */}
        <TabsContent value="media" className="mt-4">
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Video className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">Keine Begehungen vorhanden.</p>
          </div>
        </TabsContent>
      </Tabs>

      <div className="border-t pt-6">
        <Button
          variant="destructive"
          className="w-full sm:w-auto gap-2"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="h-4 w-4" />
          Immobilie löschen
        </Button>
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
                  <SelectItem value="Heizung & Warmwasser">🔥 Heizung & Warmwasser</SelectItem>
                  <SelectItem value="Wasserrohrbruch / Leckage">💧 Wasserrohrbruch / Leckage</SelectItem>
                  <SelectItem value="Elektrik / Stromausfall">⚡ Elektrik / Stromausfall</SelectItem>
                  <SelectItem value="Fenster & Türen">🪟 Fenster & Türen</SelectItem>
                  <SelectItem value="Dach & Fassade">🏠 Dach & Fassade</SelectItem>
                  <SelectItem value="Schimmel & Feuchtigkeit">🍄 Schimmel & Feuchtigkeit</SelectItem>
                  <SelectItem value="Sanitär / Bad & WC">🚿 Sanitär / Bad & WC</SelectItem>
                  <SelectItem value="Aufzug">🛗 Aufzug</SelectItem>
                  <SelectItem value="Einbruch / Sicherheit">🔒 Einbruch / Sicherheit</SelectItem>
                  <SelectItem value="Strukturschäden / Risse">🏗️ Strukturschäden / Risse</SelectItem>
                  <SelectItem value="Schädlingsbefall">🐭 Schädlingsbefall</SelectItem>
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

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Immobilie löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              {hasActiveTenants
                ? "Diese Immobilie hat noch aktive Mieter. Trotzdem löschen?"
                : `Möchten Sie „${property.name || property.address}“ wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProperty}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Wird gelöscht…" : "Trotzdem löschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PropertyDetailPage;
