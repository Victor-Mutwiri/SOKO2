import { createContext, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import React from "react";
import { AppState } from "react-native";

import {
  endWorkSession,
  getStoredWorkSession,
  pauseWorkSession,
  resumeWorkSession,
  saveWorkSession,
  startWorkSession
} from "@/services/work-session";
import { WorkSession } from "@/types/domain";
import { BACKGROUND_PAUSE_MS, getElapsedWorkMs, isWithinWorkday } from "@/utils/workday";

import { useAuth } from "./auth-provider";

type WorkSessionContextValue = {
  session: WorkSession | null;
  isLoading: boolean;
  elapsedMs: number;
  isActive: boolean;
  canClockIn: boolean;
  wasSessionRestored: boolean;
  refreshSession: () => Promise<void>;
  clockIn: () => Promise<void>;
  clockOut: () => Promise<void>;
  resume: () => Promise<void>;
  pause: (reason: string) => Promise<void>;
};

const WorkSessionContext = createContext<WorkSessionContextValue | null>(null);

export function WorkSessionProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [session, setSession] = useState<WorkSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [wasSessionRestored, setWasSessionRestored] = useState(false);
  const backgroundedAt = useRef<number | null>(null);

  const restoreSession = useCallback(async () => {
    if (authLoading) return;

    setIsLoading(true);
    const storedSession = await getStoredWorkSession();

    if (!user) {
      await saveWorkSession(null);
      setSession(null);
      setWasSessionRestored(false);
      setIsLoading(false);
      return;
    }

    if (storedSession?.userId !== user.id) {
      await saveWorkSession(null);
      setSession(null);
      setWasSessionRestored(false);
      setIsLoading(false);
      return;
    }

    if (storedSession.status === "active" && !isWithinWorkday()) {
      const ended = await endWorkSession(storedSession, "auto_clocked_out", "outside_work_hours");
      setSession(ended);
      setWasSessionRestored(false);
      setIsLoading(false);
      return;
    }

    if (storedSession && storedSession.status === "active") {
      setWasSessionRestored(true);
    } else {
      setWasSessionRestored(false);
    }

    setSession(storedSession);
    setIsLoading(false);
  }, [authLoading, user]);

  useEffect(() => {
    if (authLoading) return;

    let mounted = true;

    (async () => {
      const storedSession = await getStoredWorkSession();
      if (!mounted) return;

      if (!user) {
        await saveWorkSession(null);
        if (!mounted) return;
        setSession(null);
        setWasSessionRestored(false);
        setIsLoading(false);
        return;
      }

      if (storedSession?.userId !== user.id) {
        await saveWorkSession(null);
        if (!mounted) return;
        setSession(null);
        setWasSessionRestored(false);
        setIsLoading(false);
        return;
      }

      if (storedSession.status === "active" && !isWithinWorkday()) {
        const ended = await endWorkSession(storedSession, "auto_clocked_out", "outside_work_hours");
        if (!mounted) return;
        setSession(ended);
        setWasSessionRestored(false);
        setIsLoading(false);
        return;
      }

      if (storedSession && storedSession.status === "active") {
        setWasSessionRestored(true);
      }
      if (!mounted) return;
      setSession(storedSession);
      setIsLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [authLoading, user]);

  useEffect(() => {
    const interval = setInterval(async () => {
      setElapsedMs(getElapsedWorkMs(session));

      if (session?.status === "active" && !isWithinWorkday()) {
        const ended = await endWorkSession(session, "auto_clocked_out", "outside_work_hours");
        setSession(ended);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", async (state) => {
      if (state === "background" || state === "inactive") {
        backgroundedAt.current = Date.now();
        return;
      }

      if (state !== "active" || !session || session.status !== "active" || !backgroundedAt.current) return;

      const awayMs = Date.now() - backgroundedAt.current;
      backgroundedAt.current = null;

      if (awayMs >= BACKGROUND_PAUSE_MS) {
        const paused = await pauseWorkSession(session, "app_inactive");
        setSession(paused);
      }
    });

    return () => subscription.remove();
  }, [session]);

  const clockIn = useCallback(async () => {
    if (!user) throw new Error("Sign in before clocking in.");

    const nextSession = await startWorkSession(user.id);
    setWasSessionRestored(false);
    setSession(nextSession);
  }, [user]);

  const clockOut = useCallback(async () => {
    if (!session) return;

    const ended = await endWorkSession(session, "clocked_out", "manual_clock_out");
    setWasSessionRestored(false);
    setSession(ended);
  }, [session]);

  const resume = useCallback(async () => {
    if (!session) return;

    const nextSession = await resumeWorkSession(session);
    setWasSessionRestored(false);
    setSession(nextSession);
  }, [session]);

  const pause = useCallback(
    async (reason: string) => {
      if (!session) return;

      const nextSession = await pauseWorkSession(session, reason);
      setWasSessionRestored(false);
      setSession(nextSession);
    },
    [session]
  );

  const refreshSession = useCallback(async () => {
    await restoreSession();
  }, [restoreSession]);

  const value = useMemo<WorkSessionContextValue>(
    () => ({
      session,
      isLoading,
      elapsedMs,
      isActive: session?.status === "active",
      canClockIn: Boolean(user && isWithinWorkday() && (!session || session.status === "clocked_out" || session.status === "auto_clocked_out")),
      wasSessionRestored,
      refreshSession,
      clockIn,
      clockOut,
      resume,
      pause
    }),
    [clockIn, clockOut, elapsedMs, isLoading, pause, refreshSession, resume, session, user, wasSessionRestored]
  );

  return <WorkSessionContext.Provider value={value}>{children}</WorkSessionContext.Provider>;
}

export function useWorkSession() {
  const value = React.useContext(WorkSessionContext);
  if (!value) throw new Error("useWorkSession must be used inside WorkSessionProvider");
  return value;
}
