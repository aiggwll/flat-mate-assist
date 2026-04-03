import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface UserProperty {
  id: string;
  address: string;
  city: string;
  zipCode: string;
  yearBuilt: number;
  units: number;
}

interface UserContextType {
  user: User | null;
  userId: string | null;
  userName: string;
  setUserName: (name: string) => void;
  userRole: "owner" | "tenant" | null;
  setUserRole: (role: "owner" | "tenant" | null) => void;
  userProperties: UserProperty[];
  setUserProperties: (props: UserProperty[]) => void;
  isNewUser: boolean;
  setIsNewUser: (v: boolean) => void;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const UserContext = createContext<UserContextType | null>(null);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState<"owner" | "tenant" | null>(null);
  const [userProperties, setUserPropertiesState] = useState<UserProperty[]>(() => {
    try {
      const stored = localStorage.getItem("willprop_user_properties");
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const setUserProperties = (props: UserProperty[]) => {
    setUserPropertiesState(props);
    localStorage.setItem("willprop_user_properties", JSON.stringify(props));
  };
  const [isNewUser, setIsNewUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listen for auth changes FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        // Fetch profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, role")
          .eq("user_id", currentUser.id)
          .single();

        if (profile) {
          setUserName(profile.name || "");
          setUserRole(profile.role as "owner" | "tenant");
        }
      } else {
        setUserName("");
        setUserRole(null);
        setUserProperties([]);
      }
      setIsLoading(false);
    });

    // Then check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserName("");
    setUserRole(null);
    setUserProperties([]);
  };

  return (
    <UserContext.Provider value={{
      user,
      userId: user?.id ?? null,
      userName,
      setUserName,
      userRole,
      setUserRole,
      userProperties,
      setUserProperties,
      isNewUser,
      setIsNewUser,
      isLoading,
      signOut,
    }}>
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
