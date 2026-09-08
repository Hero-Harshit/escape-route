import { UserLocation } from '../types/escapeRoute.types';

/**
 * Calculates the straight-line distance between two coordinates in meters
 * using the Haversine formula.
 */
export const calculateDistanceMeters = (
  origin: UserLocation,
  destination: UserLocation
): number => {
  const toRadian = (angle: number) => (Math.PI / 180) * angle;

  const R = 6371e3; // Earth radius in meters
  const dLat = toRadian(destination.latitude - origin.latitude);
  const dLon = toRadian(destination.longitude - origin.longitude);

  const lat1 = toRadian(origin.latitude);
  const lat2 = toRadian(destination.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
};
