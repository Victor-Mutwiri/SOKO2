import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from "react";
import { SalesUser } from "@/types/domain";

type AppSetupContextValue = {
  isSetupComplete: boolean;
  markSetupComplete: () => void;
};

const AppSetupContext = createContext<AppSetupContextValue | null>(null);

export function AppSetupProvider({ user, children }: { user: SalesUser | null; children: ReactNode }) {
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  useEffect(() => {
    if (!user) setIsSetupComplete(false);
  }, [user]);

  const value = useMemo(
    () => ({
      isSetupComplete,
      markSetupComplete: () => setIsSetupComplete(true)
    }),
    [isSetupComplete]
  );

  return <AppSetupContext.Provider value={value}>{children}</AppSetupContext.Provider>;
}

export function useAppSetup() {
  const value = useContext(AppSetupContext);
  if (!value) throw new Error("useAppSetup must be used inside AppSetupProvider");
  return value;
}
