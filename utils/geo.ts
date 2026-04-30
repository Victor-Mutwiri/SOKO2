import { Coordinates, Shop } from "@/types/domain";

const DEFAULT_VISIT_RADIUS_METERS = Number(process.env.EXPO_PUBLIC_VISIT_RADIUS_METERS ?? 80);

export function distanceMeters(from: Coordinates, to: Coordinates) {
  const earthRadiusMeters = 6371000;
  const fromLat = toRadians(from.latitude);
  const toLat = toRadians(to.latitude);
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLon = toRadians(to.longitude - from.longitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusMeters * c;
}

export function isInsideVisitRadius(location: Coordinates, shop: Shop) {
  const radiusMeters = shop.visitRadiusMeters ?? DEFAULT_VISIT_RADIUS_METERS;
  const distance = distanceMeters(location, shop);

  return {
    inside: distance <= radiusMeters,
    distanceMeters: distance,
    radiusMeters
  };
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}
