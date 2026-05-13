import { MaterialCommunityIcons } from "@expo/vector-icons";
import { memo, useMemo, useState } from "react";
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
          borderCurve: "continuous"
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

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(16, 24, 40, 0.28)", justifyContent: "center", padding: spacing.lg }} onPress={() => setMenuOpen(false)}>
          <Pressable
            style={{
              backgroundColor: colors.surface,
              borderRadius: radii.md,
              padding: spacing.md,
              gap: spacing.sm,
              borderCurve: "continuous"
            }}
          >
            <Text selectable style={{ color: colors.text, fontSize: 18, fontWeight: "900" }}>
              {shop.name}
            </Text>
            <ActionRow
              icon="cart-outline"
              label="Sell to shop"
              onPress={() => {
                setMenuOpen(false);
                onSell(shop);
              }}
            />
            <ActionRow
              icon="map-marker-check-outline"
              label="Mark as visit"
              onPress={() => {
                setMenuOpen(false);
                onVisit(shop);
              }}
            />
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
        opacity: pressed ? 0.76 : 1,
        minHeight: 50,
        borderRadius: radii.sm,
        backgroundColor: colors.background,
        paddingHorizontal: spacing.md,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        borderCurve: "continuous"
      })}
    >
      <MaterialCommunityIcons name={icon} color={colors.pepsiBlue} size={21} />
      <Text style={{ color: colors.text, fontWeight: "900" }}>{label}</Text>
    </Pressable>
  );
}
