export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type Shop = Coordinates & {
  id: string;
  name: string;
  ownerName?: string | null;
  phone?: string | null;
  region: string;
  status: "active" | "pending" | "inactive";
  visitRadiusMeters?: number | null;
};

export type Product = {
  id: string;
  name: string;
  brand: string;
  packSize: string;
  unitPrice: number;
  stockCount?: number | null;
};

export type Order = {
  id: string;
  shopName: string;
  createdAt: string;
  totalAmount: number;
  status: "Pending" | "Partially Paid" | "Cleared";
};

export type Activity = {
  id: string;
  type: "visit" | "order" | "shop_onboarding" | "geofence";
  title: string;
  description: string;
  createdAt: string;
};

export type DashboardSummary = {
  salesToday: number;
  ordersToday: number;
  shopsVisitedToday: number;
  pendingOrders: number;
};
