import { useState } from "react";
import { Redirect, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, KeyboardAvoidingView, Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { PrimaryButton } from "@/components/primary-button";
import { colors, radii, spacing } from "@/constants/theme";
import { useAuth } from "../providers/auth-provider";

export default function SignInScreen() {
  const { signIn, isLoading, user } = useAuth();
  const params = useLocalSearchParams<{ returnTo?: string }>();
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const returnTo = params.returnTo ? String(params.returnTo) : "/";

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.pepsiBlue} />
      </View>
    );
  }

  if (user) return <Redirect href={returnTo} />;

  const canSubmit = Boolean(username.trim() && code.trim() && !isSubmitting);

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await signIn(username, code, returnTo);
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : "Could not sign in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior="padding">
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ flexGrow: 1, padding: spacing.lg, justifyContent: "center" }}>
        <View style={{ gap: spacing.xl }}>
          <View style={{ gap: spacing.sm }}>
            <Text selectable style={{ color: colors.pepsiBlue, fontSize: 14, fontWeight: "900", textTransform: "uppercase" }}>
              SBC Sales
            </Text>
            <Text selectable style={{ color: colors.text, fontSize: 32, fontWeight: "900" }}>
              Sign in to your route
            </Text>
            <Text selectable style={{ color: colors.muted, fontSize: 15, lineHeight: 22 }}>
              Use your registered email or phone number and the access code assigned in the dashboard.
            </Text>
          </View>

          <View
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: radii.md,
              padding: spacing.lg,
              gap: spacing.md,
              borderCurve: "continuous"
            }}
          >
            <Field
              label="Email or phone"
              value={username}
              onChangeText={setUsername}
              placeholder="email@sbc.co.ke or 254..."
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Field
              label="Access code"
              value={code}
              onChangeText={setCode}
              placeholder="Enter code"
              keyboardType="number-pad"
              secureTextEntry
            />

            {error ? (
              <Text selectable style={{ color: colors.danger, lineHeight: 20 }}>
                {error}
              </Text>
            ) : null}

            <PrimaryButton label={isSubmitting ? "Checking..." : "Sign in"} icon="check" disabled={!canSubmit} onPress={handleSubmit} />
          </View>

          <Pressable>
            <Text selectable style={{ color: colors.muted, textAlign: "center", lineHeight: 20 }}>
              Suspended users cannot access the mobile app.
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "email-address" | "number-pad";
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
};

function Field({ label, value, onChangeText, placeholder, keyboardType = "default", secureTextEntry, autoCapitalize }: FieldProps) {
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
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        style={{
          backgroundColor: colors.background,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: radii.sm,
          minHeight: 52,
          paddingHorizontal: spacing.md,
          color: colors.text,
          borderCurve: "continuous"
        }}
      />
    </View>
  );
}
