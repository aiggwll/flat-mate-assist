import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react";
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
  gender: string | null;
  lastName: string | null;
  userProperties: UserProperty[];
  setUserProperties: (props: UserProperty[]) => void;
  isNewUser: boolean;
  setIsNewUser: (v: boolean) => void;
  isLoading: boolean;
  setupWizardComplete: boolean;
  signOut: () => Promise<void>;
}

const UserContext = createContext<UserContextType | null>(null);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userName, setUserName] = useState("");
  const [gender, setGender] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<"owner" | "tenant" | null>(null);
  const [salutation, setSalutationState] = useState<"du" | "sie">(
    () => (localStorage.getItem("dwello_salutation") as "du" | "sie") || "sie"
  );
  const [userProperties, setUserPropertiesState] = useState<UserProperty[]>([]);
  const setUserProperties = (props: UserProperty[]) => setUserPropertiesState(props);
  const [isNewUser, setIsNewUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [setupWizardComplete, setSetupWizardComplete] = useState(
    () => localStorage.getItem("dwello_setup_complete") === "true"
  );
  const dataLoadedForUser = useRef<string | null>(null);

  const setSalutation = (s: "du" | "sie") => {
    setSalutationState(s);
    localStorage.setItem("dwello_salutation", s);
  };

  const loadUserData = async (currentUser: User) => {
    // Avoid reloading if we already loaded for this user
    if (dataLoadedForUser.current === currentUser.id) return;
    dataLoadedForUser.current = currentUser.id;

    // Load profile
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, role, salutation, setup_wizard_complete, gender")
        .eq("user_id", currentUser.id)
        .single();
      if (profile) {
        const fullName = profile.name || "";
        setUserName(fullName);
        const nameParts = fullName.trim().split(/\s+/);
        setLastName(nameParts.length > 1 ? nameParts[nameParts.length - 1] : null);
        setGender(profile.gender || null);
        setUserRole(profile.role as "owner" | "tenant");
        const profileSalutation = (profile.salutation as "du" | "sie") || "sie";
        setSalutationState(profileSalutation);
        localStorage.setItem("dwello_salutation", profileSalutation);

        if (profile.setup_wizard_complete) {
          setSetupWizardComplete(true);
          localStorage.setItem("dwello_setup_complete", "true");
        }
      }
    } catch (e) {
      console.error("Error loading profile:", e);
    }

    // Load properties from Supabase (always fresh, never from localStorage)
    try {
      const { data: props } = await supabase
        .from("properties")
        .select("*")
        .eq("user_id", currentUser.id);
      if (props) {
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

    // Sync pending properties from registration
    const pending = localStorage.getItem("pendingProperties");
    if (pending) {
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
    }
  };

  useEffect(() => {
    let mounted = true;

    // 1. Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        sessionStorage.setItem("activeSession", "true");
        loadUserData(currentUser);
      } else {
        dataLoadedForUser.current = null;
        setUserName("");
        setUserRole(null);
        setSalutationState("sie");
        setGender(null);
        setLastName(null);
        setUserProperties([]);
        setSetupWizardComplete(false);
      }
      setIsLoading(false);
    });

    // 2. Check "remember me" preference
    const rememberMe = localStorage.getItem("rememberMe");
    if (rememberMe === "false" && !sessionStorage.getItem("activeSession")) {
      // User chose not to stay logged in and browser was closed
      supabase.auth.signOut().then(() => {
        if (mounted) {
          localStorage.removeItem("rememberMe");
          setIsLoading(false);
        }
      });
    } else {
      // 3. Restore existing session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!mounted) return;
        if (session?.user) {
          setUser(session.user);
          sessionStorage.setItem("activeSession", "true");
          loadUserData(session.user);
          setIsLoading(false);
        } else {
          setIsLoading(false);
        }
      });
    }

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    dataLoadedForUser.current = null;
    await supabase.auth.signOut();
    setUser(null);
    setUserName("");
    setGender(null);
    setLastName(null);
    setUserRole(null);
    setSalutationState("sie");
    setUserProperties([]);
    setSetupWizardComplete(false);
    localStorage.removeItem("rememberMe");
  };

  return (
    <UserContext.Provider value={{
      user,
      userId: user?.id ?? null,
      userName,
      setUserName,
      userRole,
      setUserRole,
      salutation,
      setSalutation,
      gender,
      lastName,
      userProperties,
      setUserProperties,
      isNewUser,
      setIsNewUser,
      isLoading,
      setupWizardComplete,
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
