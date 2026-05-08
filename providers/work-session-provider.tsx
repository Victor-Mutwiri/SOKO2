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
  clockIn: () => Promise<void>;
  clockOut: () => Promise<void>;
  resume: () => Promise<void>;
  pause: (reason: string) => Promise<void>;
};

const WorkSessionContext = createContext<WorkSessionContextValue | null>(null);

export function WorkSessionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [session, setSession] = useState<WorkSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [elapsedMs, setElapsedMs] = useState(0);
  const backgroundedAt = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;

    getStoredWorkSession()
      .then(async (storedSession) => {
        if (!mounted) return;

        if (!user || storedSession?.userId !== user.id) {
          await saveWorkSession(null);
          setSession(null);
          return;
        }

        if (storedSession.status === "active" && !isWithinWorkday()) {
          const ended = await endWorkSession(storedSession, "auto_clocked_out", "outside_work_hours");
          setSession(ended);
          return;
        }

        setSession(storedSession);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [user]);

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
    setSession(nextSession);
  }, [user]);

  const clockOut = useCallback(async () => {
    if (!session) return;

    const ended = await endWorkSession(session, "clocked_out", "manual_clock_out");
    setSession(ended);
  }, [session]);

  const resume = useCallback(async () => {
    if (!session) return;

    const nextSession = await resumeWorkSession(session);
    setSession(nextSession);
  }, [session]);

  const pause = useCallback(
    async (reason: string) => {
      if (!session) return;

      const nextSession = await pauseWorkSession(session, reason);
      setSession(nextSession);
    },
    [session]
  );

  const value = useMemo<WorkSessionContextValue>(
    () => ({
      session,
      isLoading,
      elapsedMs,
      isActive: session?.status === "active",
      canClockIn: Boolean(user && isWithinWorkday() && (!session || session.status === "clocked_out" || session.status === "auto_clocked_out")),
      clockIn,
      clockOut,
      resume,
      pause
    }),
    [clockIn, clockOut, elapsedMs, isLoading, pause, resume, session, user]
  );

  return <WorkSessionContext.Provider value={value}>{children}</WorkSessionContext.Provider>;
}

export function useWorkSession() {
  const value = React.use(WorkSessionContext);
  if (!value) throw new Error("useWorkSession must be used inside WorkSessionProvider");
  return value;
}
