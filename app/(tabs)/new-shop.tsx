import { useNavigation, usePreventRemove } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { OperationLock } from "@/components/operation-lock";
import { PrimaryButton } from "@/components/primary-button";
import { colors, radii, spacing } from "@/constants/theme";
import { useCurrentLocation } from "@/hooks/use-current-location";
import { createShop, getShops } from "@/services/supabase-queries";
import { distanceMeters } from "@/utils/geo";

export default function NewShopScreen() {
  const queryClient = useQueryClient();
  const navigation = useNavigation();
  const { location, error, refresh } = useCurrentLocation();
  const shopsQuery = useQuery({
    queryKey: ["shops"],
    queryFn: getShops,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false
  });
  const [name, setName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [hasSaved, setHasSaved] = useState(false);
  const detectedRegion = useMemo(() => {
    if (!location) return null;

    return [...(shopsQuery.data ?? [])]
      .filter((shop) => shop.regionId)
      .sort((a, b) => distanceMeters(location, a) - distanceMeters(location, b))[0] ?? null;
  }, [location, shopsQuery.data]);
  const isDirty = Boolean(name.trim() || ownerName.trim() || phone.trim());

  usePreventRemove(isDirty && !hasSaved, ({ data }) => {
    Alert.alert("Discard shop?", "This shop has not been saved. If you leave now, the onboarding details will be lost.", [
      { text: "Keep editing", style: "cancel" },
      {
        text: "Discard",
        style: "destructive",
        onPress: () => data.action && navigation.dispatch(data.action)
      }
    ]);
  });

  const mutation = useMutation({
    mutationFn: () =>
      createShop({
        name,
        ownerName,
        phone,
        regionId: detectedRegion?.regionId ?? 0,
        latitude: location?.latitude ?? 0,
        longitude: location?.longitude ?? 0
      }),
    onSuccess: async () => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setHasSaved(true);
      setName("");
      setOwnerName("");
      setPhone("");
      Alert.alert("Shop onboarded", "The shop has been submitted for activation.");
      queryClient.invalidateQueries({ queryKey: ["shops"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      router.push("/shops");
    }
  });

  const canSubmit = Boolean(name.trim() && ownerName.trim() && phone.trim() && detectedRegion?.regionId && location && !mutation.isPending);

  return (
    <OperationLock>
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
      <View style={{ gap: spacing.sm }}>
        <Pressable onPress={() => router.push("/shops")} style={{ alignSelf: "flex-start" }}>
          <Text style={{ color: colors.pepsiBlue, fontWeight: "800" }}>← Back to shops</Text>
        </Pressable>
        <Text selectable style={{ color: colors.text, fontSize: 28, fontWeight: "800" }}>
          Onboard shop
        </Text>
        <Text selectable style={{ color: colors.muted, fontSize: 15, lineHeight: 22 }}>
          Capture outlet details at the shop location. GPS coordinates are saved with the new outlet.
        </Text>
      </View>

      <Field label="Shop name" required value={name} onChangeText={setName} placeholder="e.g. Kimani Mini Mart" />
      <Field label="Owner or contact" required value={ownerName} onChangeText={setOwnerName} placeholder="Contact name" />
      <Field label="Phone number" required value={phone} onChangeText={setPhone} placeholder="+254..." keyboardType="phone-pad" />

      <View style={{ gap: spacing.sm }}>
        <Text selectable style={{ color: colors.text, fontWeight: "800" }}>
          Detected region <Text style={{ color: colors.danger }}>*</Text>
        </Text>
        <Text selectable style={{ color: colors.muted, lineHeight: 20 }}>
          Region is assigned from your GPS using the nearest mapped shop, so it cannot be manually changed.
        </Text>
        <View
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: radii.md,
            padding: spacing.md,
            gap: spacing.xs,
            borderCurve: "continuous"
          }}
        >
          <Text selectable style={{ color: colors.text, fontWeight: "900" }}>
            {detectedRegion?.region ?? "Waiting for GPS and nearby shop data"}
          </Text>
          <Text selectable style={{ color: colors.muted }}>
            {detectedRegion && location ? `Based on nearest shop: ${detectedRegion.name} (${Math.round(distanceMeters(location, detectedRegion))}m away)` : "Refresh GPS if this does not resolve."}
          </Text>
        </View>
        {shopsQuery.error ? <Text selectable style={{ color: colors.danger }}>{shopsQuery.error.message}</Text> : null}
      </View>

      <View
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: radii.md,
          padding: spacing.md,
          gap: spacing.xs,
          borderCurve: "continuous"
        }}
      >
        <Text selectable style={{ color: colors.text, fontWeight: "800" }}>
          GPS capture
        </Text>
        <Text selectable style={{ color: colors.muted }}>
          {location ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}` : error ?? "Waiting for location..."}
        </Text>
      </View>

      <PrimaryButton label="Refresh GPS" icon="map-pin" variant="secondary" onPress={refresh} />
      <PrimaryButton
        label={mutation.isPending ? "Submitting..." : "Create shop"}
        icon="check"
        disabled={!canSubmit}
        onPress={() => mutation.mutate()}
      />
      {mutation.error ? <Text selectable style={{ color: colors.danger }}>{mutation.error.message}</Text> : null}
    </ScrollView>
    </OperationLock>
  );
}

type FieldProps = {
  label: string;
  required?: boolean;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "phone-pad";
};

function Field({ label, required, value, onChangeText, placeholder, keyboardType = "default" }: FieldProps) {
  return (
    <View style={{ gap: spacing.xs }}>
      <Text selectable style={{ color: colors.text, fontWeight: "800" }}>
        {label} {required ? <Text style={{ color: colors.danger }}>*</Text> : null}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
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
  );
}
