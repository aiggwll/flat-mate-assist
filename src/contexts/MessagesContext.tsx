import { createContext, useContext, useState, type ReactNode } from "react";

export interface ChatMessage {
  id: string;
  from: string;
  to: string;
  text: string;
  timestamp: string;
  read: boolean;
}

interface MessagesContextType {
  messages: ChatMessage[];
  addMessage: (msg: Omit<ChatMessage, "id">) => void;
  markAsRead: (from: string, to: string) => void;
}

const MessagesContext = createContext<MessagesContextType | null>(null);

export const MessagesProvider = ({ children }: { children: ReactNode }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const addMessage = (msg: Omit<ChatMessage, "id">) => {
    setMessages((prev) => [...prev, { ...msg, id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}` }]);
  };

  const markAsRead = (from: string, to: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.from === from && m.to === to && !m.read ? { ...m, read: true } : m))
    );
  };

  return (
    <MessagesContext.Provider value={{ messages, addMessage, markAsRead }}>
      {children}
    </MessagesContext.Provider>
  );
};

export const useMessages = () => {
  const ctx = useContext(MessagesContext);
  if (!ctx) throw new Error("useMessages must be used within MessagesProvider");
  return ctx;
};
