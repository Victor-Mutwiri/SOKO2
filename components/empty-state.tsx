import { Text, View } from "react-native";

import { colors, radii, spacing } from "@/constants/theme";

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: radii.md,
        padding: spacing.lg,
        gap: spacing.xs,
        borderCurve: "continuous"
      }}
    >
      <Text selectable style={{ color: colors.text, fontSize: 16, fontWeight: "800" }}>
        {title}
      </Text>
      <Text selectable style={{ color: colors.muted, lineHeight: 20 }}>
        {body}
      </Text>
    </View>
  );
}
