import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Text, View } from "react-native";

import { colors, radii, spacing } from "@/constants/theme";
import { getWorkdayMessage } from "@/utils/workday";
import { useWorkSession } from "../providers/work-session-provider";
import { PrimaryButton } from "./primary-button";

export function OperationLock({ children }: { children: React.ReactNode }) {
  const { session, isActive } = useWorkSession();

  if (isActive) return children;

  const isPaused = session?.status === "paused";
  const isEnded = session?.status === "auto_clocked_out" || session?.status === "clocked_out";
  const title = isPaused ? "Activity paused" : isEnded ? "Rest time" : "Clock in required";
  const body = isPaused
    ? "We paused your activity because the app was inactive for a while. Resume from the home screen to continue."
    : `${getWorkdayMessage()} Sales actions stay locked to protect your route data.`;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.lg, justifyContent: "center" }}>
      <View
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: radii.md,
          padding: spacing.xl,
          alignItems: "center",
          gap: spacing.md,
          borderCurve: "continuous"
        }}
      >
        <View
          style={{
            width: 54,
            height: 54,
            borderRadius: 27,
            backgroundColor: colors.amberSoft,
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <MaterialCommunityIcons name="lock-clock" color={colors.amber} size={25} />
        </View>
        <Text selectable style={{ color: colors.text, fontSize: 22, fontWeight: "900", textAlign: "center" }}>
          {title}
        </Text>
        <Text selectable style={{ color: colors.muted, textAlign: "center", lineHeight: 21 }}>
          {body}
        </Text>
        <PrimaryButton
          label={isPaused ? "Resume on home" : "Go to home"}
          icon={isPaused ? "play" : "clock-in"}
          onPress={() => router.replace("/")}
          style={{ alignSelf: "stretch" }}
        />
      </View>
    </View>
  );
}
