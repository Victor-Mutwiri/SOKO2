export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type Shop = Coordinates & {
  id: string;
  name: string;
  ownerName?: string | null;
  phone?: string | null;
  regionId?: number | null;
  region: string;
  status: "active" | "pending" | "inactive";
  visitRadiusMeters?: number | null;
};

export type Region = {
  id: number;
  name: string;
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

export type OrderItem = {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type OrderDetail = Order & {
  shopId: string | null;
  paidAmount: number;
  notes?: string | null;
  items: OrderItem[];
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
  salesThisWeek: number;
  ordersToday: number;
  shopsVisitedToday: number;
  shopsVisitedThisWeek: number;
  pendingOrders: number;
  dailySalesTarget: number;
  weeklySalesTarget: number;
  dailyVisitTarget: number;
  weeklyVisitTarget: number;
};

export type SalesUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: "Sales Rep" | "Team Lead" | "Super Admin";
  status: "Active" | "Suspended";
  canEditPrices: boolean;
};

export type WorkSessionStatus = "clocked_out" | "active" | "paused" | "auto_clocked_out";

export type WorkSession = {
  id: string;
  userId: string;
  status: WorkSessionStatus;
  clockedInAt: string;
  clockedOutAt?: string | null;
  pausedAt?: string | null;
  totalPausedMs: number;
  pauseReason?: string | null;
};

export type SalesNotification = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  readAt?: string | null;
};
