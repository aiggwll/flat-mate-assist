import { useEffect, type ReactNode } from "react";

// Demo mode has been removed for production. This module keeps the
// `useDemo()` / `DemoProvider` API intact so existing call sites compile,
// but it always reports `isDemo: false` and performs no demo behaviour.
// Any legacy demo data left in localStorage is cleared on mount.

interface DemoContextType {
  isDemo: false;
  demoRole: null;
  demoName: "";
  formal: false;
  onboardingDone: true;
  enterDemo: (role?: "owner" | "tenant") => void;
  setDemoOnboarding: (name?: string, isFormal?: boolean) => void;
  resetDemo: () => void;
  greet: () => string;
  address: (sieText: string, duText: string) => string;
}

const noop = () => {};

const stub: DemoContextType = {
  isDemo: false,
  demoRole: null,
  demoName: "",
  formal: false,
  onboardingDone: true,
  enterDemo: noop,
  setDemoOnboarding: noop,
  resetDemo: noop,
  greet: () => "",
  address: (sieText: string) => sieText,
};

const clearLegacyDemoStorage = () => {
  try {
    [
      "dwello_demo",
      "dwello_demo_role",
      "dwello_demo_name",
      "dwello_demo_formal",
      "dwello_demo_onboarded",
      "dwello_demo_properties",
    ].forEach(k => localStorage.removeItem(k));
  } catch {
    // ignore
  }
};

export const DemoProvider = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    clearLegacyDemoStorage();
  }, []);
  return <>{children}</>;
};

export const useDemo = (): DemoContextType => stub;
