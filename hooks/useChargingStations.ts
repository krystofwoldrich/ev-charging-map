import { convertPlugsurfingToChargingStation } from '@/api/converters';
import { ConnectorType, fetchChargingLocations } from '@/api/plugsurfing';
import { getSampleStations } from '@/api/sampleData';
import { useSettings } from '@/lib/settings';
import { useQuery } from '@tanstack/react-query';
import type { Region } from 'react-native-maps';

export function useChargingStations(region: Region, connectorType?: ConnectorType | null) {
  const { source } = useSettings();
  const query = useQuery({
    queryKey: ['chargingStations', source, region, connectorType],
    queryFn: async () => source === 'sample'
      ? getSampleStations(region, connectorType)
      : convertPlugsurfingToChargingStation(await fetchChargingLocations(region, connectorType)),
    staleTime: 60_000,
    retry: 1,
  });
  return { ...query, chargingStations: query.data ?? [] };
}
