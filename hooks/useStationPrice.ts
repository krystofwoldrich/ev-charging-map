import { extractLowestPrice, fetchStationDetails } from '@/api/stationDetails';
import { useQuery } from '@tanstack/react-query';

export function useStationPrice(stationId: string | undefined, shouldFetch: boolean = false) {
  return useQuery({
    queryKey: ['stationPrice', stationId],
    queryFn: async () => {
      if (!stationId) return null;
      const details = await fetchStationDetails(stationId);
      if (!details) return null;
      return extractLowestPrice(details);
    },
    // Only enabled if we have a stationId AND shouldFetch is true
    enabled: !!stationId && shouldFetch,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
