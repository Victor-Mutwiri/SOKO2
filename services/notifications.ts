import { SalesNotification } from "@/types/domain";

import { getStoredSalesUser } from "./auth-session";
import { isSupabaseConfigured, supabase } from "./supabase";

type NotificationRow = {
  id: string;
  title: string;
  body: string;
  createdat: string;
  readat: string | null;
};

export async function getNotifications(): Promise<SalesNotification[]> {
  if (!isSupabaseConfigured) return [];

  const user = await getStoredSalesUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("sales_notifications")
    .select("id,title,body,createdat,readat")
    .or(`userid.eq.${user.id},userid.is.null`)
    .order("createdat", { ascending: false })
    .limit(50);

  if (isMissingTableError(error)) return [];
  if (error) throw error;

  return ((data ?? []) as NotificationRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    createdAt: row.createdat,
    readAt: row.readat
  }));
}

export async function getUnreadNotificationCount() {
  const notifications = await getNotifications();
  return notifications.filter((notification) => !notification.readAt).length;
}

export async function markNotificationRead(id: string) {
  if (!isSupabaseConfigured) return;

  await supabase.from("sales_notifications").update({ readat: new Date().toISOString() }).eq("id", id);
}

export async function markAllNotificationsRead() {
  if (!isSupabaseConfigured) return;

  const user = await getStoredSalesUser();
  if (!user) return;

  await supabase
    .from("sales_notifications")
    .update({ readat: new Date().toISOString() })
    .or(`userid.eq.${user.id},userid.is.null`)
    .is("readat", null);
}

function isMissingTableError(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  return error.code === "PGRST205" || error.message?.includes("Could not find the table");
}
