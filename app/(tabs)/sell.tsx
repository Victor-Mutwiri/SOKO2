import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useEffect, useMemo, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { EmptyState } from "@/components/empty-state";
import { OperationLock } from "@/components/operation-lock";
import { PrimaryButton } from "@/components/primary-button";
import { ProductStepper } from "@/components/product-stepper";
import { ShopPicker } from "@/components/shop-picker";
import { colors, radii, spacing } from "@/constants/theme";
import { useCurrentLocation } from "@/hooks/use-current-location";
import { createOrder, getProducts, getShops } from "@/services/supabase-queries";
import { Product, Shop } from "@/types/domain";
import { formatCurrency } from "@/utils/format";
import { isInsideVisitRadius } from "@/utils/geo";

type Cart = Record<string, number>;

export default function SellScreen() {
  const { shopId } = useLocalSearchParams<{ shopId?: string }>();
  const queryClient = useQueryClient();
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "credit">("cash");
  const [cart, setCart] = useState<Cart>({});
  const [notes, setNotes] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const shopsQuery = useQuery({ queryKey: ["shops"], queryFn: getShops });
  const productsQuery = useQuery({ queryKey: ["products"], queryFn: getProducts });
  const { location, error: locationError, refresh } = useCurrentLocation();

  const products = useMemo(() => productsQuery.data ?? [], [productsQuery.data]);
  const isShopSelected = Boolean(selectedShop);

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        router.push("/shops");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  useEffect(() => {
    if (!shopId || selectedShop) return;

    const shop = shopsQuery.data?.find((item) => item.id === shopId);
    if (shop) setSelectedShop(shop);
  }, [shopId, selectedShop, shopsQuery.data]);

  const geofence = selectedShop && location ? isInsideVisitRadius(location, selectedShop) : null;
  const total = useMemo(
    () =>
      products.reduce((sum, product) => {
        return sum + (cart[product.id] ?? 0) * product.unitPrice;
      }, 0),
    [cart, products]
  );
  const items = useMemo(
    () =>
      products
        .map((product: Product) => ({ product, quantity: cart[product.id] ?? 0 }))
        .filter((item) => item.quantity > 0),
    [cart, products]
  );

  const orderMutation = useMutation({
    mutationFn: () =>
      createOrder({
        shopId: selectedShop?.id ?? "",
        paymentMethod,
        notes,
        items: items.map(({ product, quantity }) => ({
          productId: product.id,
          quantity,
          unitPrice: product.unitPrice
        }))
      }),
    onSuccess: async () => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowConfirmation(false);
      setShowSuccess(true);
      setCart({});
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["recent-orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    }
  });

  const canSubmit = Boolean(selectedShop && geofence?.inside && items.length && !orderMutation.isPending);

  if (showSuccess) {
    return (
      <OperationLock>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
          <View
            style={{
              alignItems: "center",
              gap: spacing.lg,
              backgroundColor: colors.surface,
              borderRadius: radii.lg,
              padding: spacing.xl,
              borderCurve: "continuous",
              shadowColor: "#000",
              shadowOpacity: 0.1,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: 10 },
              elevation: 5
            }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: colors.successSoft,
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <MaterialCommunityIcons name="check-circle" color={colors.success} size={56} />
            </View>
            <View style={{ alignItems: "center", gap: spacing.xs }}>
              <Text style={{ color: colors.text, fontSize: 24, fontWeight: "900" }}>Order successful!</Text>
              <Text style={{ color: colors.muted, fontSize: 16, textAlign: "center" }}>
                Your order has been submitted to {selectedShop?.name}.
              </Text>
              <Text style={{ color: colors.pepsiBlue, fontSize: 14, fontWeight: "700", marginTop: spacing.sm }}>
                Returning to shops...
              </Text>
            </View>
          </View>
        </View>
      </OperationLock>
    );
  }

  return (
    <OperationLock>
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
      {selectedShop ? (
        <View style={{ gap: spacing.md }}>
          <Pressable onPress={() => router.push("/shops")} style={{ alignSelf: "flex-start" }}>
            <Text style={{ color: colors.pepsiBlue, fontWeight: "800" }}>← Back to shops</Text>
          </Pressable>
          <View
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: radii.md,
              padding: spacing.md,
              gap: spacing.xs,
              borderCurve: "continuous"
            }}
          >
            <Text selectable style={{ color: colors.text, fontSize: 18, fontWeight: "900" }}>
              Selling to {selectedShop.name}
            </Text>
            <Text selectable style={{ color: colors.muted }}>
              {selectedShop.region} • {selectedShop.ownerName ?? "Owner not available"}
            </Text>
          </View>
        </View>
      ) : (
        <ShopPicker shops={shopsQuery.data ?? []} selectedShop={selectedShop} onSelect={setSelectedShop} />
      )}

      {selectedShop ? (
        <View
          style={{
            backgroundColor: geofence?.inside ? colors.successSoft : colors.dangerSoft,
            borderColor: geofence?.inside ? colors.success : colors.danger,
            borderRadius: radii.md,
            borderWidth: 1,
            padding: spacing.md,
            gap: spacing.xs,
            borderCurve: "continuous"
          }}
        >
          <Text selectable style={{ color: colors.text, fontWeight: "800" }}>
            {geofence?.inside ? "Shop unlocked" : "Move closer to sell"}
          </Text>
          <Text selectable style={{ color: colors.muted }}>
            {geofence
              ? `${Math.round(geofence.distanceMeters)}m away. Required radius: ${geofence.radiusMeters}m.`
              : locationError ?? "Checking GPS position..."}
          </Text>
          <Pressable onPress={refresh}>
            <Text style={{ color: colors.pepsiBlue, fontWeight: "800" }}>Refresh location</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={{ gap: spacing.md }}>
        <Text selectable style={{ color: colors.text, fontSize: 20, fontWeight: "800" }}>
          Products
        </Text>
        {products.length ? (
          products.map((product) => (
            <ProductStepper
              key={product.id}
              product={product}
              quantity={cart[product.id] ?? 0}
              onChange={(quantity) => setCart((current) => ({ ...current, [product.id]: quantity }))}
            />
          ))
        ) : (
          <EmptyState title="No products loaded" body="Products from Supabase will appear here." />
        )}
      </View>

      <View style={{ gap: spacing.md }}>
        <Text selectable style={{ color: colors.text, fontSize: 20, fontWeight: "800" }}>
          Payment method
        </Text>
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <Pressable
            onPress={() => setPaymentMethod("cash")}
            style={({ pressed }) => ({
              opacity: pressed ? 0.82 : 1,
              flex: 1,
              minHeight: 56,
              borderRadius: radii.sm,
              backgroundColor: paymentMethod === "cash" ? colors.success : colors.surface,
              borderColor: paymentMethod === "cash" ? colors.success : colors.border,
              borderWidth: 1,
              paddingHorizontal: spacing.md,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: spacing.sm,
              borderCurve: "continuous"
            })}
          >
            <Text style={{ color: paymentMethod === "cash" ? colors.surface : colors.text, fontWeight: "800", fontSize: 16 }}>
              Cash
            </Text>
            {paymentMethod === "cash" && <MaterialCommunityIcons name="check" color={colors.surface} size={20} />}
          </Pressable>
          <Pressable
            onPress={() => setPaymentMethod("credit")}
            style={({ pressed }) => ({
              opacity: pressed ? 0.82 : 1,
              flex: 1,
              minHeight: 56,
              borderRadius: radii.sm,
              backgroundColor: paymentMethod === "credit" ? colors.success : colors.surface,
              borderColor: paymentMethod === "credit" ? colors.success : colors.border,
              borderWidth: 1,
              paddingHorizontal: spacing.md,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: spacing.sm,
              borderCurve: "continuous"
            })}
          >
            <Text style={{ color: paymentMethod === "credit" ? colors.surface : colors.text, fontWeight: "800", fontSize: 16 }}>
              Credit
            </Text>
            {paymentMethod === "credit" && <MaterialCommunityIcons name="check" color={colors.surface} size={20} />}
          </Pressable>
        </View>
        <Text selectable style={{ color: colors.muted, fontSize: 13, lineHeight: 18 }}>
          {paymentMethod === "cash"
            ? "Cash orders are marked as cleared immediately."
            : "Credit orders are marked as pending until payment is confirmed."}
        </Text>
      </View>

      {/* <TextInput
        placeholder="Order notes"
        value={notes}
        onChangeText={setNotes}
        multiline
        style={{
          minHeight: 84,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: radii.md,
          padding: spacing.md,
          color: colors.text,
          backgroundColor: colors.surface,
          textAlignVertical: "top",
          borderCurve: "continuous"
        }}
      /> */}

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text selectable style={{ color: colors.muted, fontSize: 15, fontWeight: "700" }}>
          Order total
        </Text>
        <Text selectable style={{ color: colors.text, fontSize: 22, fontWeight: "900", fontVariant: ["tabular-nums"] }}>
          {formatCurrency(total)}
        </Text>
      </View>

      <PrimaryButton
        label={orderMutation.isPending ? "Submitting..." : "Confirm & submit"}
        icon="check"
        disabled={!canSubmit}
        onPress={() => setShowConfirmation(true)}
      />

      <Modal visible={showConfirmation} transparent animationType="slide" onRequestClose={() => setShowConfirmation(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(16, 24, 40, 0.32)", justifyContent: "flex-end" }}
          onPress={() => setShowConfirmation(false)}
        >
          <Pressable
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: radii.lg,
              borderTopRightRadius: radii.lg,
              padding: spacing.lg,
              gap: spacing.md,
              borderCurve: "continuous"
            }}
          >
            <View style={{ width: 48, height: 4, borderRadius: 999, backgroundColor: colors.pepsiBlue, alignSelf: "center", marginBottom: spacing.sm }} />
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: "900" }}>Review order</Text>

            <View style={{ backgroundColor: colors.background, borderRadius: radii.md, padding: spacing.md, gap: spacing.md }}>
              <View>
                <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "700", marginBottom: spacing.xs }}>Selling to</Text>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: "900" }}>{selectedShop?.name}</Text>
              </View>

              <View>
                <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "700", marginBottom: spacing.xs }}>Items ({items.length})</Text>
                {items.map((item) => (
                  <View key={item.product.id} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.xs }}>
                    <Text style={{ color: colors.text, flex: 1 }}>
                      {item.product.name} × {item.quantity}
                    </Text>
                    <Text style={{ color: colors.text, fontWeight: "900" }}>{formatCurrency(item.quantity * item.product.unitPrice)}</Text>
                  </View>
                ))}
              </View>

              <View style={{ borderTopColor: colors.border, borderTopWidth: 1, paddingTop: spacing.md, gap: spacing.xs }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: colors.muted }}>Payment</Text>
                  <Text style={{ color: colors.text, fontWeight: "700" }}>{paymentMethod === "cash" ? "Cash" : "Credit"}</Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: colors.text, fontSize: 18, fontWeight: "900" }}>Total</Text>
                  <Text style={{ color: colors.success, fontSize: 20, fontWeight: "900" }}>{formatCurrency(total)}</Text>
                </View>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <Pressable
                onPress={() => setShowConfirmation(false)}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.82 : 1,
                  flex: 1,
                  minHeight: 52,
                  borderRadius: radii.sm,
                  backgroundColor: colors.background,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: "center",
                  justifyContent: "center",
                  borderCurve: "continuous"
                })}
              >
                <Text style={{ color: colors.text, fontWeight: "800" }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => orderMutation.mutate()}
                disabled={orderMutation.isPending}
                style={({ pressed }) => ({
                  opacity: orderMutation.isPending ? 0.6 : pressed ? 0.82 : 1,
                  flex: 1,
                  minHeight: 52,
                  borderRadius: radii.sm,
                  backgroundColor: colors.success,
                  alignItems: "center",
                  justifyContent: "center",
                  borderCurve: "continuous"
                })}
              >
                <Text style={{ color: colors.surface, fontWeight: "800" }}>{orderMutation.isPending ? "Submitting..." : "Submit order"}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

    </ScrollView>
    </OperationLock>
  );
}
