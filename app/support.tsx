import { useMutation } from "@tanstack/react-query";
import * as Linking from "expo-linking";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { PrimaryButton } from "@/components/primary-button";
import { colors, radii, spacing } from "@/constants/theme";
import { submitSupportRequest, SupportPriority, SupportReason } from "@/services/support";

const SUPPORT_PHONE = "0746583509";
const SUPPORT_PHONE_INTERNATIONAL = "254746583509";
const reasons: SupportReason[] = ["Login issue", "Clock-in issue", "Shop location issue", "Order issue", "Product or stock issue", "Other"];
const priorities: SupportPriority[] = ["Urgent", "Important", "Suggestion", "Feedback"];

export default function SupportScreen() {
  const [reason, setReason] = useState<SupportReason>("Clock-in issue");
  const [priority, setPriority] = useState<SupportPriority>("Important");
  const [message, setMessage] = useState("");
  const mutation = useMutation({
    mutationFn: () => submitSupportRequest({ reason, priority, message }),
    onSuccess: () => {
      setMessage("");
      Alert.alert("Support request sent", "Your issue has been submitted.");
    }
  });

  const canSubmit = Boolean(message.trim() && !mutation.isPending);

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
      <View style={{ gap: spacing.sm }}>
        <Text selectable style={{ color: colors.text, fontSize: 28, fontWeight: "900" }}>
          Contact support
        </Text>
        <Text selectable style={{ color: colors.muted, lineHeight: 22 }}>
          Choose a quick contact option or submit an issue for the support team.
        </Text>
      </View>

      <View style={{ flexDirection: "row", gap: spacing.md }}>
        <PrimaryButton label="Call" icon="phone" style={{ flex: 1 }} onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE}`)} />
        <PrimaryButton
          label="WhatsApp"
          icon="whatsapp"
          variant="secondary"
          style={{ flex: 1 }}
          onPress={() => Linking.openURL(`https://wa.me/${SUPPORT_PHONE_INTERNATIONAL}`)}
        />
      </View>

      <View
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: radii.md,
          padding: spacing.md,
          gap: spacing.md,
          borderCurve: "continuous"
        }}
      >
        <Text selectable style={{ color: colors.text, fontSize: 18, fontWeight: "900" }}>
          Submit an issue
        </Text>

        <ChoiceGroup label="Reason" value={reason} options={reasons} onChange={(value) => setReason(value as SupportReason)} />
        <ChoiceGroup label="Classification" value={priority} options={priorities} onChange={(value) => setPriority(value as SupportPriority)} />

        <View style={{ gap: spacing.xs }}>
          <Text selectable style={{ color: colors.text, fontWeight: "800" }}>
            Details
          </Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder={reason === "Other" ? "Explain the issue..." : "Add context for support..."}
            multiline
            style={{
              minHeight: 110,
              backgroundColor: colors.background,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: radii.sm,
              padding: spacing.md,
              color: colors.text,
              textAlignVertical: "top",
              borderCurve: "continuous"
            }}
          />
        </View>

        {mutation.error ? <Text selectable style={{ color: colors.danger }}>{mutation.error.message}</Text> : null}

        <PrimaryButton
          label={mutation.isPending ? "Submitting..." : "Submit issue"}
          icon="send"
          disabled={!canSubmit}
          onPress={() => mutation.mutate()}
        />
      </View>
    </ScrollView>
  );
}

function ChoiceGroup({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <View style={{ gap: spacing.sm }}>
      <Text selectable style={{ color: colors.text, fontWeight: "800" }}>
        {label}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
        {options.map((option) => {
          const isSelected = option === value;
          return (
            <Pressable
              key={option}
              onPress={() => onChange(option)}
              style={{
                minHeight: 40,
                borderRadius: radii.sm,
                paddingHorizontal: spacing.md,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isSelected ? colors.pepsiBlue : colors.background,
                borderColor: isSelected ? colors.pepsiBlue : colors.border,
                borderWidth: 1,
                borderCurve: "continuous"
              }}
            >
              <Text style={{ color: isSelected ? colors.surface : colors.text, fontWeight: "800" }}>{option}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
