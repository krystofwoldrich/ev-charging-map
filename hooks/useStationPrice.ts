import { extractLowestPrice, fetchStationDetails } from '@/api/stationDetails';
import { useQuery } from '@tanstack/react-query';

export function useStationPrice(stationId: string | undefined) {
  return useQuery({
    queryKey: ['stationPrice', stationId],
    queryFn: async () => {
      if (!stationId) return null;
      const details = await fetchStationDetails(stationId);
      if (!details) return null;
      return extractLowestPrice(details);
    },
    enabled: !!stationId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
