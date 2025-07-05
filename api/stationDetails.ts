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

// Raw API response interface
export interface StationApiResponse {
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
  // Additional properties that might be present in the API response
  extraProperties?: {
    openingHours?: {
      [day: string]: string;
    };
    // Add other properties as needed
  };
}

// Processed station details for display
export interface DetailedStation {
  id: string;
  name: string;
  address: {
    city: string;
    street: string;
    countryIsoCode: string;
    postalCode: string;
    fullAddress: string;
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };
  operator: {
    name: string;
    id: string;
  };
  isGreenEnergy: boolean;
  connectors: {
    id: string;
    type: string;
    power: number;
    status: string;
    powerType: string;
    isQuickCharge: boolean;
    priceInfo?: {
      price: number;
      currency: string;
      type: string;
      description?: string;
    };
  }[];
  status: string;
  availableConnectors: number;
  totalConnectors: number;
  lastUpdated: number;
  lastViewed?: number;
  openingTimes?: {
    day: string;
    hours: string;
  }[];
  lowestPrice?: {
    price: number;
    currency: string;
    type: string;
  };
}

// We've merged ExtendedStationDetails into DetailedStation

export const fetchStationDetails = async (stationId: string): Promise<StationApiResponse | null> => {
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

export const extractLowestPrice = (station: StationApiResponse): { price: number; currency: string; type: string } | null => {
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

/**
 * Convert a DetailedStation to our ExtendedStationDetails format with all necessary information
 */
/**
 * Process station details from API response into our display format
 */
export const processStationDetails = (station: StationApiResponse): DetailedStation => {
  const connectors: DetailedStation['connectors'] = [];
  let lowestPrice: { price: number; currency: string; type: string } | null = null;
  let availableConnectors = 0;
  let totalConnectors = 0;
  let openingTimes: { day: string; hours: string }[] | undefined = undefined;

  // Process all connectors
  for (const evse of station.evses) {
    for (const connector of evse.connectors) {
      totalConnectors++;
      
      if (connector.status === 'AVAILABLE') {
        availableConnectors++;
      }

      // Extract price info if available
      let priceInfo = undefined;
      if (connector.priceProfile?.content) {
        try {
          const priceContent = JSON.parse(connector.priceProfile.content);
          if (priceContent.segments && priceContent.segments.length > 0) {
            const segment = priceContent.segments[0];
            if (segment.price_components && segment.price_components.length > 0) {
              const component = segment.price_components[0]; // Get first component for simplicity
              if (typeof component.price === 'number') {
                priceInfo = {
                  price: component.price,
                  currency: connector.priceProfile.currency,
                  type: component.type,
                  description: connector.priceDescription
                };

                // Update lowest price if needed
                if (!lowestPrice || component.price < lowestPrice.price) {
                  lowestPrice = {
                    price: component.price,
                    currency: connector.priceProfile.currency,
                    type: component.type
                  };
                }
              }
            }
          }
        } catch (error) {
          console.error('Error parsing price content:', error);
        }
      }

      // Add connector to our list
      connectors.push({
        id: connector.id,
        type: connector.category,
        power: connector.power,
        status: connector.status,
        powerType: connector.powerType,
        isQuickCharge: connector.quick,
        priceInfo
      });
    }
  }

  // If we didn't extract a lowest price earlier, use the standard method
  if (!lowestPrice) {
    lowestPrice = extractLowestPrice(station);
  }

  // Create full address
  const fullAddress = `${station.address.street}, ${station.address.postalCode} ${station.address.city}, ${station.address.countryIsoCode}`;

  // Parse opening hours if available
  try {
    // Try to extract opening hours from station data
    if (station.extraProperties?.openingHours) {
      openingTimes = [];
      const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      
      // Parse available opening hours
      daysOfWeek.forEach(day => {
        const hours = station.extraProperties?.openingHours?.[day.toLowerCase()];
        if (hours) {
          openingTimes!.push({
            day,
            hours: typeof hours === 'string' ? hours : '24/7'
          });
        }
      });
    } 
    
    // If no opening hours were found, assume 24/7 for EV charging stations
    if (!openingTimes || openingTimes.length === 0) {
      openingTimes = [
        { day: 'All days', hours: '24/7' }
      ];
    }
  } catch (error) {
    console.error('Error parsing opening hours:', error);
    // Default to 24/7 as a fallback
    openingTimes = [
      { day: 'All days', hours: '24/7' }
    ];
  }

  return {
    id: station.id,
    name: station.name,
    address: {
      ...station.address,
      fullAddress
    },
    coordinates: {
      latitude: station.latitude,
      longitude: station.longitude
    },
    operator: {
      name: station.operatorDisplayName,
      id: station.operatorId
    },
    isGreenEnergy: station.isGreenEnergy,
    connectors,
    status: station.summary.aggregatedStatus,
    availableConnectors,
    totalConnectors,
    lastUpdated: Date.now(),
    openingTimes,
    lowestPrice: lowestPrice || undefined
  };
};
