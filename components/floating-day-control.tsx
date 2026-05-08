import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

import { colors, radii, spacing } from "@/constants/theme";
import { formatDuration } from "@/utils/workday";
import { useWorkSession } from "../providers/work-session-provider";

export function FloatingDayControl() {
  const { session, elapsedMs, canClockIn, clockIn, clockOut, resume } = useWorkSession();
  const [isBusy, setIsBusy] = useState(false);
  const isActive = session?.status === "active";
  const isPaused = session?.status === "paused";
  const label = isActive ? "End day" : isPaused ? "Resume" : "Start day";
  const icon = isActive ? "stop-circle-outline" : isPaused ? "play-circle-outline" : "play-circle-outline";

  const handlePress = async () => {
    setIsBusy(true);
    try {
      if (isActive) await clockOut();
      else if (isPaused) await resume();
      else await clockIn();
    } catch (error) {
      Alert.alert("Work day", error instanceof Error ? error.message : "Could not update your work day.");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        right: spacing.lg,
        bottom: 96,
        alignItems: "flex-end"
      }}
    >
      <Pressable
        disabled={isBusy || (!isActive && !isPaused && !canClockIn)}
        onPress={handlePress}
        style={({ pressed }) => ({
          opacity: isBusy || (!isActive && !isPaused && !canClockIn) ? 0.5 : pressed ? 0.82 : 1,
          minHeight: 54,
          borderRadius: radii.lg,
          paddingHorizontal: spacing.md,
          backgroundColor: isActive ? colors.pepsiRed : colors.pepsiBlue,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          borderCurve: "continuous",
          boxShadow: "0 8px 18px rgba(16, 24, 40, 0.18)"
        })}
      >
        <MaterialCommunityIcons name={icon} color={colors.surface} size={22} />
        <View>
          <Text style={{ color: colors.surface, fontWeight: "900" }}>{isBusy ? "Updating..." : label}</Text>
          <Text style={{ color: colors.surface, fontSize: 12, opacity: 0.85, fontVariant: ["tabular-nums"] }}>
            {formatDuration(elapsedMs)}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}
