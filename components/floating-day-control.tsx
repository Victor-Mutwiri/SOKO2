import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, Modal, Pressable, Text, View } from "react-native";

import { colors, radii, spacing } from "@/constants/theme";
import { formatDuration } from "@/utils/workday";
import { useWorkSession } from "../providers/work-session-provider";

export function FloatingDayControl() {
  const { session, elapsedMs, canClockIn, clockIn, clockOut, resume } = useWorkSession();
  const [isBusy, setIsBusy] = useState(false);
  const [showStartConfirmation, setShowStartConfirmation] = useState(false);
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
  const [showResumeConfirmation, setShowResumeConfirmation] = useState(false);
  const isActive = session?.status === "active";
  const isPaused = session?.status === "paused";
  const label = isActive ? "Close day" : isPaused ? "Resume" : "Start day";
  const icon = isActive ? "stop-circle-outline" : isPaused ? "play-circle-outline" : "play-circle-outline";

  const handleStartDay = async () => {
    setShowStartConfirmation(false);
    setIsBusy(true);
    try {
      await clockIn();
    } catch (error) {
      Alert.alert("Work day", error instanceof Error ? error.message : "Could not update your work day.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleCloseDay = async () => {
    setShowCloseConfirmation(false);
    setIsBusy(true);
    try {
      await clockOut();
    } catch (error) {
      Alert.alert("Work day", error instanceof Error ? error.message : "Could not update your work day.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleResume = async () => {
    setShowResumeConfirmation(false);
    setIsBusy(true);
    try {
      await resume();
    } catch (error) {
      Alert.alert("Work day", error instanceof Error ? error.message : "Could not update your work day.");
    } finally {
      setIsBusy(false);
    }
  };

  const handlePress = () => {
    if (isActive) {
      setShowCloseConfirmation(true);
    } else if (isPaused) {
      setShowResumeConfirmation(true);
    } else {
      setShowStartConfirmation(true);
    }
  };

  return (
    <>
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

      {/* Start Day Confirmation Modal */}
      <Modal visible={showStartConfirmation} transparent animationType="slide" onRequestClose={() => setShowStartConfirmation(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(16, 24, 40, 0.32)", justifyContent: "flex-end" }}
          onPress={() => setShowStartConfirmation(false)}
        >
          <Pressable
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: radii.lg,
              borderTopRightRadius: radii.lg,
              padding: spacing.lg,
              gap: spacing.md,
              borderCurve: "continuous"
            }}
          >
            <View style={{ width: 48, height: 4, borderRadius: 999, backgroundColor: colors.pepsiBlue, alignSelf: "center", marginBottom: spacing.sm }} />
            <View style={{ gap: spacing.xs }}>
              <Text style={{ color: colors.text, fontSize: 20, fontWeight: "900" }}>Start your day?</Text>
              <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 22 }}>
                Your status will be marked as active and your work timer will start tracking your time.
              </Text>
            </View>

            <View style={{ backgroundColor: colors.blueSoft, borderRadius: radii.md, padding: spacing.md, gap: spacing.xs }}>
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing.sm }}>
                <MaterialCommunityIcons name="information" color={colors.pepsiBlue} size={18} style={{ marginTop: 2 }} />
                <Text style={{ color: colors.pepsiBlue, fontSize: 13, lineHeight: 18, flex: 1 }}>
                  Make sure you are at your first shop location before starting. Your GPS coordinates will be recorded.
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <Pressable
                onPress={() => setShowStartConfirmation(false)}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.82 : 1,
                  flex: 1,
                  minHeight: 52,
                  borderRadius: radii.sm,
                  backgroundColor: colors.background,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: "center",
                  justifyContent: "center",
                  borderCurve: "continuous"
                })}
              >
                <Text style={{ color: colors.text, fontWeight: "800" }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleStartDay}
                disabled={isBusy}
                style={({ pressed }) => ({
                  opacity: isBusy ? 0.6 : pressed ? 0.82 : 1,
                  flex: 1,
                  minHeight: 52,
                  borderRadius: radii.sm,
                  backgroundColor: colors.pepsiBlue,
                  alignItems: "center",
                  justifyContent: "center",
                  borderCurve: "continuous"
                })}
              >
                <Text style={{ color: colors.surface, fontWeight: "800" }}>Start day</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Close Day Confirmation Modal */}
      <Modal visible={showCloseConfirmation} transparent animationType="slide" onRequestClose={() => setShowCloseConfirmation(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(16, 24, 40, 0.32)", justifyContent: "flex-end" }}
          onPress={() => setShowCloseConfirmation(false)}
        >
          <Pressable
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: radii.lg,
              borderTopRightRadius: radii.lg,
              padding: spacing.lg,
              gap: spacing.md,
              borderCurve: "continuous"
            }}
          >
            <View style={{ width: 48, height: 4, borderRadius: 999, backgroundColor: colors.pepsiRed, alignSelf: "center", marginBottom: spacing.sm }} />
            <View style={{ gap: spacing.xs }}>
              <Text style={{ color: colors.text, fontSize: 20, fontWeight: "900" }}>Close your day?</Text>
              <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 22 }}>
                This action will end your work session and close out your day.
              </Text>
            </View>

            <View style={{ backgroundColor: colors.dangerSoft, borderRadius: radii.md, padding: spacing.md, gap: spacing.xs }}>
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing.sm }}>
                <MaterialCommunityIcons name="alert" color={colors.danger} size={18} style={{ marginTop: 2 }} />
                <Text style={{ color: colors.danger, fontSize: 13, lineHeight: 18, flex: 1, fontWeight: "700" }}>
                  You will not be able to start a new day until tomorrow. This action cannot be undone.
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <Pressable
                onPress={() => setShowCloseConfirmation(false)}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.82 : 1,
                  flex: 1,
                  minHeight: 52,
                  borderRadius: radii.sm,
                  backgroundColor: colors.background,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: "center",
                  justifyContent: "center",
                  borderCurve: "continuous"
                })}
              >
                <Text style={{ color: colors.text, fontWeight: "800" }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleCloseDay}
                disabled={isBusy}
                style={({ pressed }) => ({
                  opacity: isBusy ? 0.6 : pressed ? 0.82 : 1,
                  flex: 1,
                  minHeight: 52,
                  borderRadius: radii.sm,
                  backgroundColor: colors.pepsiRed,
                  alignItems: "center",
                  justifyContent: "center",
                  borderCurve: "continuous"
                })}
              >
                <Text style={{ color: colors.surface, fontWeight: "800" }}>{isBusy ? "Closing..." : "Close day"}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Resume Confirmation Modal */}
      <Modal visible={showResumeConfirmation} transparent animationType="slide" onRequestClose={() => setShowResumeConfirmation(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(16, 24, 40, 0.32)", justifyContent: "flex-end" }}
          onPress={() => setShowResumeConfirmation(false)}
        >
          <Pressable
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: radii.lg,
              borderTopRightRadius: radii.lg,
              padding: spacing.lg,
              gap: spacing.md,
              borderCurve: "continuous"
            }}
          >
            <View style={{ width: 48, height: 4, borderRadius: 999, backgroundColor: colors.pepsiBlue, alignSelf: "center", marginBottom: spacing.sm }} />
            <View style={{ gap: spacing.xs }}>
              <Text style={{ color: colors.text, fontSize: 20, fontWeight: "900" }}>Resume your work?</Text>
              <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 22 }}>
                Your work timer will continue from where it was paused.
              </Text>
            </View>

            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <Pressable
                onPress={() => setShowResumeConfirmation(false)}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.82 : 1,
                  flex: 1,
                  minHeight: 52,
                  borderRadius: radii.sm,
                  backgroundColor: colors.background,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: "center",
                  justifyContent: "center",
                  borderCurve: "continuous"
                })}
              >
                <Text style={{ color: colors.text, fontWeight: "800" }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleResume}
                disabled={isBusy}
                style={({ pressed }) => ({
                  opacity: isBusy ? 0.6 : pressed ? 0.82 : 1,
                  flex: 1,
                  minHeight: 52,
                  borderRadius: radii.sm,
                  backgroundColor: colors.pepsiBlue,
                  alignItems: "center",
                  justifyContent: "center",
                  borderCurve: "continuous"
                })}
              >
                <Text style={{ color: colors.surface, fontWeight: "800" }}>Resume</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

