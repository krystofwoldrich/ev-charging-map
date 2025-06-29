import StationMarker from '@/components/StationMarker';
import { useChargingStations } from '@/hooks/useChargingStations';
import { useCurrentAddress } from '@/hooks/useCurrentAddress';
import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, useColorScheme, ActivityIndicator } from 'react-native';
import MapView, { Region } from 'react-native-maps';

export default function HomeScreen() {
  const mapViewRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region | undefined>(undefined);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const colorScheme = useColorScheme();
  const tabBarHeight = useBottomTabBarHeight();

  // Use our custom hook for charging stations data
  const { chargingStations, isLoading } = useChargingStations(region);
  
  // Use our custom hook for current address
  const { currentAddress } = useCurrentAddress(region, { threshold: 1 }); // 1km threshold

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation(location);
      const initialRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
      setRegion(initialRegion);
      mapViewRef.current?.animateToRegion(initialRegion, 1000);
    })();
  }, []);

  const goToMyLocation = () => {
    if (userLocation) {
      mapViewRef.current?.animateToRegion({
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }, 1000); // 1000ms animation duration
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <MapView
        ref={mapViewRef}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={true}
      >
        {chargingStations.map(station => (
          <StationMarker key={station.id} station={station} />
        ))}
      </MapView>

      <BlurView
        intensity={90}
        tint={colorScheme === 'dark' ? 'dark' : 'light'}
        style={styles.searchContainer}
      >
        <Ionicons
          name="search"
          size={20}
          color={colorScheme === 'dark' ? '#E5E5E7' : '#3C3C43'}
          style={styles.searchIcon}
        />
        <TextInput
          style={[styles.searchInput, { color: colorScheme === 'dark' ? 'white' : 'black' }]}
          placeholder={currentAddress || 'Ionity, Nempitz, Germany'}
          placeholderTextColor={colorScheme === 'dark' ? '#E5E5E7' : '#3C3C43'}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </BlurView>

      <TouchableOpacity
        style={[styles.locationButton, { bottom: tabBarHeight + 20 }]}
        onPress={goToMyLocation}
      >
        <BlurView
          intensity={90}
          tint={colorScheme === 'dark' ? 'dark' : 'light'}
          style={styles.locationButtonBlur}
        >
          <Ionicons name={"navigate"} size={24} color={colorScheme === 'dark' ? 'white' : '#007AFF'} />
        </BlurView>
      </TouchableOpacity>

      {isLoading && (
        <View style={[styles.loadingContainer, { bottom: tabBarHeight + 20 }]}>
          <BlurView
            intensity={90}
            tint={colorScheme === 'dark' ? 'dark' : 'light'}
            style={styles.loadingBlur}
          >
            <ActivityIndicator 
              size="small" 
              color={colorScheme === 'dark' ? 'white' : '#007AFF'} 
            />
          </BlurView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  locationButton: {
    position: 'absolute',
    right: 20,
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderCurve: 'continuous',
  },
  locationButtonBlur: {
    padding: 10,
  },
  loadingContainer: {
    position: 'absolute',
    left: 20,
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderCurve: 'continuous',
  },
  loadingBlur: {
    padding: 10,
  },
  searchContainer: {
    position: 'absolute',
    top: Constants.statusBarHeight + 15,
    left: 15,
    right: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
    overflow: 'hidden', // Important for BlurView border radius
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: 'black',
    fontSize: 16,
  },
});
