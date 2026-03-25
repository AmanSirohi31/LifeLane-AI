import { Location } from '../models/types';

export const calculateDistance = (loc1: Location, loc2: Location): number => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (loc1.lat * Math.PI) / 180;
  const φ2 = (loc2.lat * Math.PI) / 180;
  const Δφ = ((loc2.lat - loc1.lat) * Math.PI) / 180;
  const Δλ = ((loc2.lng - loc1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

export const calculateBearing = (loc1: Location, loc2: Location): number => {
  const φ1 = (loc1.lat * Math.PI) / 180;
  const φ2 = (loc2.lat * Math.PI) / 180;
  const λ1 = (loc1.lng * Math.PI) / 180;
  const λ2 = (loc2.lng * Math.PI) / 180;

  const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
  const θ = Math.atan2(y, x);
  
  return ((θ * 180) / Math.PI + 360) % 360; // Bearing in degrees [0, 360)
};

export const isAhead = (
  ambulanceLoc: Location,
  ambulanceHeading: number,
  targetLoc: Location,
  thresholdDegrees: number = 90
): boolean => {
  const bearing = calculateBearing(ambulanceLoc, targetLoc);
  let diff = Math.abs(bearing - ambulanceHeading);
  if (diff > 180) diff = 360 - diff;
  
  return diff <= thresholdDegrees;
};
