import { Text, View } from "react-native";

import { colors, radii, spacing } from "@/constants/theme";

type Props = {
  label: string;
  value: string;
  tone: "blue" | "red" | "green" | "amber";
};

const toneColors = {
  blue: [colors.blueSoft, colors.pepsiBlue],
  red: [colors.dangerSoft, colors.pepsiRed],
  green: [colors.successSoft, colors.success],
  amber: [colors.amberSoft, colors.amber]
} as const;

export function MetricCard({ label, value, tone }: Props) {
  const [backgroundColor, accent] = toneColors[tone];

  return (
    <View
      style={{
        flexGrow: 1,
        flexBasis: "46%",
        backgroundColor,
        borderRadius: radii.md,
        padding: spacing.md,
        gap: spacing.xs,
        minHeight: 96,
        borderCurve: "continuous"
      }}
    >
      <Text selectable style={{ color: colors.muted, fontSize: 13, fontWeight: "800", textTransform: "uppercase" }}>
        {label}
      </Text>
      <Text selectable style={{ color: accent, fontSize: 24, fontWeight: "900", fontVariant: ["tabular-nums"] }}>
        {value}
      </Text>
    </View>
  );
}
