import { MaterialCommunityIcons } from "@expo/vector-icons";
import { memo, useCallback, useMemo, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

import { colors, radii, spacing } from "@/constants/theme";
import { Coordinates, Shop } from "@/types/domain";
import { isInsideVisitRadius } from "@/utils/geo";

export const ShopCard = memo(function ShopCard({
  shop,
  location,
  onSell,
  onVisit
}: {
  shop: Shop;
  location: Coordinates | null;
  onSell: (shop: Shop) => void;
  onVisit: (shop: Shop) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const geofence = useMemo(() => (location ? isInsideVisitRadius(location, shop) : null), [location, shop]);
  const isUnlocked = Boolean(geofence?.inside);

  const handleSellPress = useCallback(() => {
    setMenuOpen(false);
    requestAnimationFrame(() => onSell(shop));
  }, [onSell, shop]);

  const handleVisitPress = useCallback(() => {
    setMenuOpen(false);
    requestAnimationFrame(() => onVisit(shop));
  }, [onVisit, shop]);

  return (
    <>
      <View
        style={{
          backgroundColor: colors.surface,
          borderColor: isUnlocked ? colors.success : colors.border,
          borderWidth: 1,
          borderRadius: radii.md,
          padding: spacing.md,
          gap: spacing.sm,
          borderCurve: "continuous",
          shadowColor: "#000",
          shadowOpacity: 0.06,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 6 },
          elevation: 3
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: spacing.md }}>
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Text selectable style={{ color: colors.text, fontSize: 17, fontWeight: "900" }}>
              {shop.name}
            </Text>
            <Text selectable style={{ color: colors.muted }}>
              {shop.region}
            </Text>
          </View>
          <Pressable
            onPress={() => setMenuOpen(true)}
            style={{
              width: 34,
              height: 34,
              borderRadius: radii.sm,
              backgroundColor: colors.background,
              alignItems: "center",
              justifyContent: "center",
              borderCurve: "continuous"
            }}
          >
            <MaterialCommunityIcons name="dots-horizontal" color={colors.text} size={22} />
          </Pressable>
          <View
            style={{
              backgroundColor: isUnlocked ? colors.successSoft : colors.blueSoft,
              borderRadius: 999,
              paddingHorizontal: spacing.sm,
              height: 30,
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <Text selectable style={{ color: isUnlocked ? colors.success : colors.pepsiBlue, fontWeight: "900", fontSize: 12 }}>
              {isUnlocked ? "Unlocked" : shop.status}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
          <MaterialCommunityIcons name="map-marker-radius-outline" color={colors.muted} size={16} />
          <Text selectable style={{ color: colors.muted }}>
            {geofence ? `${Math.round(geofence.distanceMeters)}m away` : "Location pending"}
          </Text>
        </View>
      </View>

      <Modal visible={menuOpen} transparent animationType="slide" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(16, 24, 40, 0.32)", justifyContent: "flex-end" }} onPress={() => setMenuOpen(false)}>
          <Pressable
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: radii.lg,
              borderTopRightRadius: radii.lg,
              padding: spacing.lg,
              gap: spacing.sm,
              borderCurve: "continuous"
            }}
          >
            <View style={{ width: 48, height: 4, borderRadius: 999, backgroundColor: colors.pepsiBlue, alignSelf: "center", marginBottom: spacing.sm }} />
            <Text selectable style={{ color: colors.text, fontSize: 18, fontWeight: "900" }}>
              {shop.name}
            </Text>
            <Text selectable style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
              Choose an action for this shop.
            </Text>
            <ActionRow icon="cart-outline" label="Sell to shop" onPress={handleSellPress} />
            <ActionRow icon="map-marker-check-outline" label="Mark as visit" onPress={handleVisitPress} />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
});

function ActionRow({ icon, label, onPress }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.84 : 1,
        minHeight: 56,
        borderRadius: radii.md,
        backgroundColor: colors.background,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.md,
        borderCurve: "continuous"
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
        <MaterialCommunityIcons name={icon} color={colors.pepsiBlue} size={22} />
        <Text style={{ color: colors.text, fontWeight: "900", fontSize: 16 }}>{label}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" color={colors.muted} size={20} />
    </Pressable>
  );
}
