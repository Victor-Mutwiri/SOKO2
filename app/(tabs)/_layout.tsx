import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { colors } from "@/constants/theme";
import { useAuth } from "../../providers/auth-provider";

export default function TabsLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.pepsiBlue} />
      </View>
    );
  }

  if (!user) return <Redirect href="/sign-in" />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.pepsiBlue,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 82,
          paddingBottom: 16,
          paddingTop: 8
        },
        headerStyle: { backgroundColor: colors.surface },
        headerShadowVisible: false
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="view-dashboard-outline" color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="shops"
        options={{
          title: "Shops",
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="map-marker-radius-outline" color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="sell"
        options={{
          title: "Sell",
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="cart-outline" color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="new-shop"
        options={{
          title: "Onboard",
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="plus-circle-outline" color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: "Activity",
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="history" color={color} size={size} />
        }}
      />
    </Tabs>
  );
}
