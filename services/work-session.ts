import * as SecureStore from "expo-secure-store";

import { WorkSession, WorkSessionStatus } from "@/types/domain";
import { isWithinWorkday } from "@/utils/workday";

import { isSupabaseConfigured, supabase } from "./supabase";

const WORK_SESSION_KEY = "sbc_work_session";

export async function getStoredWorkSession() {
  const value = await SecureStore.getItemAsync(WORK_SESSION_KEY);
  if (!value) return null;

  try {
    return JSON.parse(value) as WorkSession;
  } catch {
    await SecureStore.deleteItemAsync(WORK_SESSION_KEY);
    return null;
  }
}

export async function saveWorkSession(session: WorkSession | null) {
  if (!session) {
    await SecureStore.deleteItemAsync(WORK_SESSION_KEY);
    return;
  }

  await SecureStore.setItemAsync(WORK_SESSION_KEY, JSON.stringify(session));
}

export async function startWorkSession(userId: string) {
  const now = new Date();
  if (!isWithinWorkday(now)) {
    throw new Error("Clock-in is only allowed between 6:00 AM and 6:30 PM.");
  }

  const localSession: WorkSession = {
    id: `local-${userId}-${now.getTime()}`,
    userId,
    status: "active",
    clockedInAt: now.toISOString(),
    totalPausedMs: 0
  };

  if (!isSupabaseConfigured) {
    await saveWorkSession(localSession);
    return localSession;
  }

  const { data, error } = await supabase
    .from("sales_attendance_sessions")
    .insert({
      userid: userId,
      status: "active",
      clockedinat: localSession.clockedInAt,
      totalpausedms: 0
    })
    .select("id")
    .single();

  const session = {
    ...localSession,
    id: error ? localSession.id : data.id
  };

  await saveWorkSession(session);
  await logWorkSessionEvent(session.id, userId, "clock_in");

  return session;
}

export async function pauseWorkSession(session: WorkSession, reason: string) {
  if (session.status !== "active") return session;

  const nextSession: WorkSession = {
    ...session,
    status: "paused",
    pausedAt: new Date().toISOString(),
    pauseReason: reason
  };

  await persistWorkSession(nextSession, "pause", reason);
  return nextSession;
}

export async function resumeWorkSession(session: WorkSession) {
  if (session.status !== "paused") return session;

  const now = new Date();
  if (!isWithinWorkday(now)) return endWorkSession(session, "auto_clocked_out", "outside_work_hours");

  const pausedAt = session.pausedAt ? new Date(session.pausedAt).getTime() : now.getTime();
  const nextSession: WorkSession = {
    ...session,
    status: "active",
    pausedAt: null,
    pauseReason: null,
    totalPausedMs: session.totalPausedMs + Math.max(0, now.getTime() - pausedAt)
  };

  await persistWorkSession(nextSession, "resume");
  return nextSession;
}

export async function endWorkSession(session: WorkSession, status: Extract<WorkSessionStatus, "clocked_out" | "auto_clocked_out">, reason?: string) {
  const nextSession: WorkSession = {
    ...session,
    status,
    clockedOutAt: new Date().toISOString(),
    pauseReason: reason ?? null
  };

  await persistWorkSession(nextSession, status === "auto_clocked_out" ? "auto_clock_out" : "clock_out", reason);
  return nextSession;
}

async function persistWorkSession(session: WorkSession, eventType: string, reason?: string) {
  await saveWorkSession(session);

  if (isSupabaseConfigured && !session.id.startsWith("local-")) {
    await supabase
      .from("sales_attendance_sessions")
      .update({
        status: session.status,
        clockedoutat: session.clockedOutAt ?? null,
        pausedat: session.pausedAt ?? null,
        totalpausedms: session.totalPausedMs,
        pausereason: session.pauseReason ?? reason ?? null
      })
      .eq("id", session.id);
  }

  await logWorkSessionEvent(session.id, session.userId, eventType, reason);
}

async function logWorkSessionEvent(sessionId: string, userId: string, eventType: string, reason?: string) {
  if (!isSupabaseConfigured || sessionId.startsWith("local-")) return;

  await supabase.from("sales_attendance_events").insert({
    sessionid: sessionId,
    userid: userId,
    eventtype: eventType,
    reason: reason ?? null
  });
}
