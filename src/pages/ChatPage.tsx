import { useState, useEffect, useRef } from "react";
import { useMessages } from "@/contexts/MessagesContext";
import { useUser } from "@/contexts/UserContext";
import { sal } from "@/lib/salutation";
import { Send, ArrowLeft, MessageSquare, PenSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TenantOption {
  userId: string;
  name: string;
  propertyAddress: string;
}

const ChatPage = () => {
  const { userName, userId, salutation } = useUser();
  const { messages, addMessage, markAsRead } = useMessages();
  const ownerName = userName || "Eigentümer";
  const scrollRef = useRef<HTMLDivElement>(null);

  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [newRecipient, setNewRecipient] = useState("");
  const [newText, setNewText] = useState("");
  const [sending, setSending] = useState(false);

  // Load tenant list for "Neue Nachricht" dialog
  useEffect(() => {
    const loadTenants = async () => {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, property_id")
        .eq("role", "tenant");

      if (!profiles) return;

      // Get property addresses
      const propertyIds = [...new Set(profiles.map(p => p.property_id).filter(Boolean))];
      let propertyMap = new Map<string, string>();
      if (propertyIds.length > 0) {
        const { data: props } = await supabase
          .from("properties")
          .select("id, address, city")
          .in("id", propertyIds as string[]);
        if (props) {
          propertyMap = new Map(props.map(p => [p.id, `${p.address}, ${p.city}`]));
        }
      }

      setTenants(
        profiles.map(p => ({
          userId: p.user_id,
          name: p.name || "Unbekannt",
          propertyAddress: p.property_id ? (propertyMap.get(p.property_id) || "") : "",
        }))
      );
    };
    loadTenants();
  }, []);

  // Build contacts from messages
  const allMessages = messages;
  const contactMap = new Map<string, { name: string; contactUserId: string }>();
  allMessages.forEach((m) => {
    if (m.sender_id && m.sender_id !== userId) {
      contactMap.set(m.sender_id, { name: m.from, contactUserId: m.sender_id });
    }
    if (m.receiver_id && m.receiver_id !== userId) {
      contactMap.set(m.receiver_id, { name: m.to, contactUserId: m.receiver_id });
    }
  });
  const contacts = Array.from(contactMap.values());

  const selectContact = (name: string) => {
    markAsRead(name, ownerName);
    setSelectedContact(name);
  };

  const contactMessages = selectedContact
    ? allMessages
        .filter((m) => m.from === selectedContact || m.to === selectedContact)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    : [];

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [contactMessages.length]);

  const handleSend = () => {
    if (!newMessage.trim() || !selectedContact) return;
    addMessage({
      from: ownerName,
      to: selectedContact,
      text: newMessage.trim(),
      timestamp: new Date().toISOString(),
      read: true,
    });
    setNewMessage("");
  };

  const handleNewMessage = async () => {
    if (!newRecipient || !newText.trim()) return;
    setSending(true);
    const tenant = tenants.find(t => t.userId === newRecipient);
    if (tenant) {
      await addMessage({
        from: ownerName,
        to: tenant.name,
        text: newText.trim(),
        timestamp: new Date().toISOString(),
        read: false,
      });
      toast.success("Nachricht gesendet");
      setShowNewDialog(false);
      setNewRecipient("");
      setNewText("");
      setSelectedContact(tenant.name);
    }
    setSending(false);
  };

  const getLastMessage = (name: string) => {
    const msgs = allMessages
      .filter((m) => m.from === name || m.to === name)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return msgs[msgs.length - 1];
  };

  const getUnreadCount = (name: string) =>
    messages.filter((m) => m.from === name && m.to === ownerName && !m.read).length;

  // Find tenant property address
  const getTenantProperty = (name: string) => {
    const t = tenants.find(t => t.name === name);
    return t?.propertyAddress || "";
  };

  const Initials = ({ name, className = "" }: { name: string; className?: string }) => (
    <div className={`rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground shrink-0 ${className}`}>
      {name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
    </div>
  );

  const NewMessageDialog = () => (
    <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Neue Nachricht</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Empfänger</label>
            <Select value={newRecipient} onValueChange={setNewRecipient}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Mieter auswählen…" />
              </SelectTrigger>
              <SelectContent>
                {tenants.map((t) => (
                  <SelectItem key={t.userId} value={t.userId}>
                    {t.name}{t.propertyAddress ? ` — ${t.propertyAddress}` : ""}
                  </SelectItem>
                ))}
                {tenants.length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">Keine Mieter gefunden</div>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Nachricht</label>
            <Textarea
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Ihre Nachricht…"
              rows={4}
              className="text-sm"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowNewDialog(false)}>Abbrechen</Button>
          <Button size="sm" onClick={handleNewMessage} disabled={sending || !newRecipient || !newText.trim()} className="gap-2">
            <Send className="h-3.5 w-3.5" />
            Senden
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const ContactList = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={mobile ? "space-y-1" : "bg-card rounded-xl border overflow-hidden"}>
      {!mobile && (
        <div className="p-3 border-b">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2">Kontakte</p>
        </div>
      )}
      <div>
        {contacts.map(({ name }) => {
          const unread = getUnreadCount(name);
          const last = getLastMessage(name);
          const propAddr = getTenantProperty(name);
          return (
            <button
              key={name}
              onClick={() => selectContact(name)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${
                mobile
                  ? "bg-card rounded-xl border active:bg-muted/50"
                  : `hover:bg-muted/50 border-b last:border-0 ${selectedContact === name ? "bg-muted/50" : ""}`
              }`}
            >
              <div className="relative">
                <Initials name={name} className="h-10 w-10 text-sm" />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-primary border-2 border-card" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground truncate">{name}</p>
                  {last && (
                    <p className="text-[10px] text-muted-foreground ml-2 shrink-0">
                      {new Date(last.timestamp).toLocaleString("de-DE", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                    </p>
                  )}
                </div>
                {propAddr && <p className="text-[11px] text-muted-foreground truncate">{propAddr}</p>}
                {last && <p className="text-xs text-muted-foreground truncate mt-0.5">{last.text}</p>}
              </div>
              {unread > 0 && (
                <span className="h-5 min-w-[20px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shrink-0">
                  {unread}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  const ChatView = ({ mobile = false }: { mobile?: boolean }) => {
    if (!selectedContact) return null;
    return (
      <div className={`flex flex-col overflow-hidden ${mobile ? "h-[calc(100vh-140px)]" : "bg-card rounded-xl border h-[calc(100vh-180px)]"}`}>
        <div className="p-4 border-b flex items-center gap-3">
          <button onClick={() => setSelectedContact(null)} className="p-1 -ml-1 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Initials name={selectedContact} className={mobile ? "h-8 w-8 text-xs" : "h-9 w-9 text-xs"} />
          <div className="min-w-0">
            <p className="font-heading font-semibold text-foreground text-sm">{selectedContact}</p>
            {getTenantProperty(selectedContact) && (
              <p className="text-[11px] text-muted-foreground truncate">{getTenantProperty(selectedContact)}</p>
            )}
          </div>
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {contactMessages.map((m) => (
            <div key={m.id} className={`flex ${m.from === ownerName ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[${mobile ? "80" : "60"}%] rounded-2xl px-4 py-2.5 text-sm ${
                m.from === ownerName
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-muted text-foreground rounded-bl-md"
              }`}>
                {m.text}
                <p className={`text-[10px] mt-1 ${m.from === ownerName ? "text-primary-foreground/50" : "text-muted-foreground"}`}>
                  {new Date(m.timestamp).toLocaleString("de-DE", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Nachricht schreiben..."
            className="flex-1"
          />
          <Button size="icon" onClick={handleSend}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const emptyText = sal(
    salutation,
    "Noch keine Nachrichten. Starten Sie das Gespräch mit Ihren Mietern.",
    "Noch keine Nachrichten. Starte das Gespräch mit deinen Mietern."
  );

  // Empty state
  if (contacts.length === 0 && !selectedContact) {
    return (
      <div className="space-y-6">
        <NewMessageDialog />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Nachrichten</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {sal(salutation, "Kommunikation mit Ihren Mietern", "Kommunikation mit deinen Mietern")}
            </p>
          </div>
          <Button size="sm" className="gap-2" onClick={() => setShowNewDialog(true)}>
            <PenSquare className="h-4 w-4" />
            Neue Nachricht
          </Button>
        </div>
        <div className="bg-card rounded-xl border p-12 text-center space-y-3">
          <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mx-auto">
            <MessageSquare className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">Noch keine Nachrichten</p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">{emptyText}</p>
          <Button size="sm" className="gap-2 mt-2" onClick={() => setShowNewDialog(true)}>
            <PenSquare className="h-4 w-4" />
            Erste Nachricht senden
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <NewMessageDialog />

      {/* Header */}
      {!selectedContact && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Nachrichten</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {sal(salutation, "Kommunikation mit Ihren Mietern", "Kommunikation mit deinen Mietern")}
            </p>
          </div>
          <Button size="sm" className="gap-2" onClick={() => setShowNewDialog(true)}>
            <PenSquare className="h-4 w-4" />
            Neue Nachricht
          </Button>
        </div>
      )}

      {/* Desktop: split view */}
      <div className="hidden md:grid md:grid-cols-[320px_1fr] gap-4">
        <ContactList />
        {selectedContact ? (
          <ChatView />
        ) : (
          <div className="bg-card rounded-xl border flex items-center justify-center h-[calc(100vh-180px)]">
            <div className="text-center space-y-2">
              <MessageSquare className="h-8 w-8 text-muted-foreground/40 mx-auto" />
              <p className="text-sm text-muted-foreground">
                {sal(salutation, "Wählen Sie einen Kontakt aus", "Wähle einen Kontakt aus")}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Mobile */}
      <div className="md:hidden">
        {!selectedContact ? (
          <ContactList mobile />
        ) : (
          <ChatView mobile />
        )}
      </div>
    </div>
  );
};

export default ChatPage;
