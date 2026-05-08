import "react-native-url-polyfill/auto";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router/stack";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";

import { colors } from "@/constants/theme";
import { AuthProvider } from "../providers/auth-provider";
import { WorkSessionProvider } from "../providers/work-session-provider";

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 3,
            retry: 2
          }
        }
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WorkSessionProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerLargeTitle: false,
              headerStyle: { backgroundColor: colors.surface },
              headerShadowVisible: false,
              contentStyle: { backgroundColor: colors.background }
            }}
          >
            <Stack.Screen name="sign-in" options={{ title: "Sign in", headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="notifications" options={{ title: "Notifications", presentation: "card" }} />
            <Stack.Screen name="settings" options={{ title: "Settings", presentation: "card" }} />
          </Stack>
        </WorkSessionProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
