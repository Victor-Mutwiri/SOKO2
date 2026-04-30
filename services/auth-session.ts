import * as SecureStore from "expo-secure-store";

import { SalesUser } from "@/types/domain";

import { isSupabaseConfigured, supabase } from "./supabase";

const SESSION_KEY = "sbc_sales_user";

type UserRow = {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  position: SalesUser["position"];
  status: SalesUser["status"];
  caneditprices: boolean | null;
  auth_code: string | null;
};

export async function signInSalesUser(username: string, code: string) {
  if (!isSupabaseConfigured) {
    const mockUser: SalesUser = {
      id: "mock-sales-rep",
      firstName: "Demo",
      lastName: "Rep",
      email: "demo@sbc.co.ke",
      phone: "254700000000",
      position: "Sales Rep",
      status: "Active",
      canEditPrices: false
    };
    await saveSalesUser(mockUser);
    return mockUser;
  }

  const identifier = username.trim();
  const normalizedPhone = normalizePhone(identifier);
  const filters = [
    `email.eq.${identifier.toLowerCase()}`,
    `phone.eq.${identifier}`,
    `phone.eq.${normalizedPhone}`,
    `phone.eq.${stripLeadingPlus(normalizedPhone)}`
  ];

  const { data, error } = await supabase
    .from("users")
    .select("id,firstname,lastname,email,phone,position,status,caneditprices,auth_code")
    .or(filters.join(","))
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("No sales user was found for that phone number or email.");

  const user = data as UserRow;

  if (user.status === "Suspended") {
    throw new Error("This account is suspended. Please contact your team lead or administrator.");
  }

  if (user.position !== "Sales Rep") {
    throw new Error("Only Sales Rep accounts can use the mobile sales app.");
  }

  if ((user.auth_code ?? "").trim() !== code.trim()) {
    throw new Error("The login code is incorrect.");
  }

  const salesUser = mapSalesUser(user);
  await saveSalesUser(salesUser);

  await supabase.from("users").update({ lastaccess: new Date().toISOString() }).eq("id", user.id);

  return salesUser;
}

export async function getStoredSalesUser() {
  const value = await SecureStore.getItemAsync(SESSION_KEY);
  if (!value) return null;

  try {
    return JSON.parse(value) as SalesUser;
  } catch {
    await SecureStore.deleteItemAsync(SESSION_KEY);
    return null;
  }
}

export async function saveSalesUser(user: SalesUser) {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(user));
}

export async function signOutSalesUser() {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}

function mapSalesUser(row: UserRow): SalesUser {
  return {
    id: row.id,
    firstName: row.firstname,
    lastName: row.lastname,
    email: row.email,
    phone: row.phone,
    position: row.position,
    status: row.status,
    canEditPrices: Boolean(row.caneditprices)
  };
}

function normalizePhone(value: string) {
  return value.replace(/[()\s-]/g, "");
}

function stripLeadingPlus(value: string) {
  return value.startsWith("+") ? value.slice(1) : value;
}
