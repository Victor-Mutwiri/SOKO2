import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useAuth } from "@/providers/auth-provider";
import { useWorkSession } from "@/providers/work-session-provider";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";

import { PrimaryButton } from "@/components/primary-button";
import { colors, radii, spacing } from "@/constants/theme";
import { getActivities, getDashboardSummary, getProducts, getRecentOrders, getShops } from "@/services/supabase-queries";
import { getNotifications } from "@/services/notifications";
import { useAppSetup } from "@/providers/app-setup-provider";
import { useCurrentLocation } from "@/hooks/use-current-location";

const setupSteps = [
  { key: "shops", label: "Fetching shops", queryKey: ["shops"], fn: getShops },
  { key: "products", label: "Fetching products", queryKey: ["products"], fn: getProducts },
  { key: "summary", label: "Loading dashboard summary", queryKey: ["dashboard-summary"], fn: getDashboardSummary },
  { key: "orders", label: "Loading recent orders", queryKey: ["recent-orders"], fn: getRecentOrders },
  { key: "activities", label: "Loading activity feed", queryKey: ["activities"], fn: getActivities },
  { key: "notifications", label: "Checking notifications", queryKey: ["notifications"], fn: getNotifications }
] as const;

type SetupStep = (typeof setupSteps)[number];

export default function SetupScreen() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const params = useLocalSearchParams<{ returnTo?: string }>();
  const { markSetupComplete } = useAppSetup();
  const { user, isLoading: authLoading } = useAuth();
  const { refreshSession } = useWorkSession();
  const { location, error: locationError, isLoading: isLocationLoading } = useCurrentLocation();

  const [currentStep, setCurrentStep] = useState<SetupStep | null>(null);
  const [completedSteps, setCompletedSteps] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(true);
  const [retryIndex, setRetryIndex] = useState(0);

  const returnTo = params.returnTo ? String(params.returnTo) : "/";
  const progress = setupSteps.length ? (completedSteps / setupSteps.length) * 100 : 0;

  const currentLabel = currentStep
    ? currentStep.label
    : isLocationLoading
    ? "Getting your location"
    : "Preparing your route";

  useEffect(() => {
    if (!authLoading && !user) {
      const setupPath = `/setup?returnTo=${encodeURIComponent(returnTo)}`;
      router.replace(`/sign-in?returnTo=${encodeURIComponent(setupPath)}`);
    }
  }, [authLoading, router, returnTo, user]);

  useEffect(() => {
    let isCancelled = false;

    async function runSetup() {
      if (authLoading || !user) return;

      setError(null);
      setIsRunning(true);
      setCurrentStep(null);
      setCompletedSteps(0);

      if (!location && isLocationLoading) {
        return;
      }

      if (!location) {
        if (locationError) {
          throw new Error(locationError);
        }
        throw new Error("Could not fetch your location. Please enable GPS and try again.");
      }

      try {
        await refreshSession();

        for (let index = 0; index < setupSteps.length; index += 1) {
          const step = setupSteps[index];
          if (isCancelled) return;

          setCurrentStep(step);
          await queryClient.prefetchQuery({
          queryKey: step.queryKey,
          queryFn: step.fn,
          staleTime: step.key === "shops" ? Infinity : undefined
        });
          if (isCancelled) return;
          setCompletedSteps(index + 1);
        }

        markSetupComplete();
        router.replace(returnTo);
      } catch (setupError) {
        setError(setupError instanceof Error ? setupError.message : "Unable to sync data.");
      } finally {
        setIsRunning(false);
      }
    }

    runSetup();

    return () => {
      isCancelled = true;
    };
  }, [authLoading, queryClient, isLocationLoading, location, locationError, markSetupComplete, refreshSession, returnTo, router, retryIndex, user]);

  const isComplete = completedSteps === setupSteps.length && !error;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", padding: spacing.lg }}>
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radii.xl,
          padding: spacing.lg,
          gap: spacing.md,
          borderWidth: 1,
          borderColor: colors.border,
          borderCurve: "continuous"
        }}
      >
        <View style={{ gap: spacing.sm }}>
          <Text selectable style={{ color: colors.pepsiBlue, fontSize: 13, fontWeight: "900", textTransform: "uppercase" }}>
            Getting you started
          </Text>
          <Text selectable style={{ color: colors.text, fontSize: 28, fontWeight: "900" }}>
            Preparing your route
          </Text>
          <Text selectable style={{ color: colors.muted, fontSize: 15, lineHeight: 22 }}>
            We are syncing your shops, products, orders, activity and notifications so the app is ready to use immediately.
          </Text>
        </View>

        <View style={{ backgroundColor: colors.border, height: 10, borderRadius: radii.sm, overflow: "hidden" }}>
          <View
            style={{
              width: `${progress}%`,
              height: 10,
              backgroundColor: colors.pepsiBlue
            }}
          />
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text selectable style={{ color: colors.text, fontWeight: "700" }}>
            {currentLabel}
          </Text>
          <Text selectable style={{ color: colors.muted }}>{Math.round(progress)}%</Text>
        </View>

        {error ? (
          <View style={{ gap: spacing.sm }}>
            <Text selectable style={{ color: colors.danger, fontWeight: "700" }}>
              {error}
            </Text>
            <PrimaryButton
              label="Try again"
              icon="reload"
              onPress={() => {
                setCompletedSteps(0);
                setCurrentStep(null);
                setError(null);
                setRetryIndex((count) => count + 1);
              }}
            />
          </View>
        ) : null}

        {isRunning ? (
          <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }}>
            <ActivityIndicator color={colors.pepsiBlue} />
            <Text selectable style={{ color: colors.muted }}>Syncing your app data...</Text>
          </View>
        ) : isComplete ? (
          <Pressable onPress={() => router.replace(returnTo)}>
            <Text style={{ color: colors.pepsiBlue, fontWeight: "800" }}>Continue</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
