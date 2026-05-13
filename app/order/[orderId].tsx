import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";

import { PrimaryButton } from "@/components/primary-button";
import { ScreenSection } from "@/components/screen-section";
import { colors, radii, spacing } from "@/constants/theme";
import { getOrderById, updateOrderStatus } from "@/services/supabase-queries";
import { formatCurrency, formatDateTime } from "@/utils/format";

const orderStatuses = ["Pending", "Partially Paid", "Cleared"] as const;

export default function OrderDetailScreen() {
  const params = useLocalSearchParams<{ orderId?: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const orderId = params.orderId;

  const orderQuery = useQuery({
    queryKey: ["orders", orderId],
    queryFn: () => getOrderById(String(orderId)),
    enabled: Boolean(orderId)
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => updateOrderStatus(String(orderId), status as typeof orderStatuses[number]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recent-orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["orders", orderId] });
    }
  });

  const order = orderQuery.data;

  const pendingReason = useMemo(() => {
    if (!order) return null;
    if (order.status === "Pending") {
      return "This order is still pending because it was marked as a credit sale. Once payment is received, update the status to Partially Paid or Cleared.";
    }
    if (order.status === "Partially Paid") {
      return "This order is partially paid. Update to Cleared once the remainder is collected.";
    }
    return "This order has been fully cleared.";
  }, [order]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl
            refreshing={orderQuery.isFetching}
            onRefresh={() => orderQuery.refetch()}
          />
        }
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 168, gap: spacing.lg }}
      >
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: colors.pepsiBlue, fontWeight: "800" }}>← Back</Text>
        </Pressable>

        {orderQuery.isLoading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", minHeight: 160 }}>
            <ActivityIndicator color={colors.pepsiBlue} />
          </View>
        ) : !order ? (
          <View
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: radii.xl,
              padding: spacing.lg,
              gap: spacing.sm,
              borderCurve: "continuous"
            }}
          >
            <Text selectable style={{ color: colors.text, fontSize: 20, fontWeight: "900" }}>
              Order not found
            </Text>
            <Text selectable style={{ color: colors.muted }}>
              We could not load this order. It may have been removed or the ID is invalid. Try refreshing.
            </Text>
            <PrimaryButton label="Refresh" onPress={() => orderQuery.refetch()} />
          </View>
        ) : (
          <View style={{ gap: spacing.lg }}>
            <View
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: radii.xl,
                padding: spacing.lg,
                gap: spacing.md,
                borderCurve: "continuous"
              }}
            >
              <Text selectable style={{ color: colors.text, fontSize: 24, fontWeight: "900" }}>
                Order details
              </Text>
              <View style={{ gap: spacing.xs }}>
                <Text selectable style={{ color: colors.muted, fontSize: 14 }}>
                  Shop
                </Text>
                <Text selectable style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}>
                  {order.shopName}
                </Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: spacing.md }}>
                <Text selectable style={{ color: colors.muted }}>Created</Text>
                <Text selectable style={{ color: colors.text }}>{formatDateTime(order.createdAt)}</Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: spacing.md }}>
                <Text selectable style={{ color: colors.muted }}>Status</Text>
                <Text selectable style={{ color: colors.text, fontWeight: "800", textTransform: "capitalize" }}>
                  {order.status}
                </Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: spacing.md }}>
                <Text selectable style={{ color: colors.muted }}>Total</Text>
                <Text selectable style={{ color: colors.text, fontWeight: "900" }}>
                  {formatCurrency(order.totalAmount)}
                </Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: spacing.md }}>
                <Text selectable style={{ color: colors.muted }}>Paid</Text>
                <Text selectable style={{ color: colors.text, fontWeight: "900" }}>
                  {formatCurrency(order.paidAmount)}
                </Text>
              </View>
              {order.notes ? (
                <View style={{ gap: spacing.xs }}>
                  <Text selectable style={{ color: colors.muted, fontSize: 14 }}>
                    Notes
                  </Text>
                  <Text selectable style={{ color: colors.text }}>{order.notes}</Text>
                </View>
              ) : null}
            </View>

            <View
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: radii.xl,
                padding: spacing.lg,
                gap: spacing.sm,
                borderCurve: "continuous"
              }}
            >
              <Text selectable style={{ color: colors.text, fontSize: 18, fontWeight: "900" }}>
                Why this order is pending
              </Text>
              <Text selectable style={{ color: colors.muted, lineHeight: 22 }}>
                {pendingReason}
              </Text>
            </View>

            <View
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: radii.xl,
                padding: spacing.lg,
                gap: spacing.sm,
                borderCurve: "continuous"
              }}
            >
              <Text selectable style={{ color: colors.text, fontSize: 18, fontWeight: "900" }}>
                Line items
              </Text>
              {order.items.length ? (
                order.items.map((item) => (
                  <View key={item.id} style={{ gap: spacing.xs, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                    <Text selectable style={{ color: colors.text, fontWeight: "800" }}>
                      {item.productName}
                    </Text>
                    <Text selectable style={{ color: colors.muted }}>
                      {item.quantity} × {formatCurrency(item.unitPrice)} = {formatCurrency(item.lineTotal)}
                    </Text>
                  </View>
                ))
              ) : (
                <Text selectable style={{ color: colors.muted }}>Product line items are not available for this order.</Text>
              )}
            </View>

            <ScreenSection title="Update order status">
              <View style={{ flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" }}>
                {orderStatuses.map((statusOption) => (
                  <PrimaryButton
                    key={statusOption}
                    label={statusOption}
                    variant={order.status === statusOption ? "secondary" : "primary"}
                    disabled={order.status === statusOption || statusMutation.isPending}
                    onPress={() => statusMutation.mutate(statusOption)}
                    style={{ flexGrow: 1, minWidth: 120 }}
                  />
                ))}
              </View>
              {statusMutation.error ? (
                <Text selectable style={{ color: colors.danger }}>{statusMutation.error.message}</Text>
              ) : null}
            </ScreenSection>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
