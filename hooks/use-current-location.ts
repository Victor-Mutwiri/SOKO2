import * as Location from "expo-location";
import { useCallback, useEffect, useState } from "react";

import { getStoredLocation, saveLocation } from "@/services/location-session";
import { Coordinates } from "@/types/domain";

export function useCurrentLocation(options?: { refreshOnMount?: boolean }) {
  console.log("useCurrentLocation: Hook initialized");
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    console.log("useCurrentLocation: Refresh called");
    setIsLoading(true);
    setError(null);

    const storedLocation = await getStoredLocation();
    console.log("useCurrentLocation: Stored location loaded:", storedLocation ? "yes" : "no");
    if (storedLocation) {
      setLocation(storedLocation);
    }

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
      const coords = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude
      };
      setLocation(coords);
      await saveLocation(coords);
    } catch (fetchError) {
      if (storedLocation) {
        setError("Unable to refresh GPS. Using last known location.");
      } else {
        const message = fetchError instanceof Error ? fetchError.message : "Unable to read GPS location.";
        setError(`Could not read GPS location. ${message}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log("useCurrentLocation: useEffect triggered, refreshOnMount:", options?.refreshOnMount ?? true);
    if (options?.refreshOnMount ?? true) {
      refresh();
    } else {
      const loadStored = async () => {
        console.log("useCurrentLocation: Loading stored location");
        const storedLocation = await getStoredLocation();
        console.log("useCurrentLocation: Stored location result:", storedLocation ? "available" : "not available");
        if (storedLocation) setLocation(storedLocation);
        setIsLoading(false);
      };
      loadStored();
    }
  }, [options?.refreshOnMount, refresh]);

  return { location, error, isLoading, refresh };
}
