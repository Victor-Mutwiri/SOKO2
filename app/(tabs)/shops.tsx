import { MaterialCommunityIcons } from "@expo/vector-icons";
import { type UseQueryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useCallback, useMemo, useState } from "react";
import { Alert, FlatList, Pressable, Text, TextInput, View } from "react-native";

import { EmptyState } from "@/components/empty-state";
import { OperationLock } from "@/components/operation-lock";
import { ShopCard } from "@/components/shop-card";
import { colors, radii, spacing } from "@/constants/theme";
import { useCurrentLocation } from "@/hooks/use-current-location";
import { getShops, markShopVisit, searchShops } from "@/services/supabase-queries";
import { Shop } from "@/types/domain";
import { distanceMeters, isInsideVisitRadius } from "@/utils/geo";

export default function ShopsScreen() {
  console.log("ShopsScreen: Component mounting");
  const queryClient = useQueryClient();
  console.log("ShopsScreen: Cached shops data length:", queryClient.getQueryData<Shop[]>(["shops"])?.length || 0);
  const [search, setSearch] = useState("");
  const { location, error } = useCurrentLocation({ refreshOnMount: false });

  const shopsQuery = useQuery<Shop[], Error>({
    queryKey: ["shops"],
    queryFn: getShops,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    onSuccess: (data: Shop[]) => {
      console.log("ShopsScreen: shopsQuery onSuccess, data length:", data.length);
    },
    onError: (queryError: unknown) => {
      console.log("ShopsScreen: shopsQuery onError:", queryError);
    }
  } as UseQueryOptions<Shop[], Error>);

  const searchQuery = useQuery<Shop[], Error>({
    queryKey: ["shops", "search", search],
    queryFn: () => searchShops(search),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    enabled: search.trim().length > 0
  } as UseQueryOptions<Shop[], Error>);

  const isSearching = search.trim().length > 0;
  const isLoading = isSearching ? searchQuery.isLoading : shopsQuery.isLoading;

  console.log("ShopsScreen: isLoading:", isLoading, "isSearching:", isSearching);

  const sortedShops = useMemo(() => {
    console.time("ShopsScreen: Sorting shops");
    const displayShops = (isSearching ? searchQuery.data : shopsQuery.data) ?? [];
    const shops = displayShops as Shop[];
    console.log("ShopsScreen: Display shops length:", shops.length);
    if (!location) {
      const sorted = [...shops].sort((a, b) => a.name.localeCompare(b.name));
      console.timeEnd("ShopsScreen: Sorting shops");
      return sorted;
    }

    const sorted = [...shops].sort((a, b) => distanceMeters(location, a) - distanceMeters(location, b));
    console.timeEnd("ShopsScreen: Sorting shops");
    return sorted;
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

  const handleSell = useCallback((selectedShop: Shop) => {
    router.push({ pathname: "/sell", params: { shopId: selectedShop.id } });
  }, []);

  const handleVisit = useCallback(
    (selectedShop: Shop) => {
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
    },
    [location, visitMutation]
  );

  const renderShop = useCallback(
    ({ item }: { item: Shop }) => (
      <ShopCard shop={item} location={location} onSell={handleSell} onVisit={handleVisit} />
    ),
    [handleSell, handleVisit, location]
  );

  const listHeader = (
    <>
      <View style={{ gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.lg }}>
        <Text selectable style={{ color: colors.text, fontSize: 28, fontWeight: "800" }}>
          Onboarded shops
        </Text>
        <Text selectable style={{ color: colors.muted, fontSize: 15, lineHeight: 22 }}>
          Sales actions unlock only when the rep is within the configured visit radius.
        </Text>
      </View>

      <View style={{ gap: spacing.xs, paddingHorizontal: spacing.lg, paddingTop: spacing.lg }}>
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

      {error ? (
        <Text selectable style={{ color: colors.danger, paddingHorizontal: spacing.lg, paddingTop: spacing.sm }}>
          {error}
        </Text>
      ) : null}

      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm }}>
        <Text selectable style={{ color: colors.text, fontSize: 20, fontWeight: "800" }}>
          Nearby outlets
        </Text>
      </View>
    </>
  );

  return (
    <OperationLock>
      <View style={{ flex: 1 }}>
        <FlatList
          data={sortedShops}
          keyExtractor={(shop) => shop.id}
          renderItem={renderShop}
          refreshing={isLoading}
          onRefresh={() => {
            router.push("/setup?returnTo=/shops");
          }}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{ paddingBottom: 168 }}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg }}>
              <EmptyState title="No shops found" body="Onboarded shops will appear here." />
            </View>
          }
          ListFooterComponent={<View style={{ height: 120 }} />}
          initialNumToRender={10}
          maxToRenderPerBatch={15}
          windowSize={11}
        />

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
