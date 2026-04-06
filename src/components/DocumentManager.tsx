import { useState, useEffect, useCallback, useRef } from "react";
import {
  FileText,
  Upload,
  Search,
  Trash2,
  Download,
  Eye,
  Pencil,
  ChevronRight,
  FolderOpen,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DocRow {
  id: string;
  filename: string;
  file_url: string;
  category: string;
  file_size: number;
  created_at: string;
  property_id: string | null;
}

const CATEGORIES = [
  "Verträge",
  "Protokolle",
  "Rechnungen",
  "Instandhaltung",
  "Versicherungen",
  "Versorger",
  "Sonstige Dokumente",
] as const;

type Category = (typeof CATEGORIES)[number];

const TENANT_CATEGORIES: Category[] = ["Verträge", "Protokolle", "Rechnungen"];

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
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterYear, setFilterYear] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUploading(false); return; }

    try {
      for (const file of Array.from(files)) {
        const filePath = `${user.id}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(filePath, file);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("documents").getPublicUrl(filePath);

        await supabase.from("documents").insert({
          user_id: user.id,
          filename: file.name,
          file_url: filePath,
          category: "Sonstige Dokumente",
          file_size: file.size,
          property_id: propertyId || null,
        });
      }
      toast.success("Dokument erfolgreich hochgeladen");
      await fetchDocs();
    } catch (err: any) {
      toast.error(err.message || "Upload fehlgeschlagen");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
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

  const DocRow = ({ doc }: { doc: DocRow }) => (
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
            </div>
          </>
        )}
      </div>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
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

  return (
    <div className="space-y-5">
      <input ref={fileInputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleFileChange} className="hidden" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Dokumente</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {docs.length} Dokumente · {sortedYears.length > 0 ? `${sortedYears[sortedYears.length - 1]}–${sortedYears[0]}` : "–"}
          </p>
        </div>
        <UploadButton />
      </div>

      {/* Filters */}
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
          {(["Verträge", "Protokolle", "Rechnungen"] as const).map((cat) => {
            const catDocs = filtered.filter((d) => d.category === cat);
            if (catDocs.length === 0) return null;
            const catLabel = cat === "Verträge" ? "Mietvertrag" : cat === "Protokolle" ? "Übergabeprotokoll" : "Nebenkostenabrechnung";
            return (
              <div key={cat}>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 px-1">{catLabel}</p>
                <div className="border rounded-lg divide-y">
                  {catDocs.map((doc) => <DocRow key={doc.id} doc={doc} />)}
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
                              <DocRow doc={doc} />
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
