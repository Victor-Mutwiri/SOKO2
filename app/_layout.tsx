import "react-native-url-polyfill/auto";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router/stack";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";

import { colors } from "@/constants/theme";
import { AuthProvider } from "../providers/auth-provider";
import { ThemeProvider, useTheme } from "../providers/theme-provider";
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
      <ThemeProvider>
        <AuthProvider>
          <WorkSessionProvider>
            <RootStack />
          </WorkSessionProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function RootStack() {
  const { resolvedMode } = useTheme();

  return (
    <>
      <StatusBar style={resolvedMode === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerLargeTitle: false,
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background }
        }}
      >
        <Stack.Screen name="sign-in" options={{ title: "Sign in", headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ title: "Notifications", presentation: "card" }} />
        <Stack.Screen name="settings" options={{ title: "Settings", presentation: "card" }} />
        <Stack.Screen name="support" options={{ title: "Contact support", presentation: "card" }} />
      </Stack>
    </>
  );
}
