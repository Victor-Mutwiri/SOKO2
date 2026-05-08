import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { RefreshControl, ScrollView, Text, View } from "react-native";

import { EmptyState } from "@/components/empty-state";
import { OperationLock } from "@/components/operation-lock";
import { PrimaryButton } from "@/components/primary-button";
import { ScreenSection } from "@/components/screen-section";
import { ShopCard } from "@/components/shop-card";
import { colors, spacing } from "@/constants/theme";
import { useCurrentLocation } from "@/hooks/use-current-location";
import { getShops } from "@/services/supabase-queries";

export default function ShopsScreen() {
  const shopsQuery = useQuery({ queryKey: ["shops"], queryFn: getShops });
  const { location, error, refresh } = useCurrentLocation();

  return (
    <OperationLock>
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl refreshing={shopsQuery.isFetching} onRefresh={() => {
          shopsQuery.refetch();
          refresh();
        }} />
      }
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
    >
      <View style={{ gap: spacing.sm }}>
        <Text selectable style={{ color: colors.text, fontSize: 28, fontWeight: "800" }}>
          Mapped shops
        </Text>
        <Text selectable style={{ color: colors.muted, fontSize: 15, lineHeight: 22 }}>
          Sales actions unlock only when the rep is within the configured visit radius.
        </Text>
      </View>

      {error ? <Text selectable style={{ color: colors.danger }}>{error}</Text> : null}

      <Link href="/new-shop" asChild>
        <PrimaryButton label="Onboard new shop" icon="plus" />
      </Link>

      <ScreenSection title="Nearby outlets">
        {shopsQuery.data?.length ? (
          shopsQuery.data.map((shop) => <ShopCard key={shop.id} shop={shop} location={location} />)
        ) : (
          <EmptyState title="No shops found" body="Mapped shops from Supabase will appear here." />
        )}
      </ScreenSection>
    </ScrollView>
    </OperationLock>
  );
}
