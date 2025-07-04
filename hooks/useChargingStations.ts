import { ChargingStation, convertPlugsurfingToChargingStation } from '@/api/converters';
import { fetchChargingLocations } from '@/api/plugsurfing';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Region } from 'react-native-maps';

export const useChargingStations = (region: Region | undefined) => {
  const queryClient = useQueryClient();

  // This query fetches data for the current region and merges it into a master list
  const { isLoading, error } = useQuery({
    // The queryKey includes the region, so it refetches when the map moves
    queryKey: ['chargingStations', region],
    queryFn: async () => {
      if (!region) return [];

      const locations = await fetchChargingLocations(region);
      const newStations = convertPlugsurfingToChargingStation(locations);

      // Manually update the master list in the cache
      queryClient.setQueryData<Map<string, ChargingStation>>(['allStations'], (oldData) => {
        const stationMap = oldData || new Map<string, ChargingStation>();
        newStations.forEach(station => {
          // Check if we already have detailed pricing info for this station
          const existingStation = stationMap.get(station.id);
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
          stationMap.set(station.id, stationWithTimestamp);
        });
        return stationMap;
      });

      return newStations;
    },
    enabled: !!region, // Only run query when region is available
    // How long the data is considered fresh (avoids refetching for the same region)
    staleTime: 5 * 60 * 1000, // 5 minutes
    // How long inactive query data remains in the cache
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  // This query simply reads the master list from the cache for display
  const { data: allStationsMap = new Map<string, ChargingStation>() } = useQuery({
    queryKey: ['allStations'],
    queryFn: () => new Map<string, ChargingStation>(), // Initial empty map
    staleTime: Infinity, // This data never becomes stale as it's our local cache
  });

  const chargingStations = Array.from(allStationsMap.values());

  return {
    chargingStations,
    isLoading,
    error,
  };
};
