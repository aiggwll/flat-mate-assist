import { useState, useEffect, useCallback, useRef } from "react";
import {
  FileText,
  Upload,
  Search,
  Trash2,
  Download,
  Pencil,
  ChevronRight,
  FolderOpen,
  X,
  Loader2,
  Receipt,
  Calculator,
  Lock,
  Unlock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/UserContext";
import { sal } from "@/lib/salutation";
import { toast } from "sonner";

interface DocRow {
  id: string;
  filename: string;
  file_url: string;
  category: string;
  file_size: number;
  created_at: string;
  property_id: string | null;
  shared_with_tenant: boolean;
}

const CATEGORIES = [
  "Mietvertrag",
  "Nebenkostenabrechnung",
  "Übergabeprotokoll",
  "Versicherung",
  "Grundsteuer",
  "Reparatur & Handwerker",
  "Korrespondenz",
  "Sonstige Dokumente",
] as const;

type Category = (typeof CATEGORIES)[number];

const TENANT_CATEGORIES: Category[] = ["Mietvertrag", "Nebenkostenabrechnung", "Übergabeprotokoll"];

interface DocumentManagerProps {
  role: "owner" | "tenant";
  propertyId?: string;
}

function formatSize(bytes: number) {
  if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

function getFileType(name: string) {
  return name.split(".").pop()?.toUpperCase() || "FILE";
}

function getYear(dateStr: string) {
  return new Date(dateStr).getFullYear().toString();
}

const DocumentManager = ({ role, propertyId }: DocumentManagerProps) => {
  const { userProperties, salutation } = useUser();
  const navigate = useNavigate();
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterYear, setFilterYear] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload dialog state
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadFilename, setUploadFilename] = useState("");
  const [uploadCategory, setUploadCategory] = useState<string>("Sonstige Dokumente");
  const [uploadPropertyId, setUploadPropertyId] = useState<string>("none");
  const [dismissedLocal, setDismissedLocal] = useState<string[]>([]);

  const fetchDocs = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    let query = supabase.from("documents").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (propertyId) query = query.eq("property_id", propertyId);
    const { data } = await query;
    setDocs((data as DocRow[]) || []);
    setLoading(false);
  }, [propertyId]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const triggerFileInput = () => fileInputRef.current?.click();

  const pendingCategoryRef = useRef<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    setPendingFiles(fileList);
    setUploadFilename(fileList[0].name);
    if (!pendingCategoryRef.current) setUploadCategory("Sonstige Dokumente");
    pendingCategoryRef.current = null;
    setUploadPropertyId(propertyId || "none");
    setShowUploadDialog(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUploadConfirm = async () => {
    if (pendingFiles.length === 0) return;
    setUploading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUploading(false); return; }

    try {
      for (const file of pendingFiles) {
        const filePath = `${user.id}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(filePath, file);
        if (uploadError) throw uploadError;

        await supabase.from("documents").insert({
          user_id: user.id,
          filename: pendingFiles.length === 1 ? uploadFilename : file.name,
          file_url: filePath,
          category: uploadCategory,
          file_size: file.size,
          property_id: uploadPropertyId === "none" ? null : uploadPropertyId,
        });
      }
      toast.success("Dokument erfolgreich hochgeladen");
      setShowUploadDialog(false);
      setPendingFiles([]);
      await fetchDocs();
    } catch (err: any) {
      toast.error(err.message || "Upload fehlgeschlagen");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc: DocRow) => {
    const { data, error } = await supabase.storage.from("documents").download(doc.file_url);
    if (error || !data) { toast.error("Download fehlgeschlagen"); return; }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (id: string, fileUrl: string) => {
    await supabase.storage.from("documents").remove([fileUrl]);
    await supabase.from("documents").delete().eq("id", id);
    setDocs((prev) => prev.filter((d) => d.id !== id));
    toast.success("Dokument gelöscht");
  };

  const handleRename = async (id: string) => {
    await supabase.from("documents").update({ filename: renameValue }).eq("id", id);
    setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, filename: renameValue } : d)));
    setRenameId(null);
    setRenameValue("");
  };

  const handleToggleShare = async (doc: DocRow) => {
    const newVal = !doc.shared_with_tenant;
    await supabase.from("documents").update({ shared_with_tenant: newVal } as any).eq("id", doc.id);
    setDocs((prev) => prev.map((d) => (d.id === doc.id ? { ...d, shared_with_tenant: newVal } : d)));
    toast.success(newVal ? "Dokument für Mieter freigegeben" : "Zugriff für Mieter entzogen");
  };

  const visibleCategories = role === "tenant" ? TENANT_CATEGORIES : CATEGORIES;

  const filtered = docs.filter((d) => {
    if (role === "tenant" && !TENANT_CATEGORIES.includes(d.category as Category)) return false;
    const matchSearch = d.filename.toLowerCase().includes(search.toLowerCase()) || d.category.toLowerCase().includes(search.toLowerCase());
    const matchYear = filterYear === "all" || getYear(d.created_at) === filterYear;
    const matchCat = filterCategory === "all" || d.category === filterCategory;
    return matchSearch && matchYear && matchCat;
  });

  const years = [...new Set(docs.map((d) => getYear(d.created_at)))].sort((a, b) => b.localeCompare(a));
  const allYears = [...new Set([...years, "2026", "2025", "2024"])].sort((a, b) => b.localeCompare(a));

  const groupedByYear: Record<string, Record<string, DocRow[]>> = {};
  filtered.forEach((d) => {
    const y = getYear(d.created_at);
    if (!groupedByYear[y]) groupedByYear[y] = {};
    if (!groupedByYear[y][d.category]) groupedByYear[y][d.category] = [];
    groupedByYear[y][d.category].push(d);
  });
  const sortedYears = Object.keys(groupedByYear).sort((a, b) => b.localeCompare(a));

  const canDelete = role === "owner";
  const canRename = role === "owner";

  const UploadButton = ({ size = "sm" as const, className = "" }) => (
    <Button onClick={triggerFileInput} size={size} className={`gap-2 ${className}`} disabled={uploading}>
      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
      {uploading ? "Wird hochgeladen…" : "Hochladen"}
    </Button>
  );

  const DocRowItem = ({ doc }: { doc: DocRow }) => (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/10 transition-colors group">
      <div className="h-8 w-8 rounded-md bg-muted/50 flex items-center justify-center shrink-0">
        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        {renameId === doc.id ? (
          <div className="flex items-center gap-2">
            <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleRename(doc.id)} className="h-7 text-sm" autoFocus />
            <Button size="sm" variant="ghost" onClick={() => handleRename(doc.id)} className="h-7 px-2">OK</Button>
            <Button size="sm" variant="ghost" onClick={() => setRenameId(null)} className="h-7 px-2"><X className="h-3 w-3" /></Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-foreground truncate">{doc.filename}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground">{getFileType(doc.filename)}</span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">{new Date(doc.created_at).toLocaleDateString("de-DE")}</span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">{formatSize(doc.file_size)}</span>
              {role === "owner" && doc.shared_with_tenant && (
                <>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-primary flex items-center gap-0.5"><Unlock className="h-2.5 w-2.5" /> Geteilt</span>
                </>
              )}
            </div>
          </>
        )}
      </div>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {role === "owner" && (
          <button
            onClick={() => handleToggleShare(doc)}
            title={doc.shared_with_tenant ? "Zugriff für Mieter entziehen" : "Dieses Dokument für Mieter freischalten"}
            className={`p-1.5 rounded-md transition-colors ${
              doc.shared_with_tenant
                ? "text-primary hover:text-primary/80 hover:bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {doc.shared_with_tenant ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
          </button>
        )}
        <button onClick={() => handleDownload(doc)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <Download className="h-3.5 w-3.5" />
        </button>
        {canRename && (
          <button onClick={() => { setRenameId(doc.id); setRenameValue(doc.filename); }} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
        {canDelete && (
          <button onClick={() => handleDelete(doc.id, doc.file_url)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleRequiredUpload = (category: string) => {
    setUploadCategory(category);
    pendingCategoryRef.current = category;
    triggerFileInput();
  };

  // Contextual suggestion logic
  const currentMonth = new Date().getMonth() + 1;
  const hasMietvertrag = docs.some(d => d.category === "Mietvertrag");
  const hasReparaturDoc = docs.some(d => d.category === "Reparatur & Handwerker");
  const hasTenants = userProperties.length > 0; // proxy: has properties with potential tenants

  type Suggestion = {
    key: string;
    icon: React.ReactNode;
    text: string;
    buttonLabel: string;
    dismissLabel: string;
    onAction: () => void;
    onDismiss: () => void;
  };

  const dismissedKeys = {
    mietvertrag: localStorage.getItem("dismissed_suggestion_mietvertrag") === "true",
    reparatur: localStorage.getItem("dismissed_suggestion_reparatur") === "true",
    nebenkosten: localStorage.getItem("dismissed_suggestion_nebenkosten") === "true",
  };

  const suggestions: Suggestion[] = [];

  // Trigger A
  if (hasTenants && !hasMietvertrag && !dismissedKeys.mietvertrag) {
    suggestions.push({
      key: "mietvertrag",
      icon: <FileText className="h-5 w-5 text-orange-500" />,
      text: sal(salutation,
        "Sie haben Mieter eingeladen — haben Sie den Mietvertrag bereits hochgeladen?",
        "Du hast Mieter eingeladen — hast du den Mietvertrag bereits hochgeladen?"
      ),
      buttonLabel: "Jetzt hochladen",
      dismissLabel: "Erledigt",
      onAction: () => handleRequiredUpload("Mietvertrag"),
      onDismiss: () => localStorage.setItem("dismissed_suggestion_mietvertrag", "true"),
    });
  }

  // Trigger B
  if (!hasReparaturDoc && !dismissedKeys.reparatur) {
    // Show if there could be damage reports (simplified: always show if no repair doc)
    suggestions.push({
      key: "reparatur",
      icon: <Receipt className="h-5 w-5 text-orange-500" />,
      text: "Offene Schadenmeldung vorhanden — Rechnung vom Handwerker hochladen?",
      buttonLabel: "Rechnung hochladen",
      dismissLabel: "Später",
      onAction: () => handleRequiredUpload("Reparatur & Handwerker"),
      onDismiss: () => localStorage.setItem("dismissed_suggestion_reparatur", "true"),
    });
  }

  // Trigger C
  if ((currentMonth === 1 || currentMonth === 2) && !dismissedKeys.nebenkosten) {
    suggestions.push({
      key: "nebenkosten",
      icon: <Calculator className="h-5 w-5 text-blue-500" />,
      text: sal(salutation,
        "Nebenkostenabrechnung-Saison: Haben Sie alle Belege für das letzte Jahr gesammelt?",
        "Nebenkostenabrechnung-Saison: Hast du alle Belege für das letzte Jahr gesammelt?"
      ),
      buttonLabel: "Zur Steuermappe",
      dismissLabel: "Erledigt",
      onAction: () => navigate("/tax-folder"),
      onDismiss: () => localStorage.setItem("dismissed_suggestion_nebenkosten", "true"),
    });
  }

  const activeSuggestion = suggestions.find(s => !dismissedLocal.includes(s.key)) || null;

  return (
    <div className="space-y-5">
      <input ref={fileInputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleFileChange} className="hidden" />

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Dokument hochladen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="upload-filename" className="text-sm">Dateiname</Label>
              <Input id="upload-filename" value={uploadFilename} onChange={(e) => setUploadFilename(e.target.value)} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Kategorie</Label>
              <Select value={uploadCategory} onValueChange={setUploadCategory}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {userProperties.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-sm">Immobilie (optional)</Label>
                <Select value={uploadPropertyId} onValueChange={setUploadPropertyId}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Keine Zuordnung" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Keine Zuordnung</SelectItem>
                    {userProperties.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.address}, {p.city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {pendingFiles.length > 1 && (
              <p className="text-xs text-muted-foreground">{pendingFiles.length} Dateien ausgewählt – Kategorie gilt für alle.</p>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => { setShowUploadDialog(false); setPendingFiles([]); }}>Abbrechen</Button>
            <Button size="sm" onClick={handleUploadConfirm} disabled={uploading} className="gap-2">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? "Wird hochgeladen…" : "Hochladen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contextual Suggestion Banner */}
      {role === "owner" && activeSuggestion && (
        <div className="flex items-center gap-4 rounded-xl border bg-card p-4">
          <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
            {activeSuggestion.icon}
          </div>
          <p className="text-sm text-foreground flex-1">{activeSuggestion.text}</p>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => {
              activeSuggestion.onDismiss();
              setDismissedLocal(prev => [...prev, activeSuggestion.key]);
            }}>
              {activeSuggestion.dismissLabel}
            </Button>
            <Button size="sm" className="text-xs h-8 gap-1.5" onClick={activeSuggestion.onAction}>
              {activeSuggestion.buttonLabel}
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Dokumente</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {docs.length} Dokumente · {sortedYears.length > 0 ? `${sortedYears[sortedYears.length - 1]}–${sortedYears[0]}` : "–"}
          </p>
        </div>
        <UploadButton />
      </div>

      {role === "owner" && (
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Dokument suchen…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
          </div>
          <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground">
            <option value="all">Alle Jahre</option>
            {allYears.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground">
            <option value="all">Alle Kategorien</option>
            {visibleCategories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      )}

      {/* Documents */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">Noch keine Dokumente vorhanden</p>
          <p className="text-xs text-muted-foreground mb-4">
            {role === "tenant" ? "Laden Sie Dokumente hoch oder warten Sie auf Ihren Vermieter." : "Laden Sie Ihr erstes Dokument hoch."}
          </p>
          <Button size="sm" className="gap-2" onClick={triggerFileInput} disabled={uploading}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Dokumente hochladen
          </Button>
        </div>
      ) : role === "tenant" ? (
        <div className="space-y-4">
          {TENANT_CATEGORIES.map((cat) => {
            const catDocs = filtered.filter((d) => d.category === cat);
            if (catDocs.length === 0) return null;
            return (
              <div key={cat}>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 px-1">{cat}</p>
                <div className="border rounded-lg divide-y">
                  {catDocs.map((doc) => <DocRowItem key={doc.id} doc={doc} />)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Accordion type="multiple" defaultValue={[sortedYears[0]]} className="space-y-2">
          {sortedYears.map((year) => (
            <AccordionItem key={year} value={year} className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-2.5">
                  <FolderOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="font-heading font-semibold text-foreground">{year}</span>
                  <span className="text-xs text-muted-foreground ml-1">
                    {Object.values(groupedByYear[year]).flat().length} Dokumente
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-0 pb-0">
                <Accordion type="multiple" className="border-t">
                  {CATEGORIES.filter((cat) => groupedByYear[year][cat]?.length).map((cat) => (
                    <AccordionItem key={cat} value={`${year}-${cat}`} className="border-b last:border-0">
                      <AccordionTrigger className="px-6 py-2.5 hover:no-underline hover:bg-muted/20 transition-colors text-sm">
                        <div className="flex items-center gap-2">
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-foreground font-medium">{cat}</span>
                          <span className="text-xs text-muted-foreground">({groupedByYear[year][cat].length})</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-0 pb-0">
                        <div className="divide-y border-t">
                          {groupedByYear[year][cat].map((doc) => (
                            <div key={doc.id} className="px-4">
                              <DocRowItem doc={doc} />
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
};

export default DocumentManager;
