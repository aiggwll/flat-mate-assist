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
  salutation: "du" | "sie";
  setSalutation: (s: "du" | "sie") => void;
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
  const [userProperties, setUserPropertiesState] = useState<UserProperty[]>([]);
  const setUserProperties = (props: UserProperty[]) => {
    setUserPropertiesState(props);
  };
  const [isNewUser, setIsNewUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to load profile & properties (non-blocking, fire-and-forget)
  const loadUserData = (currentUser: User) => {
    // Fetch profile (async IIFE to avoid blocking)
    (async () => {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, role")
          .eq("user_id", currentUser.id)
          .single();
        if (profile) {
          setUserName(profile.name || "");
          setUserRole(profile.role as "owner" | "tenant");
        }
      } catch (e) {
        console.error("Error loading profile:", e);
      }
    })();

    // Fetch properties
    (async () => {
      try {
        const { data: props } = await supabase
          .from("properties")
          .select("*")
          .eq("user_id", currentUser.id);
        if (props && props.length > 0) {
          setUserPropertiesState(props.map(p => ({
            id: p.id,
            address: p.address,
            city: p.city,
            zipCode: p.zip_code,
            yearBuilt: p.year_built ?? 0,
            units: p.units ?? 1,
          })));
        }
      } catch (e) {
        console.error("Error loading properties:", e);
      }
    })();

    // Sync pending properties from localStorage (fallback from registration)
    const pending = localStorage.getItem("pendingProperties");
    if (pending) {
      (async () => {
        try {
          const pendingRows = JSON.parse(pending) as Array<{ address: string; city: string; zip_code: string; year_built: number; units: number }>;
          const insertRows = pendingRows.map(r => ({ ...r, user_id: currentUser.id }));
          const { data: synced } = await supabase.from("properties").insert(insertRows).select();
          if (synced) {
            localStorage.removeItem("pendingProperties");
            setUserPropertiesState(prev => [
              ...prev,
              ...synced.map(p => ({
                id: p.id,
                address: p.address,
                city: p.city,
                zipCode: p.zip_code,
                yearBuilt: p.year_built ?? 0,
                units: p.units ?? 1,
              })),
            ]);
          }
        } catch (e) {
          console.error("Error syncing pending properties:", e);
        }
      })();
    }
  };

  useEffect(() => {
    // If user chose not to stay logged in, check sessionStorage flag
    const rememberMe = localStorage.getItem("rememberMe");
    if (rememberMe === "false") {
      if (!sessionStorage.getItem("activeSession")) {
        supabase.auth.signOut().then(() => {
          localStorage.removeItem("rememberMe");
          setIsLoading(false);
        });
        return;
      }
    }

    // Listen for auth changes — NEVER await inside this callback
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        sessionStorage.setItem("activeSession", "true");
        // Fire-and-forget: load data without blocking the auth event queue
        loadUserData(currentUser);
      } else {
        setUserName("");
        setUserRole(null);
        setUserProperties([]);
      }
      setIsLoading(false);
    });

    // Check existing session
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
