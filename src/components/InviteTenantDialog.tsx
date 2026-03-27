import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Copy, Check, Mail } from "lucide-react";
import { properties as dummyProperties } from "@/lib/dummy-data";
import { toast } from "@/components/ui/sonner";
import { useUser } from "@/contexts/UserContext";

const InviteTenantDialog = () => {
  const { userProperties, userName } = useUser();
  const ownerDisplayName = userName || "Max Kaufmann";
  const [open, setOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [tenantEmail, setTenantEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const [linkGenerated, setLinkGenerated] = useState(false);

  // Use user-created properties if available, otherwise fall back to dummy data
  const hasUserProperties = userProperties.length > 0;

  const propertyList = hasUserProperties
    ? userProperties.map(p => ({ id: p.id, label: `${p.address}, ${p.city}`, units: Array.from({ length: p.units }, (_, i) => ({ id: `${p.id}-u${i + 1}`, number: `Whg. ${i + 1}`, size: 0, rent: 0, hasTenant: false })) }))
    : dummyProperties.map(p => ({ id: p.id, label: `${p.address}, ${p.city}`, units: p.units.map(u => ({ id: u.id, number: u.number, size: u.size, rent: u.rent, hasTenant: !!u.tenant })) }));

  const selectedProp = propertyList.find(p => p.id === selectedProperty);
  const availableUnits = selectedProp?.units.filter(u => !u.hasTenant) ?? [];

  const selectedUnitObj = selectedProp?.units.find(u => u.id === selectedUnit);

  const inviteLink = linkGenerated
    ? `${window.location.origin}/?role=tenant&property=${encodeURIComponent(selectedProp?.label || "")}&unit=${encodeURIComponent(selectedUnitObj?.number || "")}&owner=${encodeURIComponent(userName)}`
    : "";

  const handleGenerateLink = () => {
    if (!selectedProperty || !selectedUnit) {
      toast("Bitte wählen Sie eine Immobilie und Wohnung aus.");
      return;
    }
    if (!tenantName.trim()) {
      toast("Bitte geben Sie den Namen des Mieters ein.");
      return;
    }
    if (!tenantEmail.trim()) {
      toast("Bitte geben Sie die E-Mail-Adresse des Mieters ein.");
      return;
    }
    setLinkGenerated(true);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast("Einladungslink kopiert!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmail = () => {
    if (!tenantEmail) {
      toast("Bitte geben Sie eine E-Mail-Adresse ein.");
      return;
    }
    const subject = encodeURIComponent("Einladung zu WillProp");
    const body = encodeURIComponent(
      `Hallo ${tenantName},\n\nSie wurden eingeladen, WillProp als Mieter zu nutzen.\n\nBitte registrieren Sie sich über folgenden Link:\n${inviteLink}\n\nMit freundlichen Grüßen`
    );
    window.open(`mailto:${tenantEmail}?subject=${subject}&body=${body}`);
    toast("E-Mail-Client wird geöffnet...");
  };

  const handleReset = () => {
    setSelectedProperty("");
    setSelectedUnit("");
    setTenantName("");
    setTenantEmail("");
    setLinkGenerated(false);
    setCopied(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) handleReset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Mieter einladen
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Mieter einladen</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Immobilie</Label>
            <select
              value={selectedProperty}
              onChange={(e) => { setSelectedProperty(e.target.value); setSelectedUnit(""); setLinkGenerated(false); }}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Immobilie wählen...</option>
              {propertyList.map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Wohnung (nur unvermietete)</Label>
            <select
              value={selectedUnit}
              onChange={(e) => { setSelectedUnit(e.target.value); setLinkGenerated(false); }}
              disabled={!selectedProperty}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50"
            >
              <option value="">Wohnung wählen...</option>
              {availableUnits.map(u => (
                <option key={u.id} value={u.id}>{u.number}{u.size ? ` – ${u.size} m²` : ""}{u.rent ? ` – ${u.rent} €` : ""}</option>
              ))}
            </select>
            {selectedProperty && availableUnits.length === 0 && (
              <p className="text-xs text-muted-foreground">Alle Wohnungen dieser Immobilie sind bereits vermietet.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Name des Mieters *</Label>
            <Input
              placeholder="Max Mustermann"
              value={tenantName}
              onChange={(e) => { setTenantName(e.target.value); setLinkGenerated(false); }}
            />
          </div>

          <div className="space-y-2">
            <Label>E-Mail des Mieters *</Label>
            <Input
              type="email"
              placeholder="mieter@beispiel.de"
              value={tenantEmail}
              onChange={(e) => { setTenantEmail(e.target.value); setLinkGenerated(false); }}
            />
          </div>

          {!linkGenerated ? (
            <Button onClick={handleGenerateLink} className="w-full gap-2" disabled={!selectedProperty || !selectedUnit || !tenantName.trim() || !tenantEmail.trim()}>
              Einladungslink erstellen
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Einladungslink</Label>
                <div className="flex gap-2">
                  <Input value={inviteLink} readOnly className="text-xs" />
                  <Button variant="outline" size="icon" onClick={handleCopy}>
                    {copied ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button variant="outline" className="w-full gap-2" onClick={handleSendEmail}>
                <Mail className="h-4 w-4" />
                Einladung per E-Mail senden
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InviteTenantDialog;
