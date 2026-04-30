import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { RefreshControl, ScrollView, Text, View } from "react-native";

import { EmptyState } from "@/components/empty-state";
import { MetricCard } from "@/components/metric-card";
import { OrderRow } from "@/components/order-row";
import { PrimaryButton } from "@/components/primary-button";
import { ScreenSection } from "@/components/screen-section";
import { colors, spacing } from "@/constants/theme";
import { getDashboardSummary, getRecentOrders } from "@/services/supabase-queries";
import { formatCurrency } from "@/utils/format";

export default function DashboardScreen() {
  const summaryQuery = useQuery({ queryKey: ["dashboard-summary"], queryFn: getDashboardSummary });
  const ordersQuery = useQuery({ queryKey: ["recent-orders"], queryFn: getRecentOrders });
  const refreshing = summaryQuery.isFetching || ordersQuery.isFetching;

  const summary = summaryQuery.data;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => {
          summaryQuery.refetch();
          ordersQuery.refetch();
        }} />
      }
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
    >
      <View style={{ gap: spacing.sm }}>
        <Text selectable style={{ color: colors.muted, fontSize: 13, fontWeight: "700", textTransform: "uppercase" }}>
          Today
        </Text>
        <Text selectable style={{ color: colors.text, fontSize: 30, fontWeight: "800" }}>
          Field sales dashboard
        </Text>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
        <MetricCard label="Sales" value={formatCurrency(summary?.salesToday ?? 0)} tone="blue" />
        <MetricCard label="Orders" value={`${summary?.ordersToday ?? 0}`} tone="red" />
        <MetricCard label="Visited" value={`${summary?.shopsVisitedToday ?? 0}`} tone="green" />
        <MetricCard label="Pending" value={`${summary?.pendingOrders ?? 0}`} tone="amber" />
      </View>

      <View style={{ flexDirection: "row", gap: spacing.md }}>
        <Link href="/sell" asChild>
          <PrimaryButton label="Start sale" icon="cart" style={{ flex: 1 }} />
        </Link>
        <Link href="/new-shop" asChild>
          <PrimaryButton label="Add shop" icon="plus" variant="secondary" style={{ flex: 1 }} />
        </Link>
      </View>

      <ScreenSection title="Recent orders">
        {ordersQuery.data?.length ? (
          ordersQuery.data.map((order) => <OrderRow key={order.id} order={order} />)
        ) : (
          <EmptyState title="No orders yet" body="Orders created today will appear here." />
        )}
      </ScreenSection>
    </ScrollView>
  );
}
