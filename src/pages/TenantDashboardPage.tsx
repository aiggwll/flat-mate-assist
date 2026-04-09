import { useState, useEffect } from "react";
import DwelloLogo from "@/components/DwelloLogo";
import { toast } from "sonner";

import DocumentManager from "@/components/DocumentManager";
import TenantOnboarding from "@/components/TenantOnboarding";
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
  Wallet,
  CheckCircle2,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

const TenantDashboardPage = () => {
  const [searchParams] = useSearchParams();
  const { userName, userId, signOut, salutation } = useUser();
  const { addMessage } = useMessages();
  const navigate = useNavigate();

  // Load real property info from profile
  const [propertyAddress, setPropertyAddress] = useState("Wird geladen...");
  const [unitLabel, setUnitLabel] = useState("");
  const [ownerName, setOwnerName] = useState("Vermieter");
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [hasProperty, setHasProperty] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) return;
      // Retry up to 3 times to handle race condition after registration
      let attempts = 0;
      let profileData: any = null;
      while (attempts < 3) {
        const { data } = await supabase
          .from("profiles")
          .select("property_id, unit_id, owner_name")
          .eq("user_id", userId)
          .single();
        profileData = data;
        if (data?.property_id) break;
        attempts++;
        if (attempts < 3) await new Promise(r => setTimeout(r, 1000));
      }
      if (profileData) {
        const addr = profileData.property_id || "";
        const unit = profileData.unit_id || "";
        let owner = (profileData as any).owner_name || "";
        if (addr) {
          setPropertyAddress(addr);
          setUnitLabel(unit);
          setHasProperty(true);

          // If owner_name is missing or placeholder, look up from properties table
          if (!owner || owner === "Vermieter") {
            try {
              // property_id stores "address, city" — match against properties
              const { data: props } = await supabase
                .from("properties")
                .select("user_id, address, city");
              if (props) {
                const match = props.find((p: any) =>
                  addr === `${p.address}, ${p.city}` || addr.includes(p.address)
                );
                if (match) {
                  const { data: landlordProfile } = await supabase
                    .from("profiles")
                    .select("name")
                    .eq("user_id", match.user_id)
                    .single();
                  if (landlordProfile?.name) {
                    owner = landlordProfile.name;
                    // Persist so we don't need to look up again
                    await supabase.from("profiles").update({ owner_name: owner }).eq("user_id", userId);
                  }
                }
              }
            } catch {
              // Fallback silently
            }
          }
          setOwnerName(owner || "Ihr Vermieter");
        } else {
          setPropertyAddress("");
          setHasProperty(false);
        }
      } else {
        setPropertyAddress("");
        setHasProperty(false);
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
  // Cashback state
  const [cashbackTotal, setCashbackTotal] = useState(0);
  const [cashbackHistory, setCashbackHistory] = useState<Array<{ id: string; amount: number; reason: string; status: string; created_at: string }>>([]);
  const [roundgangSubmitted, setRundgangSubmitted] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem("onboarding_complete_tenant")
  );

  useEffect(() => {
    const loadCashback = async () => {
      if (!userId) return;
      const { data } = await supabase
        .from("cashback_transactions" as any)
        .select("*")
        .eq("tenant_id", userId)
        .order("created_at", { ascending: false });
      if (data && (data as any[]).length > 0) {
        const rows = data as any[];
        setCashbackHistory(rows);
        const total = rows
          .filter((r: any) => r.status === "approved" || r.status === "paid")
          .reduce((sum: number, r: any) => sum + Number(r.amount), 0);
        setCashbackTotal(total);
      }
    };
    loadCashback();
  }, [userId]);

  const handleRundgangUpload = async () => {
    if (!userId) return;
    await supabase.from("cashback_transactions" as any).insert({
      tenant_id: userId,
      amount: 100,
      reason: "360° Rundgang",
      status: "pending",
    } as any);
    setRundgangSubmitted(true);
    // Reload cashback
    const { data } = await supabase
      .from("cashback_transactions" as any)
      .select("*")
      .eq("tenant_id", userId)
      .order("created_at", { ascending: false });
    if (data) {
      const rows = data as any[];
      setCashbackHistory(rows);
      const total = rows
        .filter((r: any) => r.status === "approved" || r.status === "paid")
        .reduce((sum: number, r: any) => sum + Number(r.amount), 0);
      setCashbackTotal(total);
    }
    toast.success("Ihr Rundgang wurde eingereicht!");
  };


    const handleSendMessage = () => {
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
      category: damageCategory,
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
      <TenantOnboarding open={showOnboarding} onComplete={() => setShowOnboarding(false)} />
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DwelloLogo variant="light" size="sm" showIcon={false} />
            <span className="text-sm text-muted-foreground">· Mieterportal</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-foreground">{tenantName}</p>
              {hasProperty && <p className="text-xs text-muted-foreground">{propertyAddress}{unitLabel ? `, ${unitLabel}` : ""}</p>}
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
            {hasProperty ? (
              <div>
                <h2 className="text-lg font-heading font-bold text-foreground">{propertyAddress}</h2>
                <p className="text-sm text-muted-foreground">
                  Wohnung {unitLabel}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Vermieter: <span className="font-semibold text-foreground">{ownerName}</span>
                </p>
              </div>
            ) : (
              <div>
                <h2 className="text-lg font-heading font-bold text-foreground">Wohnung wird zugewiesen</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Ihre Wohnung wird gerade zugewiesen — bitte kontaktieren Sie Ihren Vermieter.
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Cashback Card */}
        <Card className="p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
              <Wallet className="h-6 w-6 text-accent" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-heading font-semibold text-foreground">Mein Cashback</h3>
                <Badge variant="secondary" className="text-[10px]">Coming Soon</Badge>
              </div>
              <p className="text-2xl font-bold text-accent mb-3">{cashbackTotal} € <span className="text-sm font-normal text-muted-foreground">verdient</span></p>
              <Progress value={Math.min(cashbackTotal, 200) / 2} className="h-2 mb-4" />
              {cashbackHistory.length > 0 ? (
                <div className="space-y-2">
                  {cashbackHistory.slice(0, 3).map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className={`h-3.5 w-3.5 ${entry.status === "approved" || entry.status === "paid" ? "text-accent" : "text-muted-foreground"}`} />
                        <span className="text-foreground">{entry.reason}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(entry.created_at).toLocaleDateString("de-DE", { month: "short", year: "numeric" })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-accent">+{entry.amount} €</span>
                        <Badge variant={entry.status === "pending" ? "secondary" : "default"} className="text-[10px]">
                          {entry.status === "pending" ? "Prüfung" : entry.status === "approved" ? "Genehmigt" : "Ausgezahlt"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Noch kein Cashback verdient. Laden Sie einen 360° Rundgang hoch!</p>
              )}
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
              salutation={salutation}
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
                  <p className="text-sm font-semibold text-foreground mb-1">
                    🎁 Ihr Vermieter bietet 100 € Cashback für einen vollständigen Rundgang!
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Laden Sie ein Video oder Fotos Ihrer Wohnung hoch. Nach Prüfung wird der Cashback gutgeschrieben.
                  </p>
                </div>
              </div>

              <h3 className="font-heading font-semibold text-foreground">Rundgang hochladen</h3>

              {roundgangSubmitted ? (
                <Card className="p-6 text-center space-y-3">
                  <div className="h-14 w-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-7 w-7 text-accent" />
                  </div>
                  <p className="font-semibold text-foreground">Ihr Rundgang wurde eingereicht!</p>
                  <p className="text-sm text-muted-foreground">
                    Der Cashback wird nach Prüfung durch Ihren Vermieter gutgeschrieben.
                  </p>
                  <Badge variant="secondary" className="text-xs">Prüfung läuft</Badge>
                </Card>
              ) : (
                <>
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
                        onChange={() => handleRundgangUpload()}
                      />
                    </label>
                    <button
                      onClick={() => handleRundgangUpload()}
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
                </>
              )}
            </div>
          </TabsContent>

        </Tabs>
      </main>

    </div>
  );
};

export default TenantDashboardPage;
