import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, router } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, radii, spacing } from "@/constants/theme";
import { getUnreadNotificationCount } from "@/services/notifications";
import { useAuth } from "../providers/auth-provider";

export function AppTopBar() {
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const notificationsQuery = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: getUnreadNotificationCount,
    refetchInterval: 1000 * 60
  });
  const unreadCount = notificationsQuery.data ?? 0;

  const refresh = async () => {
    await queryClient.invalidateQueries();
    setMenuOpen(false);
  };

  return (
    <>
      <View
        style={{
          paddingTop: insets.top + spacing.sm,
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.sm,
          backgroundColor: colors.background,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <Pressable
          accessibilityLabel="Open menu"
          onPress={() => setMenuOpen(true)}
          style={{
            width: 42,
            height: 42,
            borderRadius: radii.sm,
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: 1,
            alignItems: "center",
            justifyContent: "center",
            borderCurve: "continuous"
          }}
        >
          <MaterialCommunityIcons name="menu" color={colors.text} size={24} />
        </Pressable>

        <Text selectable style={{ color: colors.muted, fontSize: 13, fontWeight: "900" }}>
          {user?.position ?? "Sales"}
        </Text>

        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <Pressable accessibilityLabel="Sync latest records" onPress={refresh} style={iconButtonStyle}>
            <MaterialCommunityIcons name="refresh" color={colors.text} size={22} />
          </Pressable>
          <Link href="/notifications" asChild>
            <Pressable accessibilityLabel="Open notifications" style={iconButtonStyle}>
              <MaterialCommunityIcons name="bell-outline" color={colors.text} size={22} />
              {unreadCount > 0 ? (
                <View
                  style={{
                    position: "absolute",
                    top: -5,
                    right: -5,
                    minWidth: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: colors.pepsiRed,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 5
                  }}
                >
                  <Text style={{ color: colors.surface, fontSize: 11, fontWeight: "900", fontVariant: ["tabular-nums"] }}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          </Link>
        </View>
      </View>

      <Modal visible={menuOpen} transparent animationType="slide" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(16, 24, 40, 0.32)" }} onPress={() => setMenuOpen(false)}>
          <Pressable
            style={{
              width: "78%",
              maxWidth: 340,
              minHeight: "100%",
              backgroundColor: colors.surface,
              paddingTop: insets.top + spacing.xl,
              paddingHorizontal: spacing.lg,
              gap: spacing.lg
            }}
          >
            <View style={{ gap: spacing.xs }}>
              <Text selectable style={{ color: colors.text, fontSize: 22, fontWeight: "900" }}>
                {user?.firstName} {user?.lastName}
              </Text>
              <Text selectable style={{ color: colors.muted }}>
                {user?.email}
              </Text>
            </View>

            <View style={{ gap: spacing.sm }}>
              <MenuItem
                icon="cog-outline"
                label="Settings"
                onPress={() => {
                  setMenuOpen(false);
                  router.push("/settings");
                }}
              />
              <MenuItem icon="refresh" label="Refresh" onPress={refresh} />
              <MenuItem
                icon="headset"
                label="Contact support"
                onPress={() => {
                  setMenuOpen(false);
                  router.push("/support");
                }}
              />
              <MenuItem
                icon="logout"
                label="Sign out"
                destructive
                onPress={() => {
                  setMenuOpen(false);
                  signOut();
                }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const iconButtonStyle = {
  width: 42,
  height: 42,
  borderRadius: radii.sm,
  backgroundColor: colors.surface,
  borderColor: colors.border,
  borderWidth: 1,
  alignItems: "center",
  justifyContent: "center",
  borderCurve: "continuous"
} as const;

function MenuItem({
  icon,
  label,
  destructive,
  onPress
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  destructive?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.75 : 1,
        minHeight: 50,
        borderRadius: radii.sm,
        backgroundColor: destructive ? colors.dangerSoft : colors.background,
        paddingHorizontal: spacing.md,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        borderCurve: "continuous"
      })}
    >
      <MaterialCommunityIcons name={icon} color={destructive ? colors.danger : colors.text} size={21} />
      <Text style={{ color: destructive ? colors.danger : colors.text, fontWeight: "800" }}>{label}</Text>
    </Pressable>
  );
}
