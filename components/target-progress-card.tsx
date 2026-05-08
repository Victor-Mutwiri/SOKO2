import { Text, View } from "react-native";

import { colors, radii, spacing } from "@/constants/theme";
import { formatCurrency } from "@/utils/format";

type Props = {
  title: string;
  current: number;
  target: number;
  kind: "money" | "count";
  tone: "blue" | "green";
};

export function TargetProgressCard({ title, current, target, kind, tone }: Props) {
  const progress = target > 0 ? Math.min(current / target, 1) : 0;
  const percent = Math.round(progress * 100);
  const accent = tone === "blue" ? colors.pepsiBlue : colors.success;
  const soft = tone === "blue" ? colors.blueSoft : colors.successSoft;
  const formattedCurrent = kind === "money" ? formatCurrency(current) : `${current}`;
  const formattedTarget = kind === "money" ? formatCurrency(target) : `${target}`;

  return (
    <View
      style={{
        flexBasis: "47%",
        flexGrow: 1,
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: radii.md,
        padding: spacing.md,
        gap: spacing.sm,
        borderCurve: "continuous"
      }}
    >
      <View style={{ gap: spacing.xs }}>
        <Text selectable style={{ color: colors.muted, fontSize: 12, fontWeight: "900", textTransform: "uppercase" }}>
          {title}
        </Text>
        <Text selectable style={{ color: colors.text, fontSize: 18, fontWeight: "900", fontVariant: ["tabular-nums"] }}>
          {formattedCurrent}
        </Text>
        <Text selectable style={{ color: colors.muted, fontSize: 12 }} numberOfLines={1}>
          of {formattedTarget} target
        </Text>
      </View>

      <View style={{ height: 9, borderRadius: 999, backgroundColor: soft, overflow: "hidden" }}>
        <View style={{ width: `${percent}%`, height: "100%", backgroundColor: accent, borderRadius: 999 }} />
      </View>

      <Text selectable style={{ color: accent, fontWeight: "900", fontVariant: ["tabular-nums"] }}>
        {percent}% complete
      </Text>
    </View>
  );
}
