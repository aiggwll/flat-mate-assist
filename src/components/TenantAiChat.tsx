import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Bot, ArrowRight, MessageSquare, Plus } from "lucide-react";

type ChatMsg = { role: "user" | "assistant"; content: string };

interface TenantAiChatProps {
  propertyInfo: {
    address: string;
    unit: string;
    rent: number;
    landlord: string;
  };
  tenantName: string;
  landlordName: string;
  onEscalate: (message: string) => void;
  damageButton?: React.ReactNode;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tenant-chat`;

const TenantAiChat = ({ propertyInfo, tenantName, landlordName, onEscalate, damageButton }: TenantAiChatProps) => {
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "assistant", content: `Hallo, ich bin Henrik, Ihr WillProp KI-Assistent. Gerne beantworte ich Ihre Fragen zu Wohnung, Nebenkosten und Hausordnung. Sollte Ihre Frage meine Kompetenzen übersteigen, leite ich Ihr Anliegen gerne an Ihren Vermieter weiter.` },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showEscalateOption, setShowEscalateOption] = useState(false);
  const [escalateMessage, setEscalateMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: ChatMsg = { role: "user", content: input.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);
    setShowEscalateOption(false);

    let assistantSoFar = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: allMessages.map((m) => ({ role: m.role, content: m.content })),
          propertyInfo,
        }),
      });

      if (!resp.ok || !resp.body) {
        throw new Error("Stream fehlgeschlagen");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && prev.length === allMessages.length + 1) {
                  return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Always show escalation option after AI responds
      setShowEscalateOption(true);
      const context = allMessages.slice(-3).map((m) => m.content).join("\n");
      setEscalateMessage(context);
    } catch (err) {
      console.error("AI chat error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Entschuldigung, es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEscalate = () => {
    onEscalate(escalateMessage);
    setShowEscalateOption(false);
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "✅ Ihre Nachricht wurde an den Vermieter weitergeleitet. Sie erhalten eine Antwort im Chat." },
    ]);
  };

  return (
    <Card className="flex flex-col h-[500px]">
      <div className="p-4 border-b flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center">
          <Bot className="h-4 w-4 text-accent" />
        </div>
        <div>
          <p className="font-heading font-semibold text-foreground text-sm">Henrik</p>
          <p className="text-[10px] text-muted-foreground">WillProp KI-Assistent</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-muted text-foreground rounded-bl-md"
              }`}
            >
              {m.role === "assistant" && (
                <div className="flex items-center gap-1.5 mb-1">
                  <Bot className="h-3 w-3 text-accent" />
                  <span className="text-[10px] font-medium text-accent">Henrik</span>
                </div>
              )}
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="h-2 w-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="h-2 w-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        {showEscalateOption && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleEscalate}
              className="gap-2 border-accent text-accent hover:bg-accent/10"
            >
              <ArrowRight className="h-3.5 w-3.5" />
              Nachricht an Vermieter weiterleiten
            </Button>
          </div>
        )}
      </div>

      <div className="p-4 border-t flex gap-2">
        {damageButton}
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Frage stellen..."
          className="flex-1"
          disabled={isLoading}
        />
        <Button size="icon" onClick={sendMessage} disabled={isLoading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};

export default TenantAiChat;
