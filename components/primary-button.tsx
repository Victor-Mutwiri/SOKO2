import { MaterialCommunityIcons } from "@expo/vector-icons";
import { forwardRef } from "react";
import { Pressable, StyleProp, Text, ViewStyle } from "react-native";

import { colors, radii, spacing } from "@/constants/theme";

type IconName = "cart" | "plus" | "check" | "map-pin" | "clock-in" | "clock-out" | "play" | "pause" | "phone" | "whatsapp" | "send" | "refresh";

type Props = {
  label: string;
  icon: IconName;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export const PrimaryButton = forwardRef<React.ElementRef<typeof Pressable>, Props>(function PrimaryButton(
  { label, icon, variant = "primary", disabled, onPress, style },
  ref
) {
  const backgroundColor = variant === "primary" ? colors.pepsiBlue : colors.surface;
  const textColor = variant === "primary" ? colors.surface : colors.pepsiBlue;
  const iconName = iconMap[icon];

  return (
    <Pressable
      ref={ref}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: 52,
          opacity: disabled ? 0.45 : pressed ? 0.82 : 1,
          backgroundColor,
          borderColor: variant === "secondary" ? colors.border : colors.pepsiBlue,
          borderWidth: 1,
          borderRadius: radii.sm,
          paddingHorizontal: spacing.md,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: spacing.sm,
          borderCurve: "continuous"
        },
        style
      ]}
    >
      <MaterialCommunityIcons name={iconName} color={textColor} size={18} />
      <Text style={{ color: textColor, fontWeight: "800" }}>{label}</Text>
    </Pressable>
  );
});

const iconMap = {
  cart: "cart-outline",
  plus: "plus",
  check: "check",
  "map-pin": "map-marker-radius-outline",
  "clock-in": "clock-start",
  "clock-out": "clock-end",
  play: "play",
  pause: "pause",
  phone: "phone",
  whatsapp: "whatsapp",
  send: "send",
  refresh: "refresh"
} as const;
