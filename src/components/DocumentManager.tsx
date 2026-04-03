import { useState } from "react";
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
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

type DocStatus = "unterzeichnet" | "offen" | "archiviert" | "";

interface Doc {
  id: string;
  name: string;
  year: string;
  category: Category;
  uploadedAt: string;
  fileType: string;
  size: string;
  status: DocStatus;
  description: string;
}

// No hardcoded documents - start empty
const allDocuments: (Doc & { propertyId?: string })[] = [];

// Categories visible to tenants
const TENANT_CATEGORIES: Category[] = ["Verträge", "Protokolle", "Rechnungen"];

interface DocumentManagerProps {
  role: "owner" | "tenant";
  propertyId?: string;
}

const statusLabel: Record<string, string> = {
  unterzeichnet: "Unterzeichnet",
  offen: "Offen",
  archiviert: "Archiviert",
};

const statusVariant = (s: DocStatus) => {
  if (s === "unterzeichnet") return "default" as const;
  if (s === "offen") return "secondary" as const;
  if (s === "archiviert") return "outline" as const;
  return "outline" as const;
};

const DocumentManager = ({ role, propertyId }: DocumentManagerProps) => {
  const initialDocs = propertyId
    ? allDocuments.filter((d) => d.propertyId === propertyId)
    : allDocuments;
  const [docs, setDocs] = useState<Doc[]>(initialDocs);
  const [search, setSearch] = useState("");
  const [filterYear, setFilterYear] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Upload form
  const [uploadYear, setUploadYear] = useState("2026");
  const [uploadCategory, setUploadCategory] = useState<Category | "">("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadStatus, setUploadStatus] = useState<DocStatus>("");
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const years = [...new Set(docs.map((d) => d.year))].sort((a, b) => b.localeCompare(a));
  const allYears = [...new Set([...years, "2026", "2025", "2024"])].sort((a, b) => b.localeCompare(a));

  const visibleCategories = role === "tenant" ? TENANT_CATEGORIES : CATEGORIES;

  const filtered = docs.filter((d) => {
    if (role === "tenant" && !TENANT_CATEGORIES.includes(d.category)) return false;
    const matchSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.category.toLowerCase().includes(search.toLowerCase());
    const matchYear = filterYear === "all" || d.year === filterYear;
    const matchCat = filterCategory === "all" || d.category === filterCategory;
    return matchSearch && matchYear && matchCat;
  });

  const groupedByYear: Record<string, Record<string, Doc[]>> = {};
  filtered.forEach((d) => {
    if (!groupedByYear[d.year]) groupedByYear[d.year] = {};
    if (!groupedByYear[d.year][d.category]) groupedByYear[d.year][d.category] = [];
    groupedByYear[d.year][d.category].push(d);
  });

  const sortedYears = Object.keys(groupedByYear).sort((a, b) => b.localeCompare(a));

  const handleUploadFiles = (files: FileList | File[]) => {
    setUploadFiles((prev) => [...prev, ...Array.from(files)]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) handleUploadFiles(e.dataTransfer.files);
  };

  const handleSubmitUpload = () => {
    if (!uploadCategory || uploadFiles.length === 0) return;
    const newDocs: Doc[] = uploadFiles.map((file, i) => ({
      id: `upload-${Date.now()}-${i}`,
      name: file.name,
      year: uploadYear,
      category: uploadCategory as Category,
      uploadedAt: new Date().toISOString().split("T")[0],
      fileType: file.name.split(".").pop()?.toUpperCase() || "FILE",
      size:
        file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(file.size / 1024)} KB`,
      status: uploadStatus,
      description: uploadDescription,
    }));
    setDocs((prev) => [...newDocs, ...prev]);
    setUploadOpen(false);
    setUploadFiles([]);
    setUploadCategory("");
    setUploadDescription("");
    setUploadStatus("");
  };

  const handleDelete = (id: string) => {
    setDocs((prev) => prev.filter((d) => d.id !== id));
  };

  const handleRename = (id: string) => {
    setDocs((prev) =>
      prev.map((d) => (d.id === id ? { ...d, name: renameValue } : d))
    );
    setRenameId(null);
    setRenameValue("");
  };

  const canUpload = true; // Both owner and tenant can upload
  const canDelete = role === "owner";
  const canRename = role === "owner";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Dokumente</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {docs.length} Dokumente · {sortedYears.length > 0 ? `${sortedYears[sortedYears.length - 1]}–${sortedYears[0]}` : "–"}
          </p>
        </div>
        {canUpload && (
          <Button onClick={() => setUploadOpen(true)} size="sm" className="gap-2">
            <Upload className="h-4 w-4" />
            Hochladen
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        {role === "owner" && (
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Dokument suchen…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
        )}
        {role === "owner" && (
          <>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            >
              <option value="all">Alle Jahre</option>
              {allYears.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            >
              <option value="all">Alle Kategorien</option>
              {visibleCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </>
        )}
      </div>

      {/* Document view */}
      {sortedYears.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">Noch keine Dokumente vorhanden</p>
          <p className="text-xs text-muted-foreground mb-4">
            {role === "tenant" ? "Laden Sie Dokumente hoch oder warten Sie auf Ihren Vermieter." : "Laden Sie Ihr erstes Dokument hoch."}
          </p>
          <Button size="sm" className="gap-2" onClick={() => setUploadOpen(true)}>
            <Upload className="h-4 w-4" />
            Dokumente hochladen
          </Button>
        </div>
      ) : role === "tenant" ? (
        /* Tenant: simplified flat list grouped by category label */
        <div className="space-y-4">
          {(["Verträge", "Protokolle", "Rechnungen"] as const).map((cat) => {
            const catLabel = cat === "Verträge" ? "Mietvertrag" : cat === "Protokolle" ? "Übergabeprotokoll" : "Nebenkostenabrechnung";
            const catDocs = filtered.filter((d) => d.category === cat);
            if (catDocs.length === 0) return null;
            return (
              <div key={cat}>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 px-1">{catLabel}</p>
                <div className="border rounded-lg divide-y">
                  {catDocs.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/10 transition-colors group">
                      <div className="h-8 w-8 rounded-md bg-muted/50 flex items-center justify-center shrink-0">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{doc.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">{doc.fileType}</span>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">{new Date(doc.uploadedAt).toLocaleDateString("de-DE")}</span>
                          {doc.status && (
                            <Badge variant={statusVariant(doc.status)} className="text-[10px] h-5 px-1.5">
                              {statusLabel[doc.status]}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Owner: full accordion structure */
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
                          <span className="text-xs text-muted-foreground">
                            ({groupedByYear[year][cat].length})
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-0 pb-0">
                        {groupedByYear[year][cat].map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center gap-3 px-8 py-3 border-t hover:bg-muted/10 transition-colors group"
                          >
                            <div className="h-8 w-8 rounded-md bg-muted/50 flex items-center justify-center shrink-0">
                              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              {renameId === doc.id ? (
                                <div className="flex items-center gap-2">
                                  <Input
                                    value={renameValue}
                                    onChange={(e) => setRenameValue(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleRename(doc.id)}
                                    className="h-7 text-sm"
                                    autoFocus
                                  />
                                  <Button size="sm" variant="ghost" onClick={() => handleRename(doc.id)} className="h-7 px-2">
                                    OK
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => setRenameId(null)} className="h-7 px-2">
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <p className="text-sm text-foreground truncate">{doc.name}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs text-muted-foreground">{doc.fileType}</span>
                                    <span className="text-xs text-muted-foreground">·</span>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(doc.uploadedAt).toLocaleDateString("de-DE")}
                                    </span>
                                    <span className="text-xs text-muted-foreground">·</span>
                                    <span className="text-xs text-muted-foreground">{doc.size}</span>
                                    {doc.status && (
                                      <Badge variant={statusVariant(doc.status)} className="text-[10px] h-5 px-1.5">
                                        {statusLabel[doc.status]}
                                      </Badge>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                              <button className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                                <Download className="h-3.5 w-3.5" />
                              </button>
                              {canRename && (
                                <button
                                  onClick={() => { setRenameId(doc.id); setRenameValue(doc.name); }}
                                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  onClick={() => handleDelete(doc.id)}
                                  className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Dokument hochladen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                isDragging ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40"
              }`}
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.multiple = true;
                input.accept = ".pdf,.doc,.docx,.jpg,.png,.xlsx";
                input.onchange = (e) => {
                  const files = (e.target as HTMLInputElement).files;
                  if (files) handleUploadFiles(files);
                };
                input.click();
              }}
            >
              <Upload className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Dateien hierher ziehen oder <span className="text-foreground font-medium">auswählen</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">PDF, DOC, JPG, PNG, XLSX</p>
            </div>

            {uploadFiles.length > 0 && (
              <div className="space-y-1.5">
                {uploadFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-foreground bg-muted/30 rounded-md px-3 py-1.5">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate flex-1">{f.name}</span>
                    <button onClick={() => setUploadFiles((prev) => prev.filter((_, j) => j !== i))}>
                      <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Jahr</Label>
                <Select value={uploadYear} onValueChange={setUploadYear}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["2026", "2025", "2024", "2023", "2022"].map((y) => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Kategorie</Label>
                <Select value={uploadCategory} onValueChange={(v) => setUploadCategory(v as Category)}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Wählen" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Status (optional)</Label>
              <Select value={uploadStatus} onValueChange={(v) => setUploadStatus(v as DocStatus)}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Kein Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Kein Status</SelectItem>
                  <SelectItem value="unterzeichnet">Unterzeichnet</SelectItem>
                  <SelectItem value="offen">Offen</SelectItem>
                  <SelectItem value="archiviert">Archiviert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Beschreibung (optional)</Label>
              <Textarea
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                placeholder="Kurze Notiz zum Dokument…"
                rows={2}
                className="text-sm"
              />
            </div>

            <Button
              onClick={handleSubmitUpload}
              disabled={!uploadCategory || uploadFiles.length === 0}
              className="w-full"
            >
              {uploadFiles.length > 1 ? `${uploadFiles.length} Dokumente hochladen` : "Dokument hochladen"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentManager;
