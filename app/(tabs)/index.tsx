import { useQuery } from "@tanstack/react-query";
import { Link, router } from "expo-router";
import { RefreshControl, ScrollView, Text, View } from "react-native";

import { EmptyState } from "@/components/empty-state";
import { FloatingDayControl } from "@/components/floating-day-control";
import { MetricCard } from "@/components/metric-card";
import { OrderRow } from "@/components/order-row";
import { PrimaryButton } from "@/components/primary-button";
import { ScreenSection } from "@/components/screen-section";
import { TargetProgressCard } from "@/components/target-progress-card";
import { colors, spacing } from "@/constants/theme";
import { useAuth } from "../../providers/auth-provider";
import { useWorkSession } from "../../providers/work-session-provider";
import { getDashboardSummary, getRecentOrders } from "@/services/supabase-queries";

export default function DashboardScreen() {
  const { user } = useAuth();
  const { isActive } = useWorkSession();
  const summaryQuery = useQuery({ queryKey: ["dashboard-summary"], queryFn: getDashboardSummary });
  const ordersQuery = useQuery({ queryKey: ["recent-orders"], queryFn: getRecentOrders });
  const refreshing = summaryQuery.isFetching || ordersQuery.isFetching;

  const summary = summaryQuery.data;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => router.push("/setup?returnTo=/")} />
        }
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 168, gap: spacing.lg }}
      >
        {/* {wasSessionRestored && isActive ? (
          <View
            style={{
              backgroundColor: colors.blueSoft,
              borderColor: colors.pepsiBlue,
              borderWidth: 1,
              borderRadius: radii.md,
              padding: spacing.md,
              gap: spacing.xs,
              borderCurve: "continuous"
            }}
          >
            <Text selectable style={{ color: colors.pepsiBlue, fontWeight: "800" }}>
              Session restored
            </Text>
            <Text selectable style={{ color: colors.text, fontSize: 13, lineHeight: 18 }}>
              Your work session has been restored. You remain clocked in and your time continues to be tracked. No need to clock in again.
            </Text>
          </View>
        ) : null} */}

        <View style={{ gap: spacing.sm }}>
          <Text selectable style={{ color: colors.text, fontSize: 30, fontWeight: "900" }}>
            Hello, {user?.firstName ?? "there"}. Fruitful selling.
          </Text>
          <Text selectable style={{ color: colors.muted, fontSize: 15, lineHeight: 22 }}>
            Track today&apos;s sales, visits, and progress against your target.
          </Text>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
          <TargetProgressCard title="Daily sales" current={summary?.salesToday ?? 0} target={summary?.dailySalesTarget ?? 0} kind="money" tone="blue" />
          <TargetProgressCard title="Daily visits" current={summary?.shopsVisitedToday ?? 0} target={summary?.dailyVisitTarget ?? 0} kind="count" tone="green" />
          <TargetProgressCard title="Weekly sales" current={summary?.salesThisWeek ?? 0} target={summary?.weeklySalesTarget ?? 0} kind="money" tone="blue" />
          <TargetProgressCard title="Weekly visits" current={summary?.shopsVisitedThisWeek ?? 0} target={summary?.weeklyVisitTarget ?? 0} kind="count" tone="green" />
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
          <MetricCard label="Orders" value={`${summary?.ordersToday ?? 0}`} tone="red" />
          <MetricCard label="Pending" value={`${summary?.pendingOrders ?? 0}`} tone="amber" />
        </View>

        <View style={{ flexDirection: "row", gap: spacing.md }}>
          {isActive ? (
            <>
              <Link href="/sell" asChild>
                <PrimaryButton label="Start sale" icon="cart" style={{ flex: 1 }} />
              </Link>
              <Link href="/new-shop" asChild>
                <PrimaryButton label="Add shop" icon="plus" variant="secondary" style={{ flex: 1 }} />
              </Link>
            </>
          ) : (
            <>
              <PrimaryButton label="Start sale" icon="cart" disabled style={{ flex: 1 }} />
              <PrimaryButton label="Add shop" icon="plus" disabled variant="secondary" style={{ flex: 1 }} />
            </>
          )}
        </View>

        <ScreenSection title="Recent orders">
          {ordersQuery.data?.length ? (
            ordersQuery.data.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                onPress={() => router.push({ pathname: "/order/[orderId]", params: { orderId: order.id } })}
              />
            ))
          ) : (
            <EmptyState title="No orders yet" body="Orders created today will appear here." />
          )}
        </ScreenSection>
      </ScrollView>
      <FloatingDayControl />
    </View>
  );
}

