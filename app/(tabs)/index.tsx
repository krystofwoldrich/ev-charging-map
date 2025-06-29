import { ChargingStation, convertPlugsurfingToChargingStation } from '@/api/converters';
import { fetchChargingLocations } from '@/api/plugsurfing';
import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, useColorScheme } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';

export default function HomeScreen() {
  const mapViewRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [chargingStations, setChargingStations] = useState<ChargingStation[]>([]);

  const colorScheme = useColorScheme();
  const tabBarHeight = useBottomTabBarHeight();

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
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

  useEffect(() => {
    const loadData = async () => {
      if (region) {
        const locations = await fetchChargingLocations(region);
        const stations = convertPlugsurfingToChargingStation(locations);
        setChargingStations(stations);
      }
    };
    loadData();
  }, [region]);

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

  // Custom marker component for power display
  const StationMarker = ({ power }: { power: string; }) => {
    return (
      <View style={styles.markerWrapper}>
        <View style={styles.markerContainer}>
          <Ionicons name="flash" size={14} color="white" style={{ marginRight: 4 }} />
          <Text style={styles.markerText}>{power}</Text>
        </View>
        <View style={styles.markerPin} />
      </View>
    );
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
          <Marker
            key={station.id}
            coordinate={station.coordinates}
            tracksViewChanges={false}
            anchor={{ x: 0.5, y: 1 }} // Anchor to the bottom center
          >
            <StationMarker power={station.power} />
          </Marker>
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
          placeholder="Ionity, Nempitz, Germany"
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
  markerWrapper: {
    alignItems: 'center',
  },
  markerContainer: {
    backgroundColor: 'black',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderCurve: 'continuous',
  },
  markerText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  markerPin: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 10,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'black',
    alignSelf: 'center',
    marginTop: -1, // Overlap with the container for a seamless look
  },
  calloutContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    width: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  calloutDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  calloutLabel: {
    fontSize: 12,
    color: '#666',
  },
  calloutValue: {
    fontSize: 12,
    fontWeight: '600',
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
