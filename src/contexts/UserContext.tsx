import { createContext, useContext, useState, type ReactNode } from "react";
import type { Property } from "@/lib/dummy-data";

interface UserProperty {
  id: string;
  address: string;
  city: string;
  zipCode: string;
  yearBuilt: number;
  units: number;
}

interface UserContextType {
  userName: string;
  setUserName: (name: string) => void;
  userProperties: UserProperty[];
  setUserProperties: (props: UserProperty[]) => void;
  isNewUser: boolean;
  setIsNewUser: (v: boolean) => void;
}

const UserContext = createContext<UserContextType | null>(null);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userName, setUserName] = useState("");
  const [userProperties, setUserProperties] = useState<UserProperty[]>([]);
  const [isNewUser, setIsNewUser] = useState(false);

  return (
    <UserContext.Provider value={{ userName, setUserName, userProperties, setUserProperties, isNewUser, setIsNewUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
};

export type { UserProperty };
