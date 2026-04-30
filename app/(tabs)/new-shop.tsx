import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Alert, ScrollView, Text, TextInput, View } from "react-native";

import { PrimaryButton } from "@/components/primary-button";
import { colors, radii, spacing } from "@/constants/theme";
import { useCurrentLocation } from "@/hooks/use-current-location";
import { createShop } from "@/services/supabase-queries";

export default function NewShopScreen() {
  const queryClient = useQueryClient();
  const { location, error, refresh } = useCurrentLocation();
  const [name, setName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      createShop({
        name,
        ownerName,
        phone,
        region,
        latitude: location?.latitude ?? 0,
        longitude: location?.longitude ?? 0
      }),
    onSuccess: async () => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setName("");
      setOwnerName("");
      setPhone("");
      setRegion("");
      Alert.alert("Shop onboarded", "The shop has been submitted for activation.");
      queryClient.invalidateQueries({ queryKey: ["shops"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    }
  });

  const canSubmit = Boolean(name.trim() && phone.trim() && region.trim() && location && !mutation.isPending);

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
      <View style={{ gap: spacing.sm }}>
        <Text selectable style={{ color: colors.text, fontSize: 28, fontWeight: "800" }}>
          Onboard shop
        </Text>
        <Text selectable style={{ color: colors.muted, fontSize: 15, lineHeight: 22 }}>
          Capture outlet details at the shop location. GPS coordinates are saved with the new outlet.
        </Text>
      </View>

      <Field label="Shop name" value={name} onChangeText={setName} placeholder="e.g. Kimani Mini Mart" />
      <Field label="Owner or contact" value={ownerName} onChangeText={setOwnerName} placeholder="Contact name" />
      <Field label="Phone number" value={phone} onChangeText={setPhone} placeholder="+254..." keyboardType="phone-pad" />
      <Field label="Region" value={region} onChangeText={setRegion} placeholder="Nairobi East" />

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
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "phone-pad";
};

function Field({ label, value, onChangeText, placeholder, keyboardType = "default" }: FieldProps) {
  return (
    <View style={{ gap: spacing.xs }}>
      <Text selectable style={{ color: colors.text, fontWeight: "800" }}>
        {label}
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
