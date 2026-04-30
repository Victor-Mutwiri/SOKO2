import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { colors, radii, spacing } from "@/constants/theme";
import { Activity } from "@/types/domain";
import { formatDateTime } from "@/utils/format";

export function ActivityRow({ activity }: { activity: Activity }) {
  const iconName = iconMap[activity.type] ?? "clipboard-list-outline";

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: radii.md,
        padding: spacing.md,
        flexDirection: "row",
        gap: spacing.md,
        borderCurve: "continuous"
      }}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 19,
          backgroundColor: colors.blueSoft,
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <MaterialCommunityIcons name={iconName} color={colors.pepsiBlue} size={18} />
      </View>
      <View style={{ flex: 1, gap: spacing.xs }}>
        <Text selectable style={{ color: colors.text, fontWeight: "800" }}>
          {activity.title}
        </Text>
        <Text selectable style={{ color: colors.muted, lineHeight: 20 }}>
          {activity.description}
        </Text>
        <Text selectable style={{ color: colors.muted, fontSize: 12 }}>
          {formatDateTime(activity.createdAt)}
        </Text>
      </View>
    </View>
  );
}

const iconMap = {
  visit: "navigation-variant-outline",
  order: "clipboard-list-outline",
  shop_onboarding: "check-circle-outline",
  geofence: "map-marker-alert-outline"
} as const;
