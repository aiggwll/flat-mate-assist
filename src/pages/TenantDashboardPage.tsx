import { useState, useEffect } from "react";
import { toast } from "sonner";

import DocumentManager from "@/components/DocumentManager";
import TenantAiChat from "@/components/TenantAiChat";
import { useSearchParams, NavLink, useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { useMessages } from "@/contexts/MessagesContext";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Building2,
  FileText,
  MessageSquare,
  AlertTriangle,
  Plus,
  Camera,
  X,
  LogOut,
  Upload,
  Video,
  Gift,
} from "lucide-react";

const TenantDashboardPage = () => {
  const [searchParams] = useSearchParams();
  const { userName, userId, signOut } = useUser();
  const { addMessage } = useMessages();
  const navigate = useNavigate();

  // Load real property info from profile
  const [propertyAddress, setPropertyAddress] = useState("Wird geladen...");
  const [unitLabel, setUnitLabel] = useState("");
  const [ownerName, setOwnerName] = useState("Vermieter");
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) return;
      const { data } = await supabase
        .from("profiles")
        .select("property_id, unit_id, owner_name")
        .eq("user_id", userId)
        .single();
      if (data) {
        setPropertyAddress(data.property_id || searchParams.get("property") || "Keine Immobilie");
        setUnitLabel(data.unit_id || searchParams.get("unit") || "");
        setOwnerName((data as any).owner_name || searchParams.get("owner") || "Vermieter");
      }
      setProfileLoaded(true);
    };
    loadProfile();
  }, [userId]);

  const tenantName = userName || "Mieter";
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");

  // Damage report state
  const [damageOpen, setDamageOpen] = useState(false);
  const [damageTitle, setDamageTitle] = useState("");
  const [damageDesc, setDamageDesc] = useState("");
  const [damageCategory, setDamageCategory] = useState("");
  const [damagePhotos, setDamagePhotos] = useState<{ file: File; preview: string }[]>([]);
  const [damages, setDamages] = useState<any[]>([]);


  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      {
        id: `m-${Date.now()}`,
        from: tenantName,
        to: "Eigentümer",
        text: newMessage.trim(),
        timestamp: new Date().toISOString(),
        read: false,
      },
    ]);
    setNewMessage("");
  };

  const handleAddPhotos = (files: FileList | null) => {
    if (!files) return;
    const newPhotos = Array.from(files)
      .slice(0, 5 - damagePhotos.length)
      .map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setDamagePhotos((prev) => [...prev, ...newPhotos]);
  };

  const handleRemovePhoto = (index: number) => {
    setDamagePhotos((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmitDamage = () => {
    if (!damageTitle || !damageDesc || !damageCategory) return;
    const newDamage = {
      id: `dm-${Date.now()}`,
      title: damageTitle,
      description: damageDesc,
      category: damageCategory as "Heizung" | "Wasser" | "Elektrik" | "Sonstiges",
      status: "offen" as const,
      reportedAt: new Date().toISOString().split("T")[0],
      reportedBy: tenantName,
    };
    setDamages((prev) => [...prev, newDamage]);
    setDamageTitle("");
    setDamageDesc("");
    setDamageCategory("");
    setDamagePhotos([]);
    setDamageOpen(false);
  };


  const statusColor = (s: string) => {
    if (s === "offen") return "destructive";
    if (s === "in Bearbeitung") return "secondary";
    return "default";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-heading font-bold text-foreground tracking-tight">
              Will<span className="text-accent">Prop</span>
            </h1>
            <span className="text-sm text-muted-foreground">· Mieterportal</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-foreground">{tenantName}</p>
              <p className="text-xs text-muted-foreground">{propertyAddress}, {unitLabel}</p>
            </div>
            <button
              onClick={async () => { await signOut(); navigate("/"); }}
              className="h-9 w-9 rounded-lg border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Property overview */}
        <Card className="p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-bold text-foreground">{propertyAddress}</h2>
              <p className="text-sm text-muted-foreground">
                Wohnung {unitLabel}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Vermieter: <span className="font-semibold text-foreground">{ownerName}</span>
              </p>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="messages" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="messages" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Nachrichten</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Dokumente</span>
            </TabsTrigger>
            <TabsTrigger value="video360" className="gap-2">
              <Video className="h-4 w-4" />
              <span className="hidden sm:inline">360°</span>
            </TabsTrigger>
          </TabsList>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <TenantAiChat
              propertyInfo={{
                address: propertyAddress,
                unit: unitLabel,
                rent: 0,
                landlord: ownerName,
              }}
              tenantName={tenantName}
              landlordName={ownerName}
              onEscalate={(msg) => {
                addMessage({
                  from: tenantName,
                  to: ownerName,
                  text: msg,
                  timestamp: new Date().toISOString(),
                  read: false,
                });
              }}
              damageButton={
                <Dialog open={damageOpen} onOpenChange={setDamageOpen}>
                  <DialogTrigger asChild>
                    <Button size="icon" variant="outline" title="Schaden melden">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Schaden melden</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <Label>Kategorie</Label>
                        <Select value={damageCategory} onValueChange={setDamageCategory}>
                          <SelectTrigger><SelectValue placeholder="Kategorie wählen" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Heizung">🔥 Heizung</SelectItem>
                            <SelectItem value="Wasser">💧 Wasser</SelectItem>
                            <SelectItem value="Elektrik">⚡ Elektrik</SelectItem>
                            <SelectItem value="Sonstiges">🔧 Sonstiges</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Titel</Label>
                        <Input value={damageTitle} onChange={(e) => setDamageTitle(e.target.value)} placeholder="z.B. Heizung defekt" />
                      </div>
                      <div className="space-y-2">
                        <Label>Beschreibung</Label>
                        <Textarea value={damageDesc} onChange={(e) => setDamageDesc(e.target.value)} placeholder="Beschreiben Sie den Schaden..." rows={3} />
                      </div>
                      <div className="space-y-2">
                        <Label>Fotos & Dateien (max. 5)</Label>
                        <div className="flex flex-wrap gap-2">
                          {damagePhotos.map((photo, i) => (
                            <div key={i} className="relative h-20 w-20 rounded-lg overflow-hidden border">
                              <img src={photo.preview} alt="" className="h-full w-full object-cover" />
                              <button onClick={() => handleRemovePhoto(i)} className="absolute top-0.5 right-0.5 h-5 w-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                          {damagePhotos.length < 5 && (
                            <>
                              <label className="h-20 w-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center cursor-pointer hover:border-accent transition-colors">
                                <Camera className="h-5 w-5 text-muted-foreground" />
                                <span className="text-[9px] text-muted-foreground mt-1 text-center leading-tight">Foto/Video aufnehmen</span>
                                <input type="file" accept="image/*,video/*" capture="environment" className="hidden" onChange={(e) => handleAddPhotos(e.target.files)} />
                              </label>
                              <label className="h-20 w-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center cursor-pointer hover:border-accent transition-colors">
                                <Upload className="h-5 w-5 text-muted-foreground" />
                                <span className="text-[9px] text-muted-foreground mt-1 text-center leading-tight">Datei hochladen</span>
                                <input type="file" accept="image/*,video/*,application/pdf" multiple className="hidden" onChange={(e) => handleAddPhotos(e.target.files)} />
                              </label>
                            </>
                          )}
                        </div>
                      </div>
                      <Button onClick={handleSubmitDamage} disabled={!damageTitle || !damageDesc || !damageCategory} className="w-full">
                        Schaden melden
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              }
            />
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <DocumentManager role="tenant" propertyId={propertyAddress} />
          </TabsContent>

          {/* 360° Video Tab */}
          <TabsContent value="video360">
            <div className="space-y-6">
              {/* Cashback Banner */}
              <div className="rounded-xl border border-accent/20 bg-accent/5 p-5 flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <Gift className="h-5 w-5 text-accent" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-foreground">
                      🎁 Ihr Vermieter bietet Cashback für einen vollständigen Rundgang!
                    </p>
                    <Badge variant="secondary" className="text-[10px] shrink-0">Coming Soon</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Laden Sie ein Video oder Fotos Ihrer Wohnung hoch und erhalten Sie eine Gutschrift. Der genaue Betrag wird von Ihrem Vermieter festgelegt.
                  </p>
                </div>
              </div>

              <h3 className="font-heading font-semibold text-foreground">360° Wohnungsrundgang</h3>
              <p className="text-sm text-muted-foreground">
                Nehmen Sie ein Video auf oder laden Sie Fotos hoch, um den Zustand Ihrer Wohnung zu dokumentieren.
              </p>

              {/* Upload area */}
              <div className="flex gap-3">
                <label className="flex-1 flex flex-col items-center justify-center cursor-pointer py-10 border-2 border-dashed border-muted-foreground/30 rounded-lg hover:border-accent transition-colors">
                  <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                  <span className="text-sm font-medium text-muted-foreground">Video / Fotos hochladen</span>
                  <span className="text-xs text-muted-foreground/60 mt-1">MP4, MOV, JPG, PNG – max. 500 MB</span>
                  <input
                    type="file"
                    accept="video/*,image/*,.mp4,.mov"
                    multiple
                    className="hidden"
                    onChange={() => {
                      // TODO: implement file upload to storage
                      toast("Upload-Funktion wird bald verfügbar sein.");
                    }}
                  />
                </label>
                <button
                  onClick={() => toast("Kamera-Aufnahme wird bald verfügbar sein.")}
                  className="flex-1 flex flex-col items-center justify-center py-10 border-2 border-dashed border-accent/40 rounded-lg hover:border-accent bg-accent/5 transition-colors"
                >
                  <Camera className="h-6 w-6 text-accent mb-2" />
                  <span className="text-sm font-medium text-accent">Video aufnehmen</span>
                  <span className="text-xs text-accent/60 mt-1">Direkt mit der Kamera</span>
                </button>
              </div>

              {/* Tips */}
              <div className="rounded-lg border border-border/50 px-5 py-4">
                <p className="text-xs font-medium text-foreground mb-2">💡 Tipps für einen guten Rundgang</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Filmen Sie im Querformat, langsam und mit ruhiger Hand. Zeigen Sie jeden Raum vollständig – inkl. Ecken, Fenster und Böden. Pro Raum genügen 1–3 Minuten.
                </p>
              </div>
            </div>
          </TabsContent>

        </Tabs>
      </main>

    </div>
  );
};

export default TenantDashboardPage;
