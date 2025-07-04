
// Define the maximum zoom level at which prices should be displayed
// Lower delta values = more zoomed in
const MAX_ZOOM_THRESHOLD = 0.05; // About city district level

export function shouldFetchStationDetail(latitudeDelta: number): boolean {
  // Only fetch prices when zoomed in enough (lower delta = more zoomed in)
  return latitudeDelta <= MAX_ZOOM_THRESHOLD;
}
