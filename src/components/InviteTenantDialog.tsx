import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Copy, Check, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/integrations/supabase/client";

interface InviteTenantDialogProps {
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

const InviteTenantDialog = ({ onSuccess, trigger }: InviteTenantDialogProps) => {
  const { userProperties, userName, userId } = useUser();
  const ownerDisplayName = userName || "Vermieter";
  const [open, setOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [tenantEmail, setTenantEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const [linkGenerated, setLinkGenerated] = useState(false);
  const [sending, setSending] = useState(false);

  const propertyList = userProperties.map(p => ({
    id: p.id,
    label: `${p.address}, ${p.city}`,
    units: Array.from({ length: p.units }, (_, i) => ({
      id: `${p.id}-u${i + 1}`,
      number: `Whg. ${i + 1}`,
      size: 0,
      rent: 0,
      hasTenant: false,
    })),
  }));

  const selectedProp = propertyList.find(p => p.id === selectedProperty);
  const availableUnits = selectedProp?.units ?? [];
  const selectedUnitObj = selectedProp?.units.find(u => u.id === selectedUnit);

  const inviteLink = linkGenerated
    ? `${window.location.origin}/register?role=tenant&property=${encodeURIComponent(selectedProp?.label || "")}&unit=${encodeURIComponent(selectedUnitObj?.number || "")}&owner=${encodeURIComponent(ownerDisplayName)}&property_id=${encodeURIComponent(selectedProperty)}`
    : "";

  const saveInvitation = async (link: string) => {
    if (!userId) return;
    try {
      await supabase.from("invitations" as any).insert({
        email: tenantEmail.trim(),
        tenant_name: tenantName.trim(),
        property_id: selectedProperty,
        unit_id: selectedUnit,
        invited_by: userId,
        invite_link: link,
        status: "pending",
      } as any);
    } catch (e) {
      console.error("Error saving invitation:", e);
    }
  };

  const handleGenerateLink = async () => {
    if (!selectedProperty || !selectedUnit) {
      toast.error("Bitte wählen Sie eine Immobilie und Wohnung aus.");
      return;
    }
    if (!tenantName.trim()) {
      toast.error("Bitte geben Sie den Namen des Mieters ein.");
      return;
    }
    if (!tenantEmail.trim()) {
      toast.error("Bitte geben Sie die E-Mail-Adresse des Mieters ein.");
      return;
    }
    setSending(true);
    setLinkGenerated(true);

    // Build the link synchronously since it depends on state that's already set
    const link = `${window.location.origin}/register?role=tenant&property=${encodeURIComponent(selectedProp?.label || "")}&unit=${encodeURIComponent(selectedUnitObj?.number || "")}&owner=${encodeURIComponent(ownerDisplayName)}&property_id=${encodeURIComponent(selectedProperty)}`;

    await saveInvitation(link);
    setSending(false);
    toast.success(`Einladung wurde erfolgreich an ${tenantEmail.trim()} versendet.`);
    onSuccess?.();
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success("Einladungslink kopiert!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmail = () => {
    if (!tenantEmail) {
      toast.error("Bitte geben Sie eine E-Mail-Adresse ein.");
      return;
    }
    const subject = encodeURIComponent("Einladung zu Dwello");
    const body = encodeURIComponent(
      `Hallo ${tenantName},\n\nSie wurden eingeladen, Dwello als Mieter zu nutzen.\n\nBitte registrieren Sie sich über folgenden Link:\n${inviteLink}\n\nMit freundlichen Grüßen`
    );
    window.open(`mailto:${tenantEmail}?subject=${subject}&body=${body}`);
    toast.success(`E-Mail-Einladung an ${tenantEmail} wird vorbereitet...`);
  };

  const handleReset = () => {
    setSelectedProperty("");
    setSelectedUnit("");
    setTenantName("");
    setTenantEmail("");
    setLinkGenerated(false);
    setCopied(false);
    setSending(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) handleReset(); }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Mieter einladen
          </Button>
        )}
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
            <Label>Wohnung</Label>
            <select
              value={selectedUnit}
              onChange={(e) => { setSelectedUnit(e.target.value); setLinkGenerated(false); }}
              disabled={!selectedProperty}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50"
            >
              <option value="">Wohnung wählen...</option>
              {availableUnits.map(u => (
                <option key={u.id} value={u.id}>
                  {u.number}{u.size ? ` – ${u.size} m²` : ""}{u.rent ? ` – ${u.rent} €` : ""}
                </option>
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
            <Button
              onClick={handleGenerateLink}
              className="w-full gap-2"
              disabled={!selectedProperty || !selectedUnit || !tenantName.trim() || !tenantEmail.trim() || sending}
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Wird erstellt…
                </>
              ) : (
                "Einladungslink erstellen"
              )}
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Einladungslink</Label>
                <div className="flex gap-2">
                  <Input value={inviteLink} readOnly className="text-xs" />
                  <Button variant="outline" size="icon" onClick={handleCopy}>
                    {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
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
