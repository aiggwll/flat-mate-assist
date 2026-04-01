import { useState } from "react";
import CameraRecorder from "@/components/CameraRecorder";
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
  Send,
  Plus,
  Camera,
  X,
  LogOut,
  Video,
  Upload,
  Smartphone,
  Footprints,
  ScanLine,
  MonitorSmartphone,
  Lightbulb,
  Maximize,
  Focus,
  ShieldAlert,
  VolumeX,
  Timer,
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

  useState(() => {
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
  });

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

  // 360° upload state
  const defaultRooms = ["Küche", "Badezimmer", "Fenster", "Zimmer 1", "Wohnzimmer", "Flur"];
  const [customRooms, setCustomRooms] = useState<string[]>([]);
  const [allRoomOptions, setAllRoomOptions] = useState<string[]>([...defaultRooms]);
  const [roomVideos, setRoomVideos] = useState<Record<string, { file: File; uploaded: boolean }>>({});
  const [recordingRoom, setRecordingRoom] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [newCustomRoom, setNewCustomRoom] = useState("");
  const [showAddCustom, setShowAddCustom] = useState(false);

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

  const handleVideoFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setPendingFile(files[0]);
    setSelectedRoom("");
  };

  const handleAssignRoom = () => {
    if (!pendingFile || !selectedRoom) return;
    setRoomVideos((prev) => ({ ...prev, [selectedRoom]: { file: pendingFile, uploaded: true } }));
    setPendingFile(null);
    setSelectedRoom("");
  };

  const handleRemoveRoomVideo = (room: string) => {
    setRoomVideos((prev) => {
      const copy = { ...prev };
      delete copy[room];
      return copy;
    });
  };

  const handleAddCustomRoom = () => {
    const name = newCustomRoom.trim();
    if (!name || allRoomOptions.includes(name)) return;
    setAllRoomOptions((prev) => [...prev, name]);
    setCustomRooms((prev) => [...prev, name]);
    setSelectedRoom(name);
    setNewCustomRoom("");
    setShowAddCustom(false);
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
              <h3 className="font-heading font-semibold text-foreground">360° Wohnungszustand</h3>
              <p className="text-sm text-muted-foreground">
                Nehmen Sie ein Video auf oder laden Sie eines hoch, und weisen Sie es anschließend einem Raum zu.
              </p>

              {/* Tips */}
              <div className="rounded-lg border border-border/50 px-5 py-4">
                <p className="text-xs font-medium text-foreground mb-2">Worauf Sie achten sollten</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Filmen Sie im Querformat, langsam und mit ruhiger Hand. Sorgen Sie für gute Beleuchtung und zeigen Sie jeden Raum vollständig – inkl. Ecken, Fenster und Böden. Schäden oder Auffälligkeiten bitte deutlich festhalten. Vermeiden Sie Hintergrundgeräusche. Pro Raum genügen 1–3 Minuten.
                </p>
              </div>

              {/* Upload / Record area */}
              {!pendingFile ? (
                <div className="flex gap-3">
                  <label className="flex-1 flex flex-col items-center justify-center cursor-pointer py-8 border-2 border-dashed border-muted-foreground/30 rounded-lg hover:border-accent transition-colors">
                    <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Video hochladen</span>
                    <input
                      type="file"
                      accept="video/*,image/*,.mp4,.mov"
                      className="hidden"
                      onChange={(e) => handleVideoFileSelect(e.target.files)}
                    />
                  </label>
                  <button
                    onClick={() => setRecordingRoom("__recording__")}
                    className="flex-1 flex flex-col items-center justify-center py-8 border-2 border-dashed border-accent/40 rounded-lg hover:border-accent bg-accent/5 transition-colors"
                  >
                    <Camera className="h-6 w-6 text-accent mb-2" />
                    <span className="text-sm text-accent font-medium">Video aufnehmen</span>
                  </button>
                </div>
              ) : (
                <div className="border rounded-lg p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Video className="h-5 w-5 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{pendingFile.name}</p>
                      <p className="text-xs text-muted-foreground">{(pendingFile.size / 1024 / 1024).toFixed(1)} MB</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setPendingFile(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Raum zuweisen</label>
                    <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                      <SelectTrigger>
                        <SelectValue placeholder="Raum auswählen…" />
                      </SelectTrigger>
                      <SelectContent>
                        {allRoomOptions.map((room) => (
                          <SelectItem key={room} value={room}>{room}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Add custom room inline */}
                  {!showAddCustom ? (
                    <button
                      onClick={() => setShowAddCustom(true)}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Eigenen Raum hinzufügen
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Input
                        value={newCustomRoom}
                        onChange={(e) => setNewCustomRoom(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddCustomRoom()}
                        placeholder="Raumname eingeben…"
                        className="h-8 text-sm flex-1"
                        autoFocus
                      />
                      <Button size="sm" variant="outline" className="h-8" onClick={handleAddCustomRoom}>OK</Button>
                      <Button size="sm" variant="ghost" className="h-8" onClick={() => { setShowAddCustom(false); setNewCustomRoom(""); }}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}

                  <Button onClick={handleAssignRoom} disabled={!selectedRoom} className="w-full">
                    Zuweisen & Hochladen
                  </Button>
                </div>
              )}

              {/* Uploaded videos list */}
              {Object.keys(roomVideos).length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Hochgeladene Videos</p>
                  <div className="border rounded-lg divide-y">
                    {Object.entries(roomVideos).map(([room, entry]) => (
                      <div key={room} className="flex items-center gap-3 px-4 py-3">
                        <div className="h-8 w-8 rounded-md bg-accent/10 flex items-center justify-center shrink-0">
                          <Video className="h-3.5 w-3.5 text-accent" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground font-medium">{room}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {entry.file.name} · {(entry.file.size / 1024 / 1024).toFixed(1)} MB · {new Date().toLocaleDateString("de-DE")}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs shrink-0">hochgeladen</Badge>
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveRoomVideo(room)} className="text-xs text-muted-foreground">
                          Ersetzen
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {recordingRoom && (
        <CameraRecorder
          roomName={recordingRoom === "__recording__" ? "Aufnahme" : recordingRoom}
          onClose={() => setRecordingRoom(null)}
          onRecorded={(file) => {
            setPendingFile(file);
            setRecordingRoom(null);
          }}
        />
      )}
    </div>
  );
};

export default TenantDashboardPage;
