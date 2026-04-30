import * as Location from "expo-location";
import { useCallback, useEffect, useState } from "react";

import { Coordinates } from "@/types/domain";

export function useCurrentLocation() {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== "granted") {
      setError("Location permission is required for geo-locked shop actions.");
      setIsLoading(false);
      return;
    }

    try {
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });
      setLocation({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude
      });
    } catch {
      setError("Could not read GPS location. Check device location settings and try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { location, error, isLoading, refresh };
}
