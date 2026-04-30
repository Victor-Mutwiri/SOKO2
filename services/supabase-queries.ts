import { Activity, DashboardSummary, Order, Product, Shop } from "@/types/domain";

import { mockActivities, mockOrders, mockProducts, mockShops, mockSummary } from "./mock-data";
import { getStoredSalesUser } from "./auth-session";
import { isSupabaseConfigured, supabase } from "./supabase";

type ShopRow = {
  id: number;
  name: string;
  ownerName: string | null;
  ownerMobile: string | null;
  region?: { name?: string | null } | Array<{ name?: string | null }> | null;
  locations?: Array<{ latitude: string | number; longitude: string | number; name: string | null }> | null;
};

type ProductRow = {
  id: string;
  name: string;
  unitofmeasurement: string | null;
  price: string | number;
  retailprice: string | number;
  stock: number | null;
  category?: { name?: string | null } | Array<{ name?: string | null }> | null;
};

type OrderRow = {
  id: string;
  total_amount: string | number;
  status: Order["status"];
  createdat: string;
  shop?: { name?: string | null } | Array<{ name?: string | null }> | null;
};

export async function getShops(): Promise<Shop[]> {
  if (!isSupabaseConfigured) return mockShops;

  const { data, error } = await supabase
    .from("shops")
    .select("id,name,ownerName,ownerMobile,region:regions(name),locations(latitude,longitude,name)")
    .order("name", { ascending: true });

  if (error) throw error;

  return ((data ?? []) as ShopRow[])
    .map((row) => {
      const firstLocation = row.locations?.[0];
      const region = singleRelation(row.region)?.name ?? "Unassigned";

      return {
        id: String(row.id),
        name: row.name,
        ownerName: row.ownerName,
        phone: row.ownerMobile,
        region,
        latitude: Number(firstLocation?.latitude ?? 0),
        longitude: Number(firstLocation?.longitude ?? 0),
        status: firstLocation ? "active" : "pending",
        visitRadiusMeters: null
      } satisfies Shop;
    })
    .filter((shop) => shop.latitude !== 0 && shop.longitude !== 0);
}

export async function getProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured) return mockProducts;

  const { data, error } = await supabase
    .from("products")
    .select("id,name,unitofmeasurement,price,retailprice,stock,category:product_categories(name)")
    .eq("isactive", true)
    .order("name", { ascending: true });

  if (error) throw error;

  return ((data ?? []) as ProductRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    brand: singleRelation(row.category)?.name ?? "Product",
    packSize: row.unitofmeasurement ?? "Unit",
    unitPrice: Number(row.price ?? row.retailprice ?? 0),
    stockCount: row.stock
  }));
}

export async function getRecentOrders(): Promise<Order[]> {
  if (!isSupabaseConfigured) return mockOrders;

  const { data, error } = await supabase
    .from("orders")
    .select("id,total_amount,status,createdat,shop:shops(name)")
    .order("createdat", { ascending: false })
    .limit(20);

  if (isMissingTableError(error)) return [];
  if (error) throw error;

  return ((data ?? []) as OrderRow[]).map((row) => ({
    id: row.id,
    shopName: singleRelation(row.shop)?.name ?? "Shop",
    createdAt: row.createdat,
    totalAmount: Number(row.total_amount),
    status: row.status
  }));
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  if (!isSupabaseConfigured) return mockSummary;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("id,total_amount,status,shopid")
    .gte("createdat", today.toISOString());

  if (isMissingTableError(ordersError)) {
    return {
      salesToday: 0,
      ordersToday: 0,
      shopsVisitedToday: 0,
      pendingOrders: 0
    };
  }
  if (ordersError) throw ordersError;

  const visitedShopIds = new Set((orders ?? []).map((order) => order.shopid).filter(Boolean));

  return {
    salesToday: (orders ?? []).reduce((sum, order) => sum + Number(order.total_amount ?? 0), 0),
    ordersToday: orders?.length ?? 0,
    shopsVisitedToday: visitedShopIds.size,
    pendingOrders: (orders ?? []).filter((order) => order.status === "Pending").length
  };
}

export async function getActivities(): Promise<Activity[]> {
  if (!isSupabaseConfigured) return mockActivities;

  const [orders, payments, shops] = await Promise.all([
    supabase.from("orders").select("id,total_amount,status,createdat,shop:shops(name)").order("createdat", { ascending: false }).limit(25),
    supabase.from("payments").select("id,amount,createdat,order:orders(shop:shops(name))").order("createdat", { ascending: false }).limit(25),
    supabase.from("shops").select("id,name").order("id", { ascending: false }).limit(15)
  ]);

  if (orders.error && !isMissingTableError(orders.error)) throw orders.error;
  if (payments.error && !isMissingTableError(payments.error)) throw payments.error;
  if (shops.error) throw shops.error;

  const orderActivities = ((orders.error ? [] : orders.data ?? []) as OrderRow[]).map((row) => ({
    id: `order-${row.id}`,
    type: "order" as const,
    title: `Order ${row.status}`,
    description: `${singleRelation(row.shop)?.name ?? "Shop"} - KES ${Number(row.total_amount).toLocaleString("en-KE")}`,
    createdAt: row.createdat
  }));

  const paymentActivities = (payments.error ? [] : payments.data ?? []).map((row) => {
    const payment = row as {
      id: string;
      amount: string | number;
      createdat: string;
      order?: { shop?: { name?: string | null } | Array<{ name?: string | null }> | null } | null;
    };
    const order = singleRelation(payment.order);

    return {
      id: `payment-${payment.id}`,
      type: "visit" as const,
      title: "Payment collected",
      description: `${singleRelation(order?.shop)?.name ?? "Shop"} - KES ${Number(payment.amount).toLocaleString("en-KE")}`,
      createdAt: payment.createdat
    };
  });

  const shopActivities = (shops.data ?? []).map((row) => ({
    id: `shop-${row.id}`,
    type: "shop_onboarding" as const,
    title: "Shop available",
    description: row.name,
    createdAt: new Date().toISOString()
  }));

  return [...orderActivities, ...paymentActivities, ...shopActivities]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 50);
}

type CreateOrderInput = {
  shopId: string;
  notes?: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
};

export async function createOrder(input: CreateOrderInput) {
  if (!isSupabaseConfigured) return { id: `mock-${Date.now()}` };

  const totalAmount = input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const salesUser = await getStoredSalesUser();
  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      shopid: Number(input.shopId),
      sold_by_id: salesUser?.id ?? null,
      total_amount: totalAmount,
      paid_amount: 0,
      status: "Pending"
    })
    .select("id")
    .single();

  if (isMissingTableError(error)) {
    throw new Error("The orders table is not available in this Supabase project yet. Create or expose public.orders before submitting mobile orders.");
  }
  if (error) throw error;

  const { error: itemsError } = await supabase.from("order_items").insert(
    input.items.map((item) => ({
      orderid: order.id,
      productid: item.productId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      line_total: item.quantity * item.unitPrice
    }))
  );

  if (itemsError && !isMissingTableError(itemsError)) throw itemsError;

  return order;
}

type CreateShopInput = {
  name: string;
  ownerName?: string;
  phone: string;
  region: string;
  latitude: number;
  longitude: number;
};

export async function createShop(input: CreateShopInput) {
  if (!isSupabaseConfigured) return { id: `mock-shop-${Date.now()}` };

  const regionId = await getOrCreateRegionId(input.region);
  const { data: shop, error: shopError } = await supabase
    .from("shops")
    .insert({
      name: input.name,
      ownerName: input.ownerName || null,
      ownerMobile: input.phone,
      regionId: regionId,
      direction: input.region
    })
    .select("id")
    .single();

  if (shopError) throw shopError;

  const { error: locationError } = await supabase.from("locations").insert({
    shopId: shop.id,
    latitude: input.latitude,
    longitude: input.longitude,
    name: input.name
  });

  if (locationError) throw locationError;

  return shop;
}

async function getOrCreateRegionId(name: string) {
  const trimmedName = name.trim();
  if (!trimmedName) return null;

  const { data: existing, error: selectError } = await supabase
    .from("regions")
    .select("id")
    .ilike("name", trimmedName)
    .limit(1)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing?.id) return existing.id;

  const { data: created, error: insertError } = await supabase
    .from("regions")
    .insert({ name: trimmedName })
    .select("id")
    .single();

  if (insertError) throw insertError;

  return created.id;
}

function singleRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function isMissingTableError(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  return error.code === "PGRST205" || error.message?.includes("Could not find the table");
}
