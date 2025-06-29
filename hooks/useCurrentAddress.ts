import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Region } from 'react-native-maps';

interface UseCurrentAddressOptions {
  threshold?: number; // Minimum distance change to trigger update (in km)
}

export const useCurrentAddress = (region: Region | undefined, options: UseCurrentAddressOptions = {}) => {
  const [currentAddress, setCurrentAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const lastRegionRef = useRef<Region | undefined>(undefined);
  const { threshold = 2 } = options; // 2km default threshold

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  useEffect(() => {
    const updateAddress = async () => {
      if (!region) return;
      
      // Check if region change is significant enough
      if (lastRegionRef.current) {
        const distance = calculateDistance(
          lastRegionRef.current.latitude,
          lastRegionRef.current.longitude,
          region.latitude,
          region.longitude
        );
        
        if (distance < threshold) return;
      }

      setIsLoading(true);
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: region.latitude,
          longitude: region.longitude,
        });

        if (reverseGeocode.length > 0) {
          const address = reverseGeocode[0];
          const parts = [];
          
          if (address.name) parts.push(address.name);
          if (address.city) parts.push(address.city);
          if (address.country) parts.push(address.country);
          
          const formattedAddress = parts.join(', ') || 'Unknown location';
          setCurrentAddress(formattedAddress);
          lastRegionRef.current = region;
        }
      } catch (error) {
        console.error('Failed to reverse geocode:', error);
        setCurrentAddress('Location unavailable');
      } finally {
        setIsLoading(false);
      }
    };

    updateAddress();
  }, [region, threshold, calculateDistance]);

  return {
    currentAddress,
    isLoading,
  };
};
