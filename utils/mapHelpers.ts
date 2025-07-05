import { ChargingStation } from '@/api/converters';
import { Dimensions } from 'react-native';
import { Region } from 'react-native-maps';

// Define the maximum zoom level at which prices should be displayed
// Lower delta values = more zoomed in
const MAX_ZOOM_THRESHOLD = 0.05; // About city district level

export function shouldFetchStationDetail(latitudeDelta: number): boolean {
  // Only fetch prices when zoomed in enough (lower delta = more zoomed in)
  return latitudeDelta <= MAX_ZOOM_THRESHOLD;
}

/**
 * Checks if a station is visible within the current map region
 */
export function isStationInRegion(station: ChargingStation, region: Region | undefined): boolean {
  if (!region || !station) return false;

  // Calculate the boundaries of the current viewport
  const northLat = region.latitude + region.latitudeDelta / 2;
  const southLat = region.latitude - region.latitudeDelta / 2;

  const adjustedEastLng = region.longitude + (region.longitudeDelta / 2);
  const adjustedWestLng = region.longitude - (region.longitudeDelta / 2);

  // Check if station is within these boundaries
  return (
    station.coordinates.latitude <= northLat &&
    station.coordinates.latitude >= southLat &&
    station.coordinates.longitude <= adjustedEastLng &&
    station.coordinates.longitude >= adjustedWestLng
  );
}

/**
 * Calculates appropriate latitude and longitude deltas for a city district level of zoom
 * based on the application window dimensions.
 *
 * @returns Region deltas suitable for city district level zoom
 */
export function getDistrictLevelDeltas(width: number, height: number): { latitudeDelta: number, longitudeDelta: number } {
  // Base delta values calibrated for city district view
  // Use a slightly smaller delta than the threshold to ensure we're comfortably within the detail view
  const baseLatDelta = MAX_ZOOM_THRESHOLD * 0.75;

  const aspectRatio = width / height;
  const longitudeDelta = baseLatDelta * aspectRatio;

  return {
    latitudeDelta: baseLatDelta,
    longitudeDelta
  };
}

// Cache for deltas to avoid recalculating on every render
let deltaCache: {
  width: number;
  height: number;
  deltas: { latitudeDelta: number; longitudeDelta: number };
} | null = null;

/**
 * Returns district level deltas for the current window size with caching
 * to avoid recalculations on every render. Automatically reads window dimensions.
 *
 * @returns Cached or newly calculated region deltas
 */
export function getDistrictLevelDeltasForWindow(): { latitudeDelta: number; longitudeDelta: number } {
  // Get current window dimensions
  const { width, height } = Dimensions.get('window');

  // Return cached value if dimensions haven't changed
  if (deltaCache && deltaCache.width === width && deltaCache.height === height) {
    return deltaCache.deltas;
  }

  // Calculate new deltas
  const deltas = getDistrictLevelDeltas(width, height);

  // Cache the result
  deltaCache = {
    width,
    height,
    deltas
  };

  return deltas;
}
