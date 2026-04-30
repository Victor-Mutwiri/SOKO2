import { Pressable, ScrollView, Text, View } from "react-native";

import { colors, radii, spacing } from "@/constants/theme";
import { Shop } from "@/types/domain";

type Props = {
  shops: Shop[];
  selectedShop: Shop | null;
  onSelect: (shop: Shop) => void;
};

export function ShopPicker({ shops, selectedShop, onSelect }: Props) {
  return (
    <View style={{ gap: spacing.md }}>
      <Text selectable style={{ color: colors.text, fontSize: 20, fontWeight: "800" }}>
        Select shop
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
        {shops.map((shop) => {
          const isSelected = selectedShop?.id === shop.id;
          return (
            <Pressable
              key={shop.id}
              onPress={() => onSelect(shop)}
              style={({ pressed }) => ({
                opacity: pressed ? 0.82 : 1,
                width: 220,
                backgroundColor: isSelected ? colors.blueSoft : colors.surface,
                borderColor: isSelected ? colors.pepsiBlue : colors.border,
                borderWidth: 1,
                borderRadius: radii.md,
                padding: spacing.md,
                gap: spacing.xs,
                borderCurve: "continuous"
              })}
            >
              <Text selectable style={{ color: colors.text, fontWeight: "900" }}>
                {shop.name}
              </Text>
              <Text selectable style={{ color: colors.muted }}>
                {shop.region}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
