import { ChargingStation } from '@/api/converters';
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
