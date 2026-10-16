import { sampleDetails } from '@/api/sampleData';
import { fetchStationDetails, processStationDetails } from '@/api/stationDetails';
import { useSettings } from '@/lib/settings';
import { useQuery } from '@tanstack/react-query';

export function useStationDetails(stationId: string | undefined, shouldFetch = false) {
  const { source } = useSettings();
  return useQuery({
    queryKey: ['stationDetails', source, stationId],
    queryFn: async () => {
      if (!stationId) return null;
      if (source === 'sample') return sampleDetails.find(station => station.id === stationId) ?? null;
      const response = await fetchStationDetails(stationId);
      return response ? processStationDetails(response) : null;
    },
    enabled: !!stationId && shouldFetch,
    staleTime: 60_000,
    retry: 1,
  });
}

export function useStationPrice(stationId: string | undefined, shouldFetch = false) {
  const { data, isLoading, error } = useStationDetails(stationId, shouldFetch);
  return { data: data?.lowestPrice ?? null, isLoading, error };
}
