import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useMemo, useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";

import { EmptyState } from "@/components/empty-state";
import { OperationLock } from "@/components/operation-lock";
import { ScreenSection } from "@/components/screen-section";
import { ShopCard } from "@/components/shop-card";
import { colors, radii, spacing } from "@/constants/theme";
import { useCurrentLocation } from "@/hooks/use-current-location";
import { getShops, markShopVisit, searchShops } from "@/services/supabase-queries";
import { Shop } from "@/types/domain";
import { distanceMeters, isInsideVisitRadius } from "@/utils/geo";

export default function ShopsScreen() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const { location, error, refresh } = useCurrentLocation();

  const shopsQuery = useQuery({
    queryKey: ["shops"],
    queryFn: getShops,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false
  });

  useFocusEffect(
    useMemo(
      () => {
        shopsQuery.refetch();
        return () => {};
      },
      [shopsQuery]
    )
  );

  const searchQuery = useQuery({
    queryKey: ["shops", "search", search],
    queryFn: () => searchShops(search),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    enabled: search.trim().length > 0
  });

  const isSearching = search.trim().length > 0;
  const isLoading = isSearching ? searchQuery.isLoading : shopsQuery.isLoading;

  const sortedShops = useMemo(() => {
    const displayShops = isSearching ? searchQuery.data ?? [] : shopsQuery.data ?? [];
    const shops = displayShops;
    if (!location) {
      return [...shops].sort((a, b) => a.name.localeCompare(b.name));
    }

    return [...shops].sort((a, b) => distanceMeters(location, a) - distanceMeters(location, b));
  }, [isSearching, searchQuery.data, shopsQuery.data, location]);

  const visitMutation = useMutation({
    mutationFn: (shop: Shop) => markShopVisit(shop.id),
    onSuccess: async () => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Visit marked", "The shop visit has been recorded.");
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
    onError: (mutationError) => {
      Alert.alert("Visit not recorded", mutationError instanceof Error ? mutationError.message : "Could not mark this visit.");
    }
  });

  return (
    <OperationLock>
    <View style={{ flex: 1 }}>
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={() => {
            if (isSearching) {
              searchQuery.refetch();
            } else {
              shopsQuery.refetch();
            }
            refresh();
          }}
        />
      }
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: 168, gap: spacing.lg }}
    >
      <View style={{ gap: spacing.sm }}>
        <Text selectable style={{ color: colors.text, fontSize: 28, fontWeight: "800" }}>
          Onboarded shops
        </Text>
        <Text selectable style={{ color: colors.muted, fontSize: 15, lineHeight: 22 }}>
          Sales actions unlock only when the rep is within the configured visit radius.
        </Text>
      </View>

      <View style={{ gap: spacing.xs }}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search shops by name, region or owner"
          placeholderTextColor={colors.muted}
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: radii.md,
            padding: spacing.md,
            color: colors.text,
            borderCurve: "continuous"
          }}
        />
      </View>

      {error ? <Text selectable style={{ color: colors.danger }}>{error}</Text> : null}

      <ScreenSection title="Nearby outlets">
        {sortedShops.length ? (
          sortedShops.map((shop) => (
            <ShopCard
              key={shop.id}
              shop={shop}
              location={location}
              onSell={(selectedShop) => router.push({ pathname: "/sell", params: { shopId: selectedShop.id } })}
              onVisit={(selectedShop) => {
                if (!location) {
                  Alert.alert("Location required", "Refresh GPS before marking a shop visit.");
                  return;
                }

                const geofence = isInsideVisitRadius(location, selectedShop);
                if (!geofence.inside) {
                  Alert.alert("Move closer", `You are ${Math.round(geofence.distanceMeters)}m away. Required radius: ${geofence.radiusMeters}m.`);
                  return;
                }

                visitMutation.mutate(selectedShop);
              }}
            />
          ))
        ) : (
          <EmptyState title="No shops found" body="Onboarded shops will appear here." />
        )}
      </ScreenSection>
    </ScrollView>
    <Pressable
      onPress={() => router.push("/new-shop")}
      style={({ pressed }) => ({
        opacity: pressed ? 0.82 : 1,
        position: "absolute",
        alignSelf: "center",
        bottom: 96,
        alignItems: "center",
        gap: spacing.xs
      })}
    >
      <View
        style={{
          width: 58,
          height: 58,
          borderRadius: 29,
          backgroundColor: colors.pepsiBlue,
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 8px 18px rgba(16, 24, 40, 0.18)"
        }}
      >
        <MaterialCommunityIcons name="plus" color={colors.surface} size={30} />
      </View>
      <View style={{ backgroundColor: colors.surface, borderRadius: radii.sm, paddingHorizontal: spacing.sm, paddingVertical: 3 }}>
        <Text style={{ color: colors.text, fontSize: 12, fontWeight: "900" }}>Onboard</Text>
      </View>
    </Pressable>
    </View>
    </OperationLock>
  );
}
