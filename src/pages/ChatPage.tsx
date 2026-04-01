import { useState, useEffect } from "react";
import { messages as dummyMessages } from "@/lib/dummy-data";
import { useMessages } from "@/contexts/MessagesContext";
import { useUser } from "@/contexts/UserContext";
import { Send, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ChatPage = () => {
  const { userName } = useUser();
  const { messages: sharedMessages, addMessage, markAsRead } = useMessages();
  const ownerName = userName || "Eigentümer";

  // Merge dummy messages + shared (real) messages
  const allMessages = [
    ...dummyMessages.map((m) => ({
      ...m,
      // Replace "Eigentümer" with the actual owner name in dummy data
      from: m.from === "Eigentümer" ? ownerName : m.from,
      to: m.to === "Eigentümer" ? ownerName : m.to,
    })),
    ...sharedMessages,
  ];

  // Get unique contacts (everyone who isn't the owner)
  const contacts = [...new Set(allMessages.filter((m) => m.from !== ownerName).map((m) => m.from))];

  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [readDummy, setReadDummy] = useState<Set<string>>(new Set());

  const selectContact = (contact: string) => {
    // Mark shared messages as read
    markAsRead(contact, ownerName);
    // Track read state for dummy messages
    setReadDummy((prev) => new Set([...prev, contact]));
    setSelectedContact(contact);
  };

  const contactMessages = selectedContact
    ? allMessages
        .filter((m) => m.from === selectedContact || m.to === selectedContact)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    : [];

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

  const getLastMessage = (contact: string) => {
    const msgs = allMessages
      .filter((m) => m.from === contact || m.to === contact)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return msgs[msgs.length - 1];
  };

  const getUnreadCount = (contact: string) => {
    const dummyUnread = readDummy.has(contact)
      ? 0
      : dummyMessages.filter((m) => m.from === contact && !m.read).length;
    const sharedUnread = sharedMessages.filter((m) => m.from === contact && m.to === ownerName && !m.read).length;
    return dummyUnread + sharedUnread;
  };

  const showChat = selectedContact !== null;

  return (
    <div className="space-y-4 md:space-y-6">
      {!selectedContact && (
        <div className="hidden md:block">
          <h1 className="text-2xl font-heading font-bold text-foreground">Nachrichten</h1>
          <p className="text-muted-foreground text-sm mt-1">Kommunikation mit Ihren Mietern</p>
        </div>
      )}

      {/* Desktop layout */}
      <div className="hidden md:block">
        {!selectedContact ? (
          <div className="bg-card rounded-xl border overflow-hidden">
            <div className="p-3 border-b">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2">Kontakte</p>
            </div>
            <div>
              {contacts.map((contact) => {
                const unread = getUnreadCount(contact);
                const last = getLastMessage(contact);
                return (
                  <button
                    key={contact}
                    onClick={() => selectContact(contact)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/50 border-b last:border-0"
                  >
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground shrink-0">
                      {contact.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{contact}</p>
                      {last && <p className="text-xs text-muted-foreground truncate mt-0.5">{last.text}</p>}
                    </div>
                    {unread > 0 && (
                      <span className="h-5 w-5 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center">
                        {unread}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-xl border h-[calc(100vh-180px)] flex flex-col overflow-hidden">
            <div className="p-4 border-b flex items-center gap-3">
              <button onClick={() => setSelectedContact(null)} className="p-1 -ml-1 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                {selectedContact.split(" ").map((n) => n[0]).join("")}
              </div>
              <p className="font-heading font-semibold text-foreground">{selectedContact}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {contactMessages.map((m) => (
                <div key={m.id} className={`flex ${m.from === ownerName ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[60%] rounded-2xl px-4 py-2.5 text-sm ${
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
        )}
      </div>

      {/* Mobile layout */}
      <div className="md:hidden">
        {!showChat ? (
          <div>
            <h1 className="text-xl font-heading font-bold text-foreground mb-4">Nachrichten</h1>
            <div className="space-y-1">
              {contacts.map((contact) => {
                const unread = getUnreadCount(contact);
                const last = getLastMessage(contact);
                return (
                  <button
                    key={contact}
                    onClick={() => selectContact(contact)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 bg-card rounded-xl border text-left transition-colors active:bg-muted/50"
                  >
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                      {contact.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-foreground truncate">{contact}</p>
                        {last && (
                          <p className="text-[10px] text-muted-foreground ml-2 shrink-0">
                            {new Date(last.timestamp).toLocaleString("de-DE", { day: "2-digit", month: "2-digit" })}
                          </p>
                        )}
                      </div>
                      {last && <p className="text-xs text-muted-foreground truncate mt-0.5">{last.text}</p>}
                    </div>
                    {unread > 0 && (
                      <span className="h-5 min-w-[20px] rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center shrink-0">
                        {unread}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-[calc(100vh-140px)]">
            <div className="flex items-center gap-3 pb-3">
              <button onClick={() => setSelectedContact(null)} className="p-1 -ml-1 text-muted-foreground">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                {selectedContact.split(" ").map((n) => n[0]).join("")}
              </div>
              <p className="font-heading font-semibold text-foreground text-sm">{selectedContact}</p>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2.5 bg-card rounded-xl border p-3">
              {contactMessages.map((m) => (
                <div key={m.id} className={`flex ${m.from === ownerName ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                    m.from === ownerName
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  }`}>
                    {m.text}
                    <p className={`text-[10px] mt-0.5 ${m.from === ownerName ? "text-primary-foreground/50" : "text-muted-foreground"}`}>
                      {new Date(m.timestamp).toLocaleString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-3 flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Nachricht..."
                className="flex-1 h-10"
              />
              <Button size="icon" className="h-10 w-10" onClick={handleSend}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
