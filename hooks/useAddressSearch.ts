import { getDistrictLevelDeltasForWindow } from '@/utils/mapHelpers';
import * as Location from 'expo-location';
import { useState } from 'react';
import { Region } from 'react-native-maps';

export interface AddressSuggestion {
  name: string;
  fullAddress: string;
  region: Region;
}

export function useAddressSearch() {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Search for address suggestions based on input
  const searchAddresses = async (query: string): Promise<void> => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      setIsSearching(true);

      // Use Expo's geocoding API to search for locations
      const geocodeResults = await Location.geocodeAsync(query);

      if (geocodeResults.length === 0) {
        setSuggestions([]);
        return;
      }

      // For each geocode result, get the human-readable address
      const detailedResults = await Promise.all(
        geocodeResults.slice(0, 5).map(async (result) => {
          const reverseResult = await Location.reverseGeocodeAsync({
            latitude: result.latitude,
            longitude: result.longitude,
          });

          if (reverseResult.length === 0) {
            return null;
          }

          const address = reverseResult[0];
          const parts = [];

          if (address.name) parts.push(address.name);
          if (address.street) parts.push(address.street);
          if (address.city) parts.push(address.city);
          if (address.region) parts.push(address.region);
          if (address.country) parts.push(address.country);

          const fullAddress = parts.join(', ');
          const name = address.name || address.street || address.city || 'Location';

          return {
            name,
            fullAddress,
            region: {
              latitude: result.latitude,
              longitude: result.longitude,
              ...getDistrictLevelDeltasForWindow(),
            }
          };
        })
      );

      // Filter out any null results
      const validResults = detailedResults.filter((result): result is AddressSuggestion => result !== null);
      setSuggestions(validResults);
    } catch (error) {
      console.error('Error searching for addresses:', error);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Clear suggestions
  const clearSuggestions = () => {
    setSuggestions([]);
  };

  return {
    suggestions,
    isSearching,
    searchAddresses,
    clearSuggestions,
  };
}
