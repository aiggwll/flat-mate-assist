import { useState } from "react";
import { messages } from "@/lib/dummy-data";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const contacts = [...new Set(messages.filter(m => m.from !== "Eigentümer").map(m => m.from))];

const ChatPage = () => {
  const [selectedContact, setSelectedContact] = useState(contacts[0]);
  const [chatMessages, setChatMessages] = useState(messages);
  const [newMessage, setNewMessage] = useState("");

  const contactMessages = chatMessages.filter(
    m => m.from === selectedContact || m.to === selectedContact
  );

  const handleSend = () => {
    if (!newMessage.trim()) return;
    setChatMessages(prev => [
      ...prev,
      {
        id: `m-new-${Date.now()}`,
        from: "Eigentümer",
        to: selectedContact,
        text: newMessage.trim(),
        timestamp: new Date().toISOString(),
        read: true,
      },
    ]);
    setNewMessage("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Nachrichten</h1>
        <p className="text-muted-foreground text-sm mt-1">Kommunikation mit Ihren Mietern</p>
      </div>

      <div className="bg-card rounded-xl border flex h-[calc(100vh-220px)] overflow-hidden">
        <div className="w-64 border-r flex flex-col">
          <div className="p-3 border-b">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2">Kontakte</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {contacts.map(contact => {
              const unread = chatMessages.filter(m => m.from === contact && !m.read).length;
              return (
                <button
                  key={contact}
                  onClick={() => setSelectedContact(contact)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    selectedContact === contact ? "bg-accent/5 border-r-2 border-accent" : "hover:bg-muted/50"
                  }`}
                >
                  <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                    {contact.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{contact}</p>
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

        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b">
            <p className="font-heading font-semibold text-foreground">{selectedContact}</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {contactMessages.map(m => (
              <div key={m.id} className={`flex ${m.from === "Eigentümer" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                  m.from === "Eigentümer"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted text-foreground rounded-bl-md"
                }`}>
                  {m.text}
                  <p className={`text-[10px] mt-1 ${m.from === "Eigentümer" ? "text-primary-foreground/50" : "text-muted-foreground"}`}>
                    {new Date(m.timestamp).toLocaleString("de-DE", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t flex gap-2">
            <Input
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              placeholder="Nachricht schreiben..."
              className="flex-1"
            />
            <Button size="icon" onClick={handleSend}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
