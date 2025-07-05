import { convertToExtendedDetails, ExtendedStationDetails, fetchStationDetails } from '@/api/stationDetails';
import { useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Hook to fetch and store detailed station information including prices
 * @param stationId The ID of the station to fetch details for
 * @param shouldFetch Whether the fetch should be enabled
 * @returns Query result containing the station's price information
 */
export function useStationDetails(stationId: string | undefined, shouldFetch: boolean = false) {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ['stationDetails', stationId],
    queryFn: async () => {
      if (!stationId) return null;
      
      // Check if we already have cached data
      const cachedData = queryClient.getQueryData<ExtendedStationDetails>(['extendedStationDetails', stationId]);
      
      if (cachedData) {
        // If we have cached data, just update the lastViewed timestamp
        const updatedDetails = {
          ...cachedData,
          lastViewed: Date.now()
        };
        
        // Update the cache with the new lastViewed timestamp
        queryClient.setQueryData(['extendedStationDetails', stationId], updatedDetails);
        
        return updatedDetails;
      }
      
      // If no cached data, fetch from API
      const details = await fetchStationDetails(stationId);
      if (!details) return null;
      
      // Convert to our extended details format with all information
      const extendedDetails = convertToExtendedDetails(details);
      
      // Set last viewed timestamp
      extendedDetails.lastViewed = Date.now();
      
      // Cache the extended details for use in other components
      queryClient.setQueryData(['extendedStationDetails', stationId], extendedDetails);
      
      return extendedDetails;
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
