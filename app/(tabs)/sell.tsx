import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { EmptyState } from "@/components/empty-state";
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
  const queryClient = useQueryClient();
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [cart, setCart] = useState<Cart>({});
  const [notes, setNotes] = useState("");
  const shopsQuery = useQuery({ queryKey: ["shops"], queryFn: getShops });
  const productsQuery = useQuery({ queryKey: ["products"], queryFn: getProducts });
  const { location, error: locationError, refresh } = useCurrentLocation();

  const products = useMemo(() => productsQuery.data ?? [], [productsQuery.data]);
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
        notes,
        items: items.map(({ product, quantity }) => ({
          productId: product.id,
          quantity,
          unitPrice: product.unitPrice
        }))
      }),
    onSuccess: async () => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCart({});
      setNotes("");
      Alert.alert("Order submitted", "The order has been recorded.");
      queryClient.invalidateQueries({ queryKey: ["recent-orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    }
  });

  const canSubmit = Boolean(selectedShop && geofence?.inside && items.length && !orderMutation.isPending);

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
      <ShopPicker shops={shopsQuery.data ?? []} selectedShop={selectedShop} onSelect={setSelectedShop} />

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

      <TextInput
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
      />

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text selectable style={{ color: colors.muted, fontSize: 15, fontWeight: "700" }}>
          Order total
        </Text>
        <Text selectable style={{ color: colors.text, fontSize: 22, fontWeight: "900", fontVariant: ["tabular-nums"] }}>
          {formatCurrency(total)}
        </Text>
      </View>

      <PrimaryButton
        label={orderMutation.isPending ? "Submitting..." : "Submit order"}
        icon="check"
        disabled={!canSubmit}
        onPress={() => orderMutation.mutate()}
      />

      {orderMutation.error ? (
        <Text selectable style={{ color: colors.danger }}>{orderMutation.error.message}</Text>
      ) : null}
    </ScrollView>
  );
}
