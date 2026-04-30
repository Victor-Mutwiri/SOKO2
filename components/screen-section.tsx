import { ReactNode } from "react";
import { Text, View } from "react-native";

import { colors, spacing } from "@/constants/theme";

export function ScreenSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ gap: spacing.md }}>
      <Text selectable style={{ color: colors.text, fontSize: 20, fontWeight: "800" }}>
        {title}
      </Text>
      <View style={{ gap: spacing.md }}>{children}</View>
    </View>
  );
}
