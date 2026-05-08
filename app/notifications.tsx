import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshControl, ScrollView, Text, View } from "react-native";

import { EmptyState } from "@/components/empty-state";
import { PrimaryButton } from "@/components/primary-button";
import { colors, radii, spacing } from "@/constants/theme";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "@/services/notifications";
import { SalesNotification } from "@/types/domain";
import { formatDateTime } from "@/utils/format";

export default function NotificationsScreen() {
  const queryClient = useQueryClient();
  const notificationsQuery = useQuery({ queryKey: ["notifications"], queryFn: getNotifications });
  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });

  const notifications = notificationsQuery.data ?? [];
  const unreadCount = notifications.filter((notification) => !notification.readAt).length;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl refreshing={notificationsQuery.isFetching} onRefresh={() => notificationsQuery.refetch()} />}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
    >
      <View style={{ gap: spacing.sm }}>
        <Text selectable style={{ color: colors.text, fontSize: 28, fontWeight: "900" }}>
          Notifications
        </Text>
        <Text selectable style={{ color: colors.muted, lineHeight: 22 }}>
          Manager updates, route notes, and important sales instructions will appear here.
        </Text>
      </View>

      {unreadCount > 0 ? (
        <PrimaryButton
          label={markAllMutation.isPending ? "Marking..." : `Mark ${unreadCount} read`}
          icon="check"
          variant="secondary"
          disabled={markAllMutation.isPending}
          onPress={() => markAllMutation.mutate()}
        />
      ) : null}

      <View style={{ gap: spacing.md }}>
        {notifications.length ? (
          notifications.map((notification) => <NotificationCard key={notification.id} notification={notification} />)
        ) : (
          <EmptyState title="No notifications" body="You are all caught up. New manager messages will show here." />
        )}
      </View>
    </ScrollView>
  );
}

function NotificationCard({ notification }: { notification: SalesNotification }) {
  const queryClient = useQueryClient();
  const isUnread = !notification.readAt;
  const mutation = useMutation({
    mutationFn: () => markNotificationRead(notification.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });

  return (
    <View
      style={{
        backgroundColor: isUnread ? colors.blueSoft : colors.surface,
        borderColor: isUnread ? colors.pepsiBlue : colors.border,
        borderWidth: 1,
        borderRadius: radii.md,
        padding: spacing.md,
        gap: spacing.sm,
        borderCurve: "continuous"
      }}
    >
      <View style={{ flexDirection: "row", gap: spacing.md }}>
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: colors.surface,
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <MaterialCommunityIcons name={isUnread ? "bell-badge-outline" : "bell-check-outline"} color={isUnread ? colors.pepsiBlue : colors.muted} size={20} />
        </View>
        <View style={{ flex: 1, gap: spacing.xs }}>
          <Text selectable style={{ color: colors.text, fontSize: 16, fontWeight: "900" }}>
            {notification.title}
          </Text>
          <Text selectable style={{ color: colors.muted, lineHeight: 20 }}>
            {notification.body}
          </Text>
          <Text selectable style={{ color: colors.muted, fontSize: 12 }}>
            {formatDateTime(notification.createdAt)}
          </Text>
        </View>
      </View>

      {isUnread ? (
        <PrimaryButton
          label={mutation.isPending ? "Updating..." : "Mark read"}
          icon="check"
          variant="secondary"
          disabled={mutation.isPending}
          onPress={() => mutation.mutate()}
        />
      ) : null}
    </View>
  );
}
