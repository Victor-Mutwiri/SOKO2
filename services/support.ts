import { getStoredSalesUser } from "./auth-session";
import { isSupabaseConfigured, supabase } from "./supabase";

export type SupportPriority = "Urgent" | "Important" | "Suggestion" | "Feedback";

export type SupportReason = "Login issue" | "Clock-in issue" | "Shop location issue" | "Order issue" | "Product or stock issue" | "Other";

export async function submitSupportRequest(input: {
  reason: SupportReason;
  priority: SupportPriority;
  message: string;
}) {
  if (!isSupabaseConfigured) return { id: `mock-support-${Date.now()}` };

  const user = await getStoredSalesUser();
  const { data, error } = await supabase
    .from("support_requests")
    .insert({
      userid: user?.id ?? null,
      reason: input.reason,
      priority: input.priority,
      message: input.message,
      status: "Open"
    })
    .select("id")
    .single();

  if (isMissingTableError(error)) {
    throw new Error("Support requests are not enabled yet. Please call or WhatsApp support.");
  }
  if (error) throw error;

  return data;
}

function isMissingTableError(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  return error.code === "PGRST205" || error.message?.includes("Could not find the table");
}
