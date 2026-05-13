import { Activity, DashboardSummary, Order, OrderDetail, Product, Region, Shop } from "@/types/domain";

import { mockActivities, mockOrders, mockProducts, mockShops, mockSummary } from "./mock-data";
import { getStoredSalesUser } from "./auth-session";
import { isSupabaseConfigured, supabase } from "./supabase";
import { getStoredWorkSession } from "./work-session";
import { getStoredLocation } from "./location-session";
import { isWithinWorkday } from "@/utils/workday";
import { distanceMeters } from "@/utils/geo";

type ShopRow = {
  id: number;
  name: string;
  ownerName: string | null;
  ownerMobile: string | null;
  regionId: number | null;
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

type TargetRow = {
  daily_sales_target: string | number | null;
  weekly_sales_target: string | number | null;
  daily_visit_target: number | null;
  weekly_visit_target: number | null;
};

function sortShopsByDistance(shops: Shop[], referenceLocation: { latitude: number; longitude: number } | null) {
  if (!referenceLocation) {
    return shops;
  }

  return [...shops].sort((left, right) => {
    const leftDistance = distanceMeters(referenceLocation, left);
    const rightDistance = distanceMeters(referenceLocation, right);
    return leftDistance - rightDistance;
  });
}

export async function getShops(): Promise<Shop[]> {
  const location = await getStoredLocation();

  if (!isSupabaseConfigured) return sortShopsByDistance(mockShops, location);

  const { data, error } = await supabase
    .from("shops")
    .select("id,name,ownerName,ownerMobile,regionId,region:regions(name),locations(latitude,longitude,name)");

  if (error) throw error;

  const shops = ((data ?? []) as ShopRow[])
    .map((row) => {
      const firstLocation = row.locations?.[0];
      const region = singleRelation(row.region)?.name ?? "Unassigned";

      return {
        id: String(row.id),
        name: row.name,
        ownerName: row.ownerName,
        phone: row.ownerMobile,
        regionId: row.regionId,
        region,
        latitude: Number(firstLocation?.latitude ?? 0),
        longitude: Number(firstLocation?.longitude ?? 0),
        status: firstLocation ? "active" : "pending",
        visitRadiusMeters: null
      } satisfies Shop;
    })
    .filter((shop) => shop.latitude !== 0 && shop.longitude !== 0);

  return sortShopsByDistance(shops, location);
}

export async function searchShops(query: string): Promise<Shop[]> {
  const location = await getStoredLocation();

  if (!isSupabaseConfigured) {
    return sortShopsByDistance(
      mockShops.filter((shop) =>
        [shop.name, shop.region, shop.ownerName ?? ""].some((field) =>
          field.toLowerCase().includes(query.toLowerCase())
        )
      ),
      location
    );
  }

  if (!query.trim()) return getShops();

  const searchTerm = query.trim().toLowerCase();

  const { data, error } = await supabase
    .from("shops")
    .select("id,name,ownerName,ownerMobile,regionId,region:regions(name),locations(latitude,longitude,name)")
    .or(`name.ilike.%${searchTerm}%,ownerName.ilike.%${searchTerm}%`);

  if (error) throw error;

  const shops = ((data ?? []) as ShopRow[])
    .map((row) => {
      const firstLocation = row.locations?.[0];
      const region = singleRelation(row.region)?.name ?? "Unassigned";

      return {
        id: String(row.id),
        name: row.name,
        ownerName: row.ownerName,
        phone: row.ownerMobile,
        regionId: row.regionId,
        region,
        latitude: Number(firstLocation?.latitude ?? 0),
        longitude: Number(firstLocation?.longitude ?? 0),
        status: firstLocation ? "active" : "pending",
        visitRadiusMeters: null
      } satisfies Shop;
    })
    .filter((shop) => shop.latitude !== 0 && shop.longitude !== 0);

  return sortShopsByDistance(shops, location);
}

export async function getRegions(): Promise<Region[]> {
  if (!isSupabaseConfigured) {
    return [
      { id: 1, name: "MOUNTAIN" },
      { id: 4, name: "NAIROBI" }
    ];
  }

  const { data, error } = await supabase.from("regions").select("id,name").order("name", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((row) => ({ id: Number(row.id), name: row.name }));
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

export async function getOrderById(orderId: string): Promise<OrderDetail | null> {
  if (!isSupabaseConfigured) {
    const mockOrder = mockOrders.find((order) => String(order.id) === String(orderId));
    if (!mockOrder) return null;

    return {
      ...mockOrder,
      shopId: null,
      paidAmount: 0,
      notes: "Mock order details are not editable.",
      items: []
    };
  }

  const numericId = Number(orderId);
  const queryId = Number.isNaN(numericId) ? orderId : numericId;

  const { data, error } = await supabase
    .from("orders")
    .select(
      "id,total_amount,paid_amount,status,createdat,notes,shop:shops(id,name),order_items(id,quantity,unit_price,line_total,product:products(name))"
    )
    .eq("id", queryId)
    .maybeSingle();

  if (error && !isMissingTableError(error)) throw error;
  if (!data) return null;

  const orderRow = data as {
    id: string | number;
    total_amount: string | number;
    paid_amount: string | number | null;
    status: Order["status"];
    createdat: string;
    notes?: string | null;
    shop?: { id?: string | null | number; name?: string | null } | null;
    order_items?: Array<{
      id: string | number;
      quantity: string | number;
      unit_price: string | number;
      line_total: string | number;
      product?: { name?: string | null } | null;
    }> | null;
  };

  return {
    id: String(orderRow.id),
    shopId: orderRow.shop?.id ? String(orderRow.shop.id) : null,
    shopName: orderRow.shop?.name ?? "Shop",
    createdAt: orderRow.createdat,
    totalAmount: Number(orderRow.total_amount),
    paidAmount: Number(orderRow.paid_amount ?? 0),
    status: orderRow.status,
    notes: orderRow.notes ?? null,
    items: (orderRow.order_items ?? []).map((item) => ({
      id: String(item.id),
      productName: item.product?.name ?? "Product",
      quantity: Number(item.quantity),
      unitPrice: Number(item.unit_price),
      lineTotal: Number(item.line_total)
    }))
  };
}

export async function updateOrderStatus(orderId: string, status: Order["status"]) {
  if (!isSupabaseConfigured) return { id: orderId };

  const numericId = Number(orderId);
  const orderFilter = Number.isNaN(numericId) ? orderId : numericId;

  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderFilter)
    .select("id")
    .single();

  if (isMissingTableError(error)) {
    throw new Error("Order update is not available in this Supabase project yet.");
  }
  if (error) throw error;

  return data;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  if (!isSupabaseConfigured) return mockSummary;

  const salesUser = await getStoredSalesUser();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekStart = getWeekStart(new Date());

  const [ordersResult, visitsResult] = await Promise.all([
    supabase
    .from("orders")
    .select("id,total_amount,status,shopid,createdat")
      .gte("createdat", weekStart.toISOString()),
    supabase
      .from("sales_shop_visits")
      .select("id,shopid,createdat")
      .gte("createdat", weekStart.toISOString())
  ]);
  const { data: orders, error: ordersError } = ordersResult;

  if (isMissingTableError(ordersError)) {
    return {
      salesToday: 0,
      salesThisWeek: 0,
      ordersToday: 0,
      shopsVisitedToday: 0,
      shopsVisitedThisWeek: 0,
      pendingOrders: 0,
      dailySalesTarget: 0,
      weeklySalesTarget: 0,
      dailyVisitTarget: 0,
      weeklyVisitTarget: 0
    };
  }
  if (ordersError) throw ordersError;
  if (visitsResult.error && !isMissingTableError(visitsResult.error)) throw visitsResult.error;

  const weeklyOrders = orders ?? [];
  const todayOrders = weeklyOrders.filter((order) => new Date(order.createdat) >= today);
  const weeklyVisits = visitsResult.error ? [] : visitsResult.data ?? [];
  const todayVisits = weeklyVisits.filter((visit) => new Date(visit.createdat) >= today);
  const visitedToday = new Set([
    ...todayOrders.map((order) => order.shopid),
    ...todayVisits.map((visit) => visit.shopid)
  ].filter(Boolean));
  const visitedThisWeek = new Set([
    ...weeklyOrders.map((order) => order.shopid),
    ...weeklyVisits.map((visit) => visit.shopid)
  ].filter(Boolean));
  const targets = await getSalesTargets(salesUser?.id ?? null);

  return {
    salesToday: todayOrders.reduce((sum, order) => sum + Number(order.total_amount ?? 0), 0),
    salesThisWeek: weeklyOrders.reduce((sum, order) => sum + Number(order.total_amount ?? 0), 0),
    ordersToday: todayOrders.length,
    shopsVisitedToday: visitedToday.size,
    shopsVisitedThisWeek: visitedThisWeek.size,
    pendingOrders: weeklyOrders.filter((order) => order.status === "Pending").length,
    dailySalesTarget: targets.dailySalesTarget,
    weeklySalesTarget: targets.weeklySalesTarget,
    dailyVisitTarget: targets.dailyVisitTarget,
    weeklyVisitTarget: targets.weeklyVisitTarget
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
  paymentMethod: "cash" | "credit";
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
};

export async function createOrder(input: CreateOrderInput) {
  if (!isSupabaseConfigured) return { id: `mock-${Date.now()}` };
  await assertActiveWorkSession();

  const totalAmount = input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const salesUser = await getStoredSalesUser();
  const orderStatus = input.paymentMethod === "cash" ? "Cleared" : "Pending";

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      shopid: Number(input.shopId),
      sold_by_id: salesUser?.id ?? null,
      total_amount: totalAmount,
      paid_amount: input.paymentMethod === "cash" ? totalAmount : 0,
      status: orderStatus
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
  regionId: number;
  latitude: number;
  longitude: number;
};

export async function createShop(input: CreateShopInput) {
  if (!isSupabaseConfigured) return { id: `mock-shop-${Date.now()}` };
  await assertActiveWorkSession();

  const shopId = await getNextNumericId("shops");
  const { data: shop, error: shopError } = await supabase
    .from("shops")
    .insert({
      id: shopId,
      name: input.name,
      ownerName: input.ownerName || null,
      ownerMobile: input.phone,
      regionId: input.regionId
    })
    .select("id")
    .single();

  if (shopError) throw shopError;

  const locationId = await getNextNumericId("locations");
  const { error: locationError } = await supabase.from("locations").insert({
    id: locationId,
    shopId: shop.id,
    latitude: input.latitude,
    longitude: input.longitude,
    name: input.name
  });

  if (locationError) throw locationError;

  return shop;
}

export async function markShopVisit(shopId: string) {
  if (!isSupabaseConfigured) return { id: `mock-visit-${Date.now()}` };
  await assertActiveWorkSession();

  const salesUser = await getStoredSalesUser();
  const { data, error } = await supabase
    .from("sales_shop_visits")
    .insert({
      shopid: Number(shopId),
      userid: salesUser?.id ?? null
    })
    .select("id")
    .single();

  if (isMissingTableError(error)) {
    throw new Error("Shop visit tracking is not enabled yet. Run the latest mobile SQL additions in Supabase.");
  }
  if (error) throw error;

  return data;
}

function singleRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function isMissingTableError(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  return error.code === "PGRST205" || error.message?.includes("Could not find the table");
}

async function assertActiveWorkSession() {
  const session = await getStoredWorkSession();

  if (!session || session.status !== "active" || !isWithinWorkday()) {
    throw new Error("Clock in from the dashboard before submitting sales or shop data.");
  }
}

async function getSalesTargets(userId: string | null) {
  const defaults = {
    dailySalesTarget: 50000,
    weeklySalesTarget: 250000,
    dailyVisitTarget: 40,
    weeklyVisitTarget: 180
  };

  const baseQuery = supabase
    .from("sales_targets")
    .select("daily_sales_target,weekly_sales_target,daily_visit_target,weekly_visit_target,userid,isactive")
    .eq("isactive", true);

  const { data, error } = await (userId
    ? baseQuery.or(`userid.eq.${userId},userid.is.null`)
    : baseQuery.is("userid", null)
  ).order("userid", { ascending: true, nullsFirst: false }).limit(1);

  if (isMissingTableError(error)) return defaults;
  if (error) throw error;

  const target = (data?.[0] ?? null) as TargetRow | null;
  if (!target) return defaults;

  return {
    dailySalesTarget: Number(target.daily_sales_target ?? defaults.dailySalesTarget),
    weeklySalesTarget: Number(target.weekly_sales_target ?? defaults.weeklySalesTarget),
    dailyVisitTarget: Number(target.daily_visit_target ?? defaults.dailyVisitTarget),
    weeklyVisitTarget: Number(target.weekly_visit_target ?? defaults.weeklyVisitTarget)
  };
}

function getWeekStart(value: Date) {
  const date = new Date(value);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

async function getNextNumericId(table: "shops" | "locations") {
  const { data, error } = await supabase.from(table).select("id").order("id", { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;

  return Number(data?.id ?? 0) + 1;
}
