import { router } from "expo-router";
import { createContext, ReactNode, useEffect, useMemo, useState } from "react";
import React from "react";

import { getStoredSalesUser, signInSalesUser, signOutSalesUser } from "@/services/auth-session";
import { SalesUser } from "@/types/domain";

type AuthContextValue = {
  user: SalesUser | null;
  isLoading: boolean;
  signIn: (username: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SalesUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getStoredSalesUser()
      .then(setUser)
      .finally(() => setIsLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      signIn: async (username, code) => {
        const nextUser = await signInSalesUser(username, code);
        setUser(nextUser);
        router.replace("/");
      },
      signOut: async () => {
        await signOutSalesUser();
        setUser(null);
        router.replace("/sign-in");
      }
    }),
    [isLoading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = React.use(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
