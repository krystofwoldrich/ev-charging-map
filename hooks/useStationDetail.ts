import { fetchStationDetails, processStationDetails } from '@/api/stationDetails';
import { useQuery } from '@tanstack/react-query';

/**
 * Hook to fetch and store detailed station information including prices
 * @param stationId The ID of the station to fetch details for
 * @param shouldFetch Whether the fetch should be enabled
 * @returns Query result containing the station's price information
 */
export function useStationDetails(stationId: string | undefined, shouldFetch: boolean = false) {
  return useQuery({
    queryKey: ['stationDetails', stationId],
    queryFn: async () => {
      if (!stationId) return null;

      // If no cached data, fetch from API
      const apiResponse = await fetchStationDetails(stationId);
      if (!apiResponse) return null;

      // Process the API response into our display format
      return processStationDetails(apiResponse);
    },
    // Only enabled if we have a stationId AND shouldFetch is true
    enabled: !!stationId && shouldFetch,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Legacy hook for backward compatibility - only returns price information
 * @deprecated Use useStationDetails instead
 */
export function useStationPrice(stationId: string | undefined, shouldFetch: boolean = false) {
  const { data, isLoading, error } = useStationDetails(stationId, shouldFetch);

  // Extract just the price information for backward compatibility
  return {
    data: data?.lowestPrice || null,
    isLoading,
    error
  };
}
