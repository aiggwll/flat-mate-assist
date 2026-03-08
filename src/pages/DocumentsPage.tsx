import { useState } from "react";
import { FileText, Upload, Search, Trash2, Download, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { properties } from "@/lib/dummy-data";

interface UploadedDoc {
  id: string;
  name: string;
  type: string;
  property: string;
  unit: string;
  uploadedAt: string;
  size: string;
}

const initialDocs: UploadedDoc[] = [
  { id: "doc1", name: "Mietvertrag_Mueller.pdf", type: "Mietvertrag", property: "Berliner Str. 42", unit: "1.OG Links", uploadedAt: "2022-03-01", size: "245 KB" },
  { id: "doc2", name: "Mietvertrag_Schmidt.pdf", type: "Mietvertrag", property: "Berliner Str. 42", unit: "2.OG Rechts", uploadedAt: "2021-08-15", size: "312 KB" },
  { id: "doc3", name: "Rechnung_Sanitaer.pdf", type: "Rechnung", property: "Berliner Str. 42", unit: "2.OG Rechts", uploadedAt: "2024-05-20", size: "89 KB" },
  { id: "doc4", name: "Mietvertrag_Weber.pdf", type: "Mietvertrag", property: "Mozartstraße 15", unit: "1.OG", uploadedAt: "2023-01-01", size: "278 KB" },
  { id: "doc5", name: "Energieausweis_Berlin.pdf", type: "Energieausweis", property: "Berliner Str. 42", unit: "–", uploadedAt: "2023-06-10", size: "1.2 MB" },
  { id: "doc6", name: "Grundriss_Hamburg.pdf", type: "Grundriss", property: "Hauptstraße 8", unit: "–", uploadedAt: "2020-11-15", size: "3.4 MB" },
];

const typeColors: Record<string, string> = {
  Mietvertrag: "bg-primary/10 text-primary",
  Rechnung: "bg-accent/10 text-accent",
  Energieausweis: "bg-warning/10 text-warning",
  Grundriss: "bg-muted text-muted-foreground",
};

const DocumentsPage = () => {
  const [docs, setDocs] = useState<UploadedDoc[]>(initialDocs);
  const [search, setSearch] = useState("");
  const [filterProperty, setFilterProperty] = useState("all");

  const filtered = docs.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.type.toLowerCase().includes(search.toLowerCase());
    const matchesProperty = filterProperty === "all" || d.property === filterProperty;
    return matchesSearch && matchesProperty;
  });

  const handleUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = ".pdf,.doc,.docx,.jpg,.png";
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files) return;
      const newDocs: UploadedDoc[] = Array.from(files).map((file, i) => ({
        id: `upload-${Date.now()}-${i}`,
        name: file.name,
        type: "Sonstiges",
        property: "–",
        unit: "–",
        uploadedAt: new Date().toISOString().split("T")[0],
        size: file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(file.size / 1024)} KB`,
      }));
      setDocs(prev => [...newDocs, ...prev]);
    };
    input.click();
  };

  const handleDelete = (id: string) => {
    setDocs(prev => prev.filter(d => d.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Dokumente</h1>
          <p className="text-muted-foreground text-sm mt-1">{docs.length} Dokumente gespeichert</p>
        </div>
        <Button onClick={handleUpload} className="gap-2">
          <Upload className="h-4 w-4" />
          Hochladen
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Dokument suchen…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={filterProperty}
          onChange={e => setFilterProperty(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
        >
          <option value="all">Alle Immobilien</option>
          {properties.map(p => (
            <option key={p.id} value={p.address}>{p.address}</option>
          ))}
        </select>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="hidden sm:grid grid-cols-[1fr_120px_160px_100px_120px_60px] gap-4 px-5 py-3 border-b bg-muted/30 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          <span>Name</span>
          <span>Typ</span>
          <span>Immobilie</span>
          <span>Wohnung</span>
          <span>Datum</span>
          <span></span>
        </div>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <FileText className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm">Keine Dokumente gefunden.</p>
          </div>
        ) : (
          filtered.map(doc => (
            <div key={doc.id} className="grid grid-cols-1 sm:grid-cols-[1fr_120px_160px_100px_120px_60px] gap-2 sm:gap-4 px-5 py-4 border-b last:border-0 hover:bg-muted/20 transition-colors items-center">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/5 flex items-center justify-center text-primary shrink-0">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                  <p className="text-xs text-muted-foreground sm:hidden">{doc.size}</p>
                </div>
              </div>
              <div>
                <Badge variant="secondary" className={`border-0 text-xs ${typeColors[doc.type] || "bg-muted text-muted-foreground"}`}>
                  {doc.type}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Building2 className="h-3.5 w-3.5 shrink-0 hidden sm:block" />
                <span className="truncate">{doc.property}</span>
              </div>
              <span className="text-sm text-muted-foreground">{doc.unit}</span>
              <span className="text-sm text-muted-foreground">{new Date(doc.uploadedAt).toLocaleDateString("de-DE")}</span>
              <div className="flex items-center gap-1">
                <button className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <Download className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => handleDelete(doc.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DocumentsPage;
