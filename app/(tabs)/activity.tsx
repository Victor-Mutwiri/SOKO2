import { useQuery } from "@tanstack/react-query";
import { RefreshControl, ScrollView, Text, View } from "react-native";

import { ActivityRow } from "@/components/activity-row";
import { EmptyState } from "@/components/empty-state";
import { colors, spacing } from "@/constants/theme";
import { getActivities } from "@/services/supabase-queries";

export default function ActivityScreen() {
  const activityQuery = useQuery({
    queryKey: ["activities"],
    queryFn: getActivities,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false
  });

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl refreshing={activityQuery.isFetching} onRefresh={() => activityQuery.refetch()} />}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
    >
      <View style={{ gap: spacing.sm }}>
        <Text selectable style={{ color: colors.text, fontSize: 28, fontWeight: "800" }}>
          Previous activity
        </Text>
        <Text selectable style={{ color: colors.muted, fontSize: 15, lineHeight: 22 }}>
          Orders, visits, onboarding submissions, and geofence events.
        </Text>
      </View>

      {activityQuery.data?.length ? (
        activityQuery.data.map((activity) => <ActivityRow key={activity.id} activity={activity} />)
      ) : (
        <EmptyState title="No activity yet" body="Completed field actions will appear here." />
      )}
    </ScrollView>
  );
}
