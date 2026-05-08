import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, Text, View } from "react-native";

import { colors, radii, spacing } from "@/constants/theme";
import { getWorkdayMessage, formatDuration } from "@/utils/workday";
import { useWorkSession } from "../providers/work-session-provider";

import { PrimaryButton } from "./primary-button";

export function WorkSessionCard() {
  const { session, elapsedMs, canClockIn, clockIn, clockOut, resume } = useWorkSession();
  const [isBusy, setIsBusy] = useState(false);
  const status = session?.status ?? "clocked_out";
  const isPaused = status === "paused";
  const isActive = status === "active";

  const title = isActive ? "Clocked in" : isPaused ? "Paused" : "Rest now";
  const description = isActive
    ? "Your selling day is active. Sales and shop actions are unlocked."
    : isPaused
      ? "Activity was paused after the app stayed inactive for too long."
      : getWorkdayMessage();

  const handleAction = async (action: "clock-in" | "clock-out" | "resume") => {
    setIsBusy(true);
    try {
      if (action === "clock-in") await clockIn();
      if (action === "clock-out") await clockOut();
      if (action === "resume") await resume();
    } catch (error) {
      Alert.alert("Work session", error instanceof Error ? error.message : "Could not update your work session.");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <View
      style={{
        backgroundColor: isActive ? colors.blueSoft : isPaused ? colors.amberSoft : colors.surface,
        borderColor: isActive ? colors.pepsiBlue : isPaused ? colors.amber : colors.border,
        borderWidth: 1,
        borderRadius: radii.md,
        padding: spacing.lg,
        gap: spacing.md,
        borderCurve: "continuous"
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: colors.surface,
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <MaterialCommunityIcons name={isActive ? "clock-check-outline" : isPaused ? "clock-alert-outline" : "weather-night"} color={isActive ? colors.pepsiBlue : isPaused ? colors.amber : colors.muted} size={24} />
        </View>
        <View style={{ flex: 1, gap: spacing.xs }}>
          <Text selectable style={{ color: colors.text, fontSize: 19, fontWeight: "900" }}>
            {title}
          </Text>
          <Text selectable style={{ color: colors.muted, lineHeight: 20 }}>
            {description}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text selectable style={{ color: colors.muted, fontWeight: "800" }}>
          Working time
        </Text>
        <Text selectable style={{ color: colors.text, fontSize: 24, fontWeight: "900", fontVariant: ["tabular-nums"] }}>
          {formatDuration(elapsedMs)}
        </Text>
      </View>

      {isActive ? (
        <PrimaryButton label={isBusy ? "Clocking out..." : "Clock out"} icon="clock-out" variant="secondary" disabled={isBusy} onPress={() => handleAction("clock-out")} />
      ) : isPaused ? (
        <PrimaryButton label={isBusy ? "Resuming..." : "Resume activity"} icon="play" disabled={isBusy} onPress={() => handleAction("resume")} />
      ) : (
        <PrimaryButton label={isBusy ? "Clocking in..." : "Clock in"} icon="clock-in" disabled={!canClockIn || isBusy} onPress={() => handleAction("clock-in")} />
      )}
    </View>
  );
}
