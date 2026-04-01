import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ChatMessage {
  id: string;
  from: string;
  to: string;
  text: string;
  timestamp: string;
  read: boolean;
  sender_id?: string;
  receiver_id?: string;
}

interface MessagesContextType {
  messages: ChatMessage[];
  addMessage: (msg: Omit<ChatMessage, "id">) => void;
  markAsRead: (from: string, to: string) => void;
  loadMessages: () => Promise<void>;
}

const MessagesContext = createContext<MessagesContextType | null>(null);

export const MessagesProvider = ({ children }: { children: ReactNode }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const loadMessages = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading messages:", error);
      return;
    }

    if (data) {
      // We need sender/receiver names - fetch profiles
      const userIds = [...new Set(data.flatMap(m => [m.sender_id, m.receiver_id]))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name")
        .in("user_id", userIds);

      const nameMap = new Map(profiles?.map(p => [p.user_id, p.name]) || []);

      const mapped: ChatMessage[] = data.map(m => ({
        id: m.id,
        from: nameMap.get(m.sender_id) || "Unbekannt",
        to: nameMap.get(m.receiver_id) || "Unbekannt",
        text: m.text,
        timestamp: m.created_at,
        read: m.read,
        sender_id: m.sender_id,
        receiver_id: m.receiver_id,
      }));
      setMessages(mapped);
    }
  }, []);

  // Load messages on mount and subscribe to realtime updates
  useEffect(() => {
    loadMessages();

    const channel = supabase
      .channel("messages-changes")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        loadMessages();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, () => {
        loadMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadMessages]);

  const addMessage = async (msg: Omit<ChatMessage, "id">) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // Fallback to local state if not authenticated
      setMessages(prev => [...prev, { ...msg, id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}` }]);
      return;
    }

    // Find receiver's user_id by name
    const { data: receiverProfile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("name", msg.to)
      .single();

    if (!receiverProfile) {
      console.error("Receiver not found:", msg.to);
      // Still add locally as fallback
      setMessages(prev => [...prev, { ...msg, id: `msg-${Date.now()}` }]);
      return;
    }

    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: receiverProfile.user_id,
      text: msg.text,
      read: false,
    });

    if (error) {
      console.error("Error sending message:", error);
      // Add locally as fallback
      setMessages(prev => [...prev, { ...msg, id: `msg-${Date.now()}` }]);
    }
    // Realtime subscription will update the messages
  };

  const markAsRead = async (from: string, to: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Find sender by name
    const { data: senderProfile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("name", from)
      .single();

    if (senderProfile) {
      await supabase
        .from("messages")
        .update({ read: true })
        .eq("sender_id", senderProfile.user_id)
        .eq("receiver_id", user.id)
        .eq("read", false);
    }

    // Update local state too
    setMessages(prev =>
      prev.map(m => (m.from === from && m.to === to && !m.read ? { ...m, read: true } : m))
    );
  };

  return (
    <MessagesContext.Provider value={{ messages, addMessage, markAsRead, loadMessages }}>
      {children}
    </MessagesContext.Provider>
  );
};

export const useMessages = () => {
  const ctx = useContext(MessagesContext);
  if (!ctx) throw new Error("useMessages must be used within MessagesProvider");
  return ctx;
};
