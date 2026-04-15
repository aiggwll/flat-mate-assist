import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface DemoContextType {
  isDemo: boolean;
  demoRole: "owner" | "tenant" | null;
  demoName: string;
  formal: boolean;
  enterDemo: (role: "owner" | "tenant") => void;
  setDemoOnboarding: (name: string, formal: boolean) => void;
  onboardingDone: boolean;
  resetDemo: () => void;
  greet: () => string;
  address: (sieText: string, duText: string) => string;
}

const DemoContext = createContext<DemoContextType | null>(null);

export const DemoProvider = ({ children }: { children: ReactNode }) => {
  const [isDemo, setIsDemo] = useState(() => localStorage.getItem("dwello_demo") === "true");
  const [demoRole, setDemoRole] = useState<"owner" | "tenant" | null>(
    () => (localStorage.getItem("dwello_demo_role") as "owner" | "tenant") || null
  );
  const [demoName, setDemoName] = useState(() => localStorage.getItem("dwello_demo_name") || "");
  const [formal, setFormal] = useState(() => localStorage.getItem("dwello_demo_formal") !== "false");
  const [onboardingDone, setOnboardingDone] = useState(
    () => localStorage.getItem("dwello_demo_onboarded") === "true"
  );

  const enterDemo = (role: "owner" | "tenant") => {
    setIsDemo(true);
    setDemoRole(role);
    localStorage.setItem("dwello_demo", "true");
    localStorage.setItem("dwello_demo_role", role);
  };

  const setDemoOnboarding = (name: string, isFormal: boolean) => {
    setDemoName(name);
    setFormal(isFormal);
    setOnboardingDone(true);
    localStorage.setItem("dwello_demo_name", name);
    localStorage.setItem("dwello_demo_formal", isFormal ? "true" : "false");
    localStorage.setItem("dwello_demo_onboarded", "true");
  };

  const resetDemo = () => {
    localStorage.removeItem("dwello_demo");
    localStorage.removeItem("dwello_demo_role");
    localStorage.removeItem("dwello_demo_name");
    localStorage.removeItem("dwello_demo_formal");
    localStorage.removeItem("dwello_demo_onboarded");
    setIsDemo(false);
    setDemoRole(null);
    setDemoName("");
    setFormal(true);
    setOnboardingDone(false);
  };

  const greet = () => {
    const name = demoName || "Nutzer";
    return formal ? `Guten Tag, ${name}` : `Hallo ${name}`;
  };

  const address = (sieText: string, duText: string) => (formal ? sieText : duText);

  return (
    <DemoContext.Provider value={{
      isDemo, demoRole, demoName, formal, enterDemo,
      setDemoOnboarding, onboardingDone, resetDemo, greet, address,
    }}>
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = () => {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used within DemoProvider");
  return ctx;
};
