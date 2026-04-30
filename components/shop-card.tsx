import { Link } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { colors, radii, spacing } from "@/constants/theme";
import { Coordinates, Shop } from "@/types/domain";
import { isInsideVisitRadius } from "@/utils/geo";

export function ShopCard({ shop, location }: { shop: Shop; location: Coordinates | null }) {
  const geofence = location ? isInsideVisitRadius(location, shop) : null;
  const isUnlocked = Boolean(geofence?.inside);

  return (
    <Link href="/sell" asChild>
      <Pressable
        style={({ pressed }) => ({
          opacity: pressed ? 0.82 : 1,
          backgroundColor: colors.surface,
          borderColor: isUnlocked ? colors.success : colors.border,
          borderWidth: 1,
          borderRadius: radii.md,
          padding: spacing.md,
          gap: spacing.sm,
          borderCurve: "continuous"
        })}
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
      </Pressable>
    </Link>
  );
}
