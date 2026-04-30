import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { colors, radii, spacing } from "@/constants/theme";
import { Product } from "@/types/domain";
import { formatCurrency } from "@/utils/format";

export function ProductStepper({
  product,
  quantity,
  onChange
}: {
  product: Product;
  quantity: number;
  onChange: (quantity: number) => void;
}) {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: radii.md,
        padding: spacing.md,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        borderCurve: "continuous"
      }}
    >
      <View style={{ flex: 1, gap: spacing.xs }}>
        <Text selectable style={{ color: colors.text, fontSize: 16, fontWeight: "900" }}>
          {product.name}
        </Text>
        <Text selectable style={{ color: colors.muted }}>
          {product.packSize} - {formatCurrency(product.unitPrice)}
        </Text>
      </View>
      <StepperButton disabled={quantity <= 0} onPress={() => onChange(Math.max(0, quantity - 1))} icon="minus" />
      <Text selectable style={{ color: colors.text, minWidth: 30, textAlign: "center", fontSize: 18, fontWeight: "900" }}>
        {quantity}
      </Text>
      <StepperButton onPress={() => onChange(quantity + 1)} icon="plus" />
    </View>
  );
}

function StepperButton({ icon, onPress, disabled }: { icon: "plus" | "minus"; onPress: () => void; disabled?: boolean }) {
  const iconName = icon === "plus" ? "plus" : "minus";

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: disabled ? 0.35 : pressed ? 0.7 : 1,
        width: 36,
        height: 36,
        borderRadius: radii.sm,
        backgroundColor: colors.pepsiBlue,
        alignItems: "center",
        justifyContent: "center",
        borderCurve: "continuous"
      })}
    >
      <MaterialCommunityIcons name={iconName} color={colors.surface} size={18} />
    </Pressable>
  );
}
