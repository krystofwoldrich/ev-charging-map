import { ChargingStation, convertPlugsurfingToChargingStation } from '@/api/converters';
import { fetchChargingLocations } from '@/api/plugsurfing';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Region } from 'react-native-maps';

// Maximum number of stations to keep in memory
const MAX_STATIONS = 200;

/**
 * Custom hook to fetch and manage charging stations with a limit on the maximum number stored.
 * When the number of stations exceeds MAX_STATIONS, the oldest stations are removed first.
 *
 * @param region The current map region to fetch stations for
 * @returns Object containing charging stations array and loading/error states
 */
export const useChargingStations = (region: Region | undefined) => {
  const queryClient = useQueryClient();

  // This query fetches data for the current region and merges it into a master list
  const { isLoading, error, isError } = useQuery({
    // The queryKey includes the region, so it refetches when the map moves
    queryKey: ['chargingStations', region],
    queryFn: async () => {
      if (!region) return [];

      const locations = await fetchChargingLocations(region);
      const newStations = convertPlugsurfingToChargingStation(locations);

      // Manually update the master list in the cache
      queryClient.setQueryData<Record<string, ChargingStation>>(['allStations'], (oldData) => {
        const stationRecord = oldData || {};

        // Add or update stations from the new batch
        newStations.forEach(station => {
          // Check if we already have detailed pricing info for this station
          const existingStation = stationRecord[station.id];
          const stationWithTimestamp = {
            ...station,
            // Preserve existing price info if available
            ...(existingStation?.hasPriceInfo && {
              price: existingStation.price,
              currency: existingStation.currency,
              priceType: existingStation.priceType,
              hasPriceInfo: existingStation.hasPriceInfo,
            }),
            lastUpdated: Date.now(),
          };
          stationRecord[station.id] = stationWithTimestamp;
        });

        // If we exceed the maximum number of stations, remove the oldest ones
        const stationCount = Object.keys(stationRecord).length;
        if (stationCount > MAX_STATIONS) {
          // Convert to array to sort by lastUpdated timestamp
          const stationsArray = Object.entries(stationRecord);
          // Sort by lastUpdated (oldest first)
          stationsArray.sort(([, a], [, b]) =>
            (a.lastUpdated || 0) - (b.lastUpdated || 0)
          );

          // Remove oldest stations until we're back to MAX_STATIONS
          const excessCount = stationCount - MAX_STATIONS;
          console.log(`Removing ${excessCount} oldest stations to stay within limit of ${MAX_STATIONS}`);

          for (let i = 0; i < excessCount; i++) {
            if (stationsArray[i]) {
              delete stationRecord[stationsArray[i][0]];
            }
          }
        }

        return stationRecord;
      });

      return newStations;
    },
    enabled: !!region, // Only run query when region is available
    // How long the data is considered fresh (avoids refetching for the same region)
    staleTime: 5 * 60 * 1000, // 5 minutes
    // How long inactive query data remains in the cache
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  error && console.error('Error fetching charging stations:', error);

  // This query simply reads the master list from the cache for display
  const { data: allStationsRecord = {}, error: errorAllStations } = useQuery({
    queryKey: ['allStations'],
    queryFn: () => ({} as Record<string, ChargingStation>), // Initial empty record
    staleTime: Infinity, // This data never becomes stale as it's our local cache
  });

  errorAllStations && console.error('Error reading all stations from cache:', errorAllStations);

  const chargingStations = Object.values(allStationsRecord);

  return {
    chargingStations,
    isLoading,
    isError,
    error,
  };
};
