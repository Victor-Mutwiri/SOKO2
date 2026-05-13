import { Activity, DashboardSummary, Order, Product, Shop } from "@/types/domain";

export const mockShops: Shop[] = [
  {
    id: "shop-1",
    name: "Kimathi Mini Mart",
    ownerName: "Mary Wanjiku",
    phone: "+254712345678",
    regionId: 4,
    region: "Nairobi Central",
    latitude: -1.286389,
    longitude: 36.817223,
    status: "active",
    visitRadiusMeters: 90
  },
  {
    id: "shop-2",
    name: "Mombasa Road Wholesalers",
    ownerName: "Ahmed Ali",
    phone: "+254722111222",
    regionId: 4,
    region: "Nairobi South",
    latitude: -1.3292,
    longitude: 36.8589,
    status: "active",
    visitRadiusMeters: 100
  },
  {
    id: "shop-3",
    name: "Eldoret Refresh Point",
    ownerName: "Brian Kiptoo",
    phone: "+254733444555",
    regionId: 1,
    region: "North Rift",
    latitude: 0.5143,
    longitude: 35.2698,
    status: "pending",
    visitRadiusMeters: 80
  }
];

export const mockProducts: Product[] = [
  { id: "prod-1", name: "Pepsi", brand: "Pepsi", packSize: "500ml PET", unitPrice: 85, stockCount: 120 },
  { id: "prod-2", name: "Mirinda Orange", brand: "Mirinda", packSize: "500ml PET", unitPrice: 80, stockCount: 96 },
  { id: "prod-3", name: "7UP", brand: "7UP", packSize: "500ml PET", unitPrice: 80, stockCount: 88 },
  { id: "prod-4", name: "Mountain Dew", brand: "Mountain Dew", packSize: "500ml PET", unitPrice: 90, stockCount: 64 }
];

export const mockOrders: Order[] = [
  {
    id: "ord-1042",
    shopName: "Kimathi Mini Mart",
    createdAt: new Date().toISOString(),
    totalAmount: 12800,
    status: "Pending"
  },
  {
    id: "ord-1041",
    shopName: "Mombasa Road Wholesalers",
    createdAt: new Date(Date.now() - 1000 * 60 * 48).toISOString(),
    totalAmount: 24200,
    status: "Partially Paid"
  }
];

export const mockActivities: Activity[] = [
  {
    id: "act-1",
    type: "order",
    title: "Order submitted",
    description: "Kimathi Mini Mart - KES 12,800",
    createdAt: new Date().toISOString()
  },
  {
    id: "act-2",
    type: "visit",
    title: "Shop visit completed",
    description: "Mombasa Road Wholesalers",
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString()
  }
];

export const mockSummary: DashboardSummary = {
  salesToday: 37000,
  salesThisWeek: 142000,
  ordersToday: 7,
  shopsVisitedToday: 14,
  shopsVisitedThisWeek: 48,
  pendingOrders: 3,
  dailySalesTarget: 50000,
  weeklySalesTarget: 250000,
  dailyVisitTarget: 40,
  weeklyVisitTarget: 180
};
