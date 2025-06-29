import { Region } from 'react-native-maps';

const API_URL = 'https://cdc-api.plugsurfing.com/public/v4/locations/no-aggs?limit=48&userPrefix=ps-plugsurfing';

export interface PlugsurfingLocation {
  id: string;
  name: string;
  address: {
    city: string;
    street: string;
    countryIsoCode: string;
    postalCode: string;
  };
  latitude: number;
  longitude: number;
  summary: {
    connectorsStatuses: {
      connectorCategory: string;
      quickCharger: boolean;
      minPower: number;
      maxPower: number;
      available: number;
      occupied: number;
      outOfOrder: number;
      unknown: number;
      powerType: string;
    }[];
    aggregatedStatus: string;
  };
  operatorDisplayName: string;
}

export const fetchChargingLocations = async (region: Region): Promise<PlugsurfingLocation[]> => {
  const { latitude, longitude, latitudeDelta, longitudeDelta } = region;

  const topLatitude = latitude + latitudeDelta;
  const bottomLatitude = latitude - latitudeDelta;
  const leftLongitude = longitude - longitudeDelta;
  const rightLongitude = longitude + longitudeDelta;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Host': 'cdc-api.plugsurfing.com',
        'User-Agent': 'Test/1234 CFNetwork/3826.500.131 Darwin/24.5.0',
        'Connection': 'keep-alive',
        'Accept': 'application/json',
        'Accept-Language': 'en-GB,en;q=0.9',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topLatitude,
        leftLongitude,
        bottomLatitude,
        rightLongitude,
        minimumConnectorPower: null,
        startChargingMethods: [],
        onlyAvailableConnectors: false,
        filterByConnectorCategories: {
          "TYPE1": false,
          "TYPE2": false,
          "TYPE3": false,
          "CHADEMO": false,
          "DOMESTIC": false,
          "CCS": false,
          "OTHER": false
        },
        connectorGroupingParameterList: ["CONNECTOR_CATEGORY", "POWER", "POWER_TYPE"]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API request failed with status ${response.status}:`, errorText);
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.locations || [];
  } catch (error) {
    console.error('Failed to fetch charging locations:', error);
    return [];
  }
};
