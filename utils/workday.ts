import { WorkSession } from "@/types/domain";

export const WORKDAY_START_HOUR = 6;
export const WORKDAY_END_HOUR = 19;
export const WORKDAY_END_MINUTE = 0;
export const BACKGROUND_PAUSE_MS = 20 * 60 * 1000;

export function getWorkdayWindow(now = new Date()) {
  const start = new Date(now);
  start.setHours(WORKDAY_START_HOUR, 0, 0, 0);

  const end = new Date(now);
  end.setHours(WORKDAY_END_HOUR, WORKDAY_END_MINUTE, 0, 0);

  return { start, end };
}

export function isWithinWorkday(now = new Date()) {
  const { start, end } = getWorkdayWindow(now);
  return now >= start && now < end;
}

export function getWorkdayMessage(now = new Date()) {
  const { start, end } = getWorkdayWindow(now);

  if (now < start) return "Clock-in opens at 6:00 AM. Rest now.";
  if (now >= end) return "Workday is closed. Rest now.";
  return "You can clock in and start selling.";
}

export function getElapsedWorkMs(session: WorkSession | null, now = new Date()) {
  if (!session || session.status === "clocked_out" || session.status === "auto_clocked_out") return 0;

  const effectiveEnd = session.status === "paused" && session.pausedAt ? new Date(session.pausedAt) : now;
  return Math.max(0, effectiveEnd.getTime() - new Date(session.clockedInAt).getTime() - session.totalPausedMs);
}

export function formatDuration(ms: number) {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) return `${minutes} min`;
  return `${hours} hr ${minutes} min`;
}
