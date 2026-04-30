import { Text, View } from "react-native";

import { colors, radii, spacing } from "@/constants/theme";
import { Order } from "@/types/domain";
import { formatCurrency, formatDateTime } from "@/utils/format";

export function OrderRow({ order }: { order: Order }) {
  return (
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
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md }}>
        <Text selectable style={{ color: colors.text, fontSize: 16, fontWeight: "800", flex: 1 }}>
          {order.shopName}
        </Text>
        <Text selectable style={{ color: colors.pepsiBlue, fontWeight: "900", fontVariant: ["tabular-nums"] }}>
          {formatCurrency(order.totalAmount)}
        </Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md }}>
        <Text selectable style={{ color: colors.muted, flex: 1 }}>
          {formatDateTime(order.createdAt)}
        </Text>
        <Text selectable style={{ color: colors.muted, fontWeight: "800", textTransform: "capitalize" }}>
          {order.status}
        </Text>
      </View>
    </View>
  );
}
