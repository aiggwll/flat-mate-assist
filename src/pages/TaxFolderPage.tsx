import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import EmptyState from "@/components/EmptyState";
import { sal } from "@/lib/salutation";
import { Upload, FileText, Trash2, CalendarIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { key: "mieteinnahmen", label: "📥 Mieteinnahmen", type: "income" },
  { key: "reparaturen", label: "🔧 Reparaturen & Erhaltungsaufwand", type: "expense" },
  { key: "schuldzinsen", label: "🏦 Schuldzinsen (Hypothek)", type: "expense" },
  { key: "grundsteuer", label: "🏛️ Grundsteuer", type: "expense" },
  { key: "versicherungen", label: "🛡️ Versicherungen", type: "expense" },
  { key: "nebenkosten", label: "⚡ Nebenkosten (nicht umlagefähig)", type: "expense" },
  { key: "fahrtkosten", label: "🚗 Fahrtkosten", type: "expense" },
  { key: "verwaltungskosten", label: "📋 Verwaltungskosten", type: "expense" },
  { key: "sonstige", label: "📦 Sonstige Werbungskosten", type: "expense" },
];

interface TaxDoc {
  id: string;
  filename: string;
  file_url: string;
  category: string;
  amount: number;
  document_date: string | null;
  description: string;
  year: number;
  property_id: string | null;
  created_at: string;
}

const currentYear = new Date().getFullYear();

const TaxFolderPage = () => {
  const { userProperties, userId, salutation } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [documents, setDocuments] = useState<TaxDoc[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formAmount, setFormAmount] = useState("");
  const [formDate, setFormDate] = useState<Date | undefined>();
  const [formCategory, setFormCategory] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPropertyId, setFormPropertyId] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const loadDocuments = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase
      .from("tax_documents")
      .select("*")
      .eq("user_id", userId)
      .eq("year", parseInt(selectedYear))
      .order("created_at", { ascending: false });
    setDocuments((data as TaxDoc[]) || []);
    setLoading(false);
  }, [userId, selectedYear]);

  useEffect(() => { loadDocuments(); }, [loadDocuments]);

  useEffect(() => {
    if (userProperties.length > 0 && !formPropertyId) {
      setFormPropertyId(userProperties[0].id);
    }
  }, [userProperties, formPropertyId]);

  const handleFileSelect = (file: File) => {
    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowed.includes(file.type)) {
      toast.error("Nur JPG, PNG oder PDF erlaubt.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Datei darf maximal 10 MB groß sein.");
      return;
    }
    setUploadFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]);
  };

  const resetForm = () => {
    setUploadFile(null);
    setFormAmount("");
    setFormDate(undefined);
    setFormCategory("");
    setFormDescription("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async () => {
    if (!uploadFile || !userId || !formCategory) {
      toast.error("Bitte Datei und Kategorie auswählen.");
      return;
    }
    setUploading(true);
    try {
      const ext = uploadFile.name.split(".").pop();
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error: storageError } = await supabase.storage
        .from("tax-documents")
        .upload(path, uploadFile);
      if (storageError) throw storageError;

      const { data: urlData } = supabase.storage
        .from("tax-documents")
        .getPublicUrl(path);

      const { error: dbError } = await supabase.from("tax_documents").insert({
        user_id: userId,
        property_id: formPropertyId || null,
        filename: uploadFile.name,
        file_url: urlData.publicUrl,
        category: formCategory,
        amount: parseFloat(formAmount) || 0,
        document_date: formDate ? format(formDate, "yyyy-MM-dd") : null,
        description: formDescription,
        year: parseInt(selectedYear),
      });
      if (dbError) throw dbError;

      toast.success("Beleg gespeichert!");
      resetForm();
      loadDocuments();
    } catch (e: any) {
      console.error("Upload error:", e);
      toast.error("Fehler: " + (e.message || "Unbekannt"));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc: TaxDoc) => {
    const pathMatch = doc.file_url.match(/tax-documents\/(.+)$/);
    if (pathMatch) {
      await supabase.storage.from("tax-documents").remove([pathMatch[1]]);
    }
    await supabase.from("tax_documents").delete().eq("id", doc.id);
    toast.success("Beleg gelöscht.");
    loadDocuments();
  };

  // Summary calculations
  const summary = useMemo(() => {
    const income = documents
      .filter(d => CATEGORIES.find(c => c.key === d.category)?.type === "income")
      .reduce((s, d) => s + d.amount, 0);
    const expenses = documents
      .filter(d => CATEGORIES.find(c => c.key === d.category)?.type === "expense")
      .reduce((s, d) => s + d.amount, 0);
    return { income, expenses, result: income - expenses };
  }, [documents]);

  const categoryTotals = useMemo(() => {
    const map: Record<string, number> = {};
    documents.forEach(d => { map[d.category] = (map[d.category] || 0) + d.amount; });
    return map;
  }, [documents]);

  const years = Array.from({ length: 5 }, (_, i) => String(currentYear - i));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Steuermappe</h1>
          <p className="text-sm text-muted-foreground mt-1">Belege sammeln und Einnahmen/Ausgaben für die Steuererklärung verwalten</p>
        </div>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Upload Area */}
      <div className="bg-card rounded-2xl border">
        <div className="p-5 border-b">
          <h2 className="text-base font-heading font-semibold text-foreground">Beleg hochladen</h2>
        </div>
        <div className="p-5 space-y-5">
          {!uploadFile ? (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors",
                dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-primary/50"
              )}
            >
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">Beleg hochladen — Foto oder Datei</p>
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG oder PDF (max. 10 MB)</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                className="hidden"
                onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-muted/30 rounded-xl px-4 py-3">
                <FileText className="h-5 w-5 text-primary shrink-0" />
                <span className="text-sm font-medium text-foreground truncate flex-1">{uploadFile.name}</span>
                <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Betrag (€)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    value={formAmount}
                    onChange={e => setFormAmount(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Datum</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formDate ? format(formDate, "dd.MM.yyyy") : "Datum wählen"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formDate}
                        onSelect={setFormDate}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Kategorie *</label>
                  <Select value={formCategory} onValueChange={setFormCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Kategorie wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => (
                        <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Immobilie</label>
                  <Select value={formPropertyId} onValueChange={setFormPropertyId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Immobilie wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {userProperties.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.address}, {p.city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Beschreibung (optional)</label>
                <Textarea
                  placeholder="z.B. Rechnung Klempner Badezimmer"
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  rows={2}
                />
              </div>

              <Button onClick={handleSave} disabled={uploading} className="rounded-xl h-11 font-semibold w-full sm:w-auto">
                {uploading ? "Wird hochgeladen..." : "Speichern"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl border p-5 space-y-1">
          <p className="text-xs text-muted-foreground font-medium">Gesamteinnahmen</p>
          <p className="text-xl font-bold text-primary">{formatCurrency(summary.income)}</p>
        </div>
        <div className="bg-card rounded-2xl border p-5 space-y-1">
          <p className="text-xs text-muted-foreground font-medium">Gesamtausgaben / Werbungskosten</p>
          <p className="text-xl font-bold text-destructive">{formatCurrency(summary.expenses)}</p>
        </div>
        <div className="bg-card rounded-2xl border p-5 space-y-1">
          <p className="text-xs text-muted-foreground font-medium">Vorläufiges Ergebnis</p>
          <p className={cn("text-xl font-bold", summary.result >= 0 ? "text-primary" : "text-destructive")}>
            {summary.result >= 0 ? "+" : ""}{formatCurrency(Math.abs(summary.result))}
          </p>
        </div>
      </div>

      {/* Category Breakdown */}
      {documents.length > 0 && (
        <div className="bg-card rounded-2xl border">
          <div className="p-5 border-b">
            <h2 className="text-base font-heading font-semibold text-foreground">Aufschlüsselung nach Kategorie</h2>
          </div>
          <div className="divide-y">
            {CATEGORIES.filter(c => categoryTotals[c.key]).map(cat => (
              <div key={cat.key} className="flex items-center justify-between px-5 py-3">
                <span className="text-sm font-medium text-foreground">{cat.label}</span>
                <span className={cn("text-sm font-semibold", cat.type === "income" ? "text-primary" : "text-destructive")}>
                  {cat.type === "income" ? "+" : "-"}{categoryTotals[cat.key].toFixed(2)} €
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Document List */}
      <div className="bg-card rounded-2xl border">
        <div className="p-5 border-b">
          <h2 className="text-base font-heading font-semibold text-foreground">Belege ({documents.length})</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Laden...</div>
        ) : documents.length === 0 ? (
          <EmptyState
            icon={FileText}
            headline={sal(salutation || "sie",
              "Sammeln Sie Ihre Belege für die Steuererklärung",
              "Sammle deine Belege für die Steuererklärung"
            )}
            subtext="Laden Sie Rechnungen, Quittungen und Nachweise hoch — übersichtlich nach Kategorie sortiert."
            buttonLabel="Beleg hochladen"
            onAction={() => fileInputRef.current?.click()}
          />
        ) : (
          <div className="divide-y">
            {documents.map(doc => {
              const cat = CATEGORIES.find(c => c.key === doc.category);
              return (
                <div key={doc.id} className="flex items-center gap-3 px-5 py-3">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-foreground hover:text-primary truncate block">
                      {doc.filename}
                    </a>
                    <div className="flex items-center gap-2 mt-0.5">
                      {cat && <span className="text-xs text-muted-foreground">{cat.label}</span>}
                      {doc.document_date && <span className="text-xs text-muted-foreground">• {format(new Date(doc.document_date), "dd.MM.yyyy")}</span>}
                    </div>
                  </div>
                  <span className={cn("text-sm font-semibold shrink-0", cat?.type === "income" ? "text-primary" : "text-destructive")}>
                    {doc.amount.toFixed(2)} €
                  </span>
                  <button onClick={() => handleDelete(doc)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaxFolderPage;
