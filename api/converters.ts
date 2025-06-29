import { PlugsurfingLocation } from './plugsurfing';

export interface ChargingStation {
  id: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  title: string;
  price?: string;
  currency?: string;
  unit?: string;
  availability: string;
  power: string;
  lastUpdated?: number;
}

export const convertPlugsurfingToChargingStation = (locations: PlugsurfingLocation[]): ChargingStation[] => {
  return locations.map(location => {
    const connectors = location.summary.connectorsStatuses;
    const totalAvailable = connectors.reduce((sum, c) => sum + c.available, 0);
    const totalConnectors = connectors.reduce((sum, c) => sum + c.available + c.occupied + c.outOfOrder + c.unknown, 0);
    const maxPower = Math.max(...connectors.map(c => c.maxPower));

    return {
      id: location.id,
      coordinates: {
        latitude: location.latitude,
        longitude: location.longitude,
      },
      title: location.name,
      availability: `${totalAvailable}/${totalConnectors} available`,
      power: `${maxPower} kW`,
    };
  });
};
