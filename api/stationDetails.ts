export interface StationPriceComponent {
  type: string;
  price: number;
  step_size: number;
}

export interface StationPriceProfile {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  content: string;
  currency: string;
  taxation: number;
}

export interface StationConnector {
  id: string;
  category: string;
  power: number;
  name: string;
  priceDescription?: string;
  priceProfile?: StationPriceProfile;
  quick: boolean;
  status: string;
  powerType: string;
}

export interface StationEvse {
  id: string;
  connectors: StationConnector[];
}

export interface DetailedStation {
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
  external: boolean;
  isGreenEnergy: boolean;
  operatorDisplayName: string;
  operatorId: string;
  evses: StationEvse[];
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
}

export const fetchStationDetails = async (stationId: string): Promise<DetailedStation | null> => {
  const API_URL = `https://cdc-api.plugsurfing.com/public/v4/locations/${stationId}?userPrefix=ps-plugsurfing`;

  try {
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Host': 'cdc-api.plugsurfing.com',
        'User-Agent': 'Test/1234 CFNetwork/3826.500.131 Darwin/24.5.0',
        'Connection': 'keep-alive',
        'Accept': 'application/json',
        'Accept-Language': 'en-GB,en;q=0.9',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch station details: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching station details:', error);
    return null;
  }
};

export const extractLowestPrice = (station: DetailedStation): { price: number; currency: string; type: string } | null => {
  let lowestPrice: number | null = null;
  let currency = '';
  let priceType = '';

  // Check all connectors in all EVSEs for price information
  for (const evse of station.evses) {
    for (const connector of evse.connectors) {
      if (connector.priceProfile?.content) {
        try {
          const priceContent = JSON.parse(connector.priceProfile.content);
          if (priceContent.segments && priceContent.segments.length > 0) {
            const segment = priceContent.segments[0];
            if (segment.price_components && segment.price_components.length > 0) {
              for (const component of segment.price_components) {
                if (typeof component.price === 'number') {
                  // Handle different pricing types with priority:
                  // 1. ENERGY (per kWh) - most relevant for EV charging
                  // 2. FLAT (fixed fee) - session based
                  // 3. TIME (per minute/hour) - less preferred but common
                  const priorityScore = component.type === 'ENERGY' ? 1 : 
                                       component.type === 'FLAT' ? 2 :
                                       component.type === 'TIME' ? 3 : 4;
                  
                  const currentPriorityScore = priceType === 'ENERGY' ? 1 : 
                                              priceType === 'FLAT' ? 2 :
                                              priceType === 'TIME' ? 3 : 4;
                  
                  // For TIME pricing, convert to price per minute
                  let actualPrice = component.price;
                  if (component.type === 'TIME' && component.step_size) {
                    // step_size represents the duration in minutes for which the price applies
                    // So price per minute = total price / step_size (in minutes)
                    actualPrice = component.price / component.step_size;
                  }
                  
                  // For comparison purposes, use the actual price
                  let comparablePrice = actualPrice;
                  
                  // Update if this is the first price or a higher priority type
                  // For same priority types, prefer lower price
                  if (lowestPrice === null || 
                      priorityScore < currentPriorityScore || 
                      (priorityScore === currentPriorityScore && comparablePrice < lowestPrice)) {
                    lowestPrice = actualPrice; // Store the converted price
                    currency = connector.priceProfile.currency;
                    priceType = component.type;
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('Error parsing price content:', error);
        }
      }
    }
  }

  return lowestPrice !== null ? { price: lowestPrice, currency, type: priceType } : null;
};
