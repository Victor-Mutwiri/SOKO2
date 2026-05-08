import { ScrollView, Text, View } from "react-native";

import { colors, radii, spacing } from "@/constants/theme";
import { useAuth } from "../providers/auth-provider";
import { useWorkSession } from "../providers/work-session-provider";
import { formatDuration } from "@/utils/workday";

export default function SettingsScreen() {
  const { user } = useAuth();
  const { session, elapsedMs } = useWorkSession();

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
      <View style={{ gap: spacing.sm }}>
        <Text selectable style={{ color: colors.text, fontSize: 28, fontWeight: "900" }}>
          Settings
        </Text>
        <Text selectable style={{ color: colors.muted, lineHeight: 22 }}>
          Account and work-session details for this device.
        </Text>
      </View>

      <InfoPanel
        title="Signed in user"
        rows={[
          ["Name", `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()],
          ["Email", user?.email ?? "Not available"],
          ["Phone", user?.phone ?? "Not available"],
          ["Role", user?.position ?? "Not available"]
        ]}
      />

      <InfoPanel
        title="Work session"
        rows={[
          ["Status", session?.status.replaceAll("_", " ") ?? "clocked out"],
          ["Working time", formatDuration(elapsedMs)],
          ["Clocked in", session?.clockedInAt ? new Date(session.clockedInAt).toLocaleString("en-KE") : "Not clocked in"]
        ]}
      />
    </ScrollView>
  );
}

function InfoPanel({ title, rows }: { title: string; rows: Array<[string, string]> }) {
  return (
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
        {title}
      </Text>
      {rows.map(([label, value]) => (
        <View key={label} style={{ flexDirection: "row", justifyContent: "space-between", gap: spacing.md }}>
          <Text selectable style={{ color: colors.muted, flex: 1 }}>
            {label}
          </Text>
          <Text selectable style={{ color: colors.text, flex: 1, textAlign: "right", fontWeight: "800" }}>
            {value}
          </Text>
        </View>
      ))}
    </View>
  );
}
