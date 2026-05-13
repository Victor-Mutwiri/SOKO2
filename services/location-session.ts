import AsyncStorage from "@react-native-async-storage/async-storage";

import { Coordinates } from "@/types/domain";

const LOCATION_STORAGE_KEY = "sbc_last_location";

export async function getStoredLocation(): Promise<Coordinates | null> {
  const value = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
  if (!value) return null;

  try {
    return JSON.parse(value) as Coordinates;
  } catch {
    await AsyncStorage.removeItem(LOCATION_STORAGE_KEY);
    return null;
  }
}

export async function saveLocation(location: Coordinates | null) {
  if (!location) {
    await AsyncStorage.removeItem(LOCATION_STORAGE_KEY);
    return;
  }

  await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
}
