import StationDetailsSheet from "@/components/StationDetailsSheet";
import StationMarker from "@/components/StationMarker";
import { AddressSuggestion, useAddressSearch } from "@/hooks/useAddressSearch";
import { useChargingStations } from "@/hooks/useChargingStations";
import { useCurrentAddress } from "@/hooks/useCurrentAddress";
import { useStationDetails } from "@/hooks/useStationDetail";
import {
  getDistrictLevelDeltasForWindow,
  isStationInRegion,
  shouldFetchStationDetail,
} from "@/utils/mapHelpers";
import { Ionicons } from "@expo/vector-icons";
import { useIsFetching } from "@tanstack/react-query";
import { BlurView } from "expo-blur";
import Constants from "expo-constants";
import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import MapView, { Region } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChargingStation } from "../../api/converters";

import { Button, ContextMenu, Host } from "@expo/ui/swift-ui";
import { frame } from '@expo/ui/swift-ui/modifiers';

export default function HomeScreen() {
  const mapViewRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region | undefined>(undefined);
  const [initialRegion, setInitialRegion] = useState<Region | undefined>(
    undefined
  );
  const [userLocation, setUserLocation] =
    useState<Location.LocationObject | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(
    null
  );
  const [selectedConnectorType, setSelectedConnectorType] = useState<
    "TYPE2" | "CCS" | null
  >("TYPE2");

  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  // Use our custom hook for charging stations data
  const {
    chargingStations,
    isLoading: isLoadingStations,
    isError,
  } = useChargingStations(region);

  // Use our custom hook for current address
  const { currentAddress } = useCurrentAddress(region, { threshold: 1 }); // 1km threshold

  // Use our custom hook for address search
  const { suggestions, isSearching, searchAddresses, clearSuggestions } =
    useAddressSearch();

  // Use our custom hook for station details
  const { data: stationDetails, isLoading: isLoadingStationDetails } =
    useStationDetails(selectedStationId || undefined, !!selectedStationId);

  const isZoomedIn = region
    ? shouldFetchStationDetail(region.latitudeDelta)
    : false;
  const shouldFetchPrices = (station: ChargingStation) =>
    isZoomedIn && isStationInRegion(station, region);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.error("Permission to access location was denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation(location);

      const userRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        ...getDistrictLevelDeltasForWindow(),
      };

      setInitialRegion(userRegion);
      setRegion(userRegion); // Set region for initial data fetching
    })();
  }, []);

  const goToMyLocation = () => {
    if (userLocation) {
      mapViewRef.current?.animateToRegion(
        {
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
          ...getDistrictLevelDeltasForWindow(),
        },
        1000
      ); // 1000ms animation duration
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchAddresses(searchQuery);
      setShowSuggestions(true);
      Keyboard.dismiss(); // Dismiss keyboard but keep suggestions visible
    }
  };
  const handleSuggestionSelect = (suggestion: AddressSuggestion) => {
    // Move the map to the selected location
    mapViewRef.current?.animateToRegion(suggestion.region, 1000);

    // Update the search query with the selected location name
    setSearchQuery(suggestion.name);

    // Hide suggestions and dismiss keyboard
    setShowSuggestions(false);
    clearSuggestions();
    Keyboard.dismiss();
  };

  const dismissSearch = () => {
    setShowSuggestions(false);
    clearSuggestions();
    Keyboard.dismiss();
  };

  // Handle station marker press
  const handleStationPress = (stationId: string) => {
    setSelectedStationId(stationId);
  };

  // Handle bottom sheet close
  const handleCloseBottomSheet = () => {
    setSelectedStationId(null);
  };

  const isLoadingDetails = useIsFetching({ queryKey: ["stationDetails"] }) > 0;
  const showSpinner = isLoadingStations || isLoadingDetails;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <MapView
        ref={mapViewRef}
        style={styles.map}
        initialRegion={initialRegion}
        onRegionChangeComplete={setRegion}
        showsUserLocation={true}
        onPress={() => {
          // Dismiss search when tapping on the map
          if (showSuggestions) {
            dismissSearch();
          }
        }}
      >
        {chargingStations.map((station) => (
          <StationMarker
            key={station.id}
            station={station}
            shouldFetchPrice={shouldFetchPrices(station)}
            onPress={() => handleStationPress(station.id)} // Pass station ID to handler
          />
        ))}
      </MapView>

      <BlurView
        intensity={90}
        tint={colorScheme === "dark" ? "dark" : "light"}
        style={styles.searchContainer}
      >
        <Ionicons
          name="search"
          size={20}
          color={colorScheme === "dark" ? "#E5E5E7" : "#3C3C43"}
          style={styles.searchIcon}
        />
        <TextInput
          style={[
            styles.searchInput,
            { color: colorScheme === "dark" ? "white" : "black" },
          ]}
          placeholder={currentAddress || "Ionity, Nempitz, Germany"}
          placeholderTextColor={colorScheme === "dark" ? "#E5E5E7" : "#3C3C43"}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          blurOnSubmit={true}
          onBlur={() => {
            // Only dismiss keyboard but keep suggestions visible
            // Do not set showSuggestions to false here
          }}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setSearchQuery("");
              clearSuggestions();
              setShowSuggestions(false);
            }}
            style={styles.clearButton}
          >
            <Ionicons
              name="close-circle"
              size={20}
              color={colorScheme === "dark" ? "#E5E5E7" : "#3C3C43"}
            />
          </TouchableOpacity>
        )}
      </BlurView>

      {/* Address suggestions */}
      {showSuggestions && (
        <BlurView
          intensity={90}
          tint={colorScheme === "dark" ? "dark" : "light"}
          style={styles.suggestionsContainer}
        >
          {suggestions.length > 0 && (
            <FlatList
              data={suggestions}
              keyboardShouldPersistTaps="handled"
              keyExtractor={(item, index) => `suggestion-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => handleSuggestionSelect(item)}
                >
                  <Ionicons
                    name="location"
                    size={20}
                    color={colorScheme === "dark" ? "#E5E5E7" : "#3C3C43"}
                    style={styles.suggestionIcon}
                  />
                  <View style={styles.suggestionTextContainer}>
                    <Text
                      style={[
                        styles.suggestionName,
                        { color: colorScheme === "dark" ? "white" : "black" },
                      ]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    <Text
                      style={[
                        styles.suggestionAddress,
                        {
                          color: colorScheme === "dark" ? "#E5E5E7" : "#3C3C43",
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {item.fullAddress}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}

          {!isSearching &&
            suggestions.length === 0 &&
            searchQuery.trim() !== "" && (
              <View style={styles.noResultsContainer}>
                <Text
                  style={[
                    styles.noResultsText,
                    { color: colorScheme === "dark" ? "white" : "black" },
                  ]}
                >
                  No locations found
                </Text>
              </View>
            )}

          {isSearching && (
            <View style={styles.searchingContainer}>
              <ActivityIndicator
                size="small"
                color={colorScheme === "dark" ? "white" : "#007AFF"}
              />
              <Text
                style={[
                  styles.searchingText,
                  { color: colorScheme === "dark" ? "white" : "black" },
                ]}
              >
                Searching...
              </Text>
            </View>
          )}
        </BlurView>
      )}

      {/* Connector type filter with ContextMenu */}
      {!selectedStationId && selectedConnectorType && (
        <View
          style={{
            // FIXME: Use MapOverlayContainer instead of absolute positioning
            position: "absolute",
            top: 125,
            left: 15,
          }}
        >
          <Host 
            matchContents 
            modifiers={[frame({ height: 40, width: 100 })]}
          >
            <ContextMenu
            >
              <ContextMenu.Items>
                <Button onPress={() => setSelectedConnectorType("TYPE2")}>
                  Type 2
                </Button>
                <Button onPress={() => setSelectedConnectorType("CCS")}>
                  CCS
                </Button>
              </ContextMenu.Items>
              <ContextMenu.Trigger>
                <Button
                  variant="glass"
                >
                  {selectedConnectorType === "TYPE2"
                    ? "Type 2"
                    : selectedConnectorType === "CCS"
                    ? "CCS"
                    : selectedConnectorType === "CHADEMO"
                    ? "CHAdeMO"
                    : selectedConnectorType === "TESLA"
                    ? "Tesla"
                    : "Unknown"}
                </Button>
              </ContextMenu.Trigger>
            </ContextMenu>
          </Host>
        </View>
      )}

      {/* We've integrated the loading state and no results into the main suggestions component above */}

      <TouchableOpacity
        style={[
          styles.locationButton,
          { bottom: insets.bottom + BOTTOM_OFFSET },
        ]}
        onPress={goToMyLocation}
      >
        <BlurView
          intensity={90}
          tint={colorScheme === "dark" ? "dark" : "light"}
          style={styles.locationButtonBlur}
        >
          <Ionicons
            name={"navigate"}
            size={24}
            color={colorScheme === "dark" ? "white" : "#007AFF"}
          />
        </BlurView>
      </TouchableOpacity>

      {showSpinner && (
        <View
          style={[
            styles.statusContainer,
            { bottom: insets.bottom + BOTTOM_OFFSET },
          ]}
        >
          <BlurView
            intensity={90}
            tint={colorScheme === "dark" ? "dark" : "light"}
            style={styles.statusBlur}
          >
            <ActivityIndicator
              size="small"
              color={colorScheme === "dark" ? "white" : "#007AFF"}
            />
          </BlurView>
        </View>
      )}

      {isError && !isLoadingStations && (
        <View
          style={[
            styles.statusContainer,
            { bottom: insets.bottom + BOTTOM_OFFSET },
          ]}
        >
          <BlurView
            intensity={90}
            tint={colorScheme === "dark" ? "dark" : "light"}
            style={styles.statusBlur}
          >
            <Ionicons
              name="warning"
              size={24}
              color={colorScheme === "dark" ? "#FFD700" : "#FF6347"}
            />
          </BlurView>
        </View>
      )}

      {/* Station details bottom sheet */}
      <StationDetailsSheet
        stationId={selectedStationId}
        stationDetails={stationDetails || null}
        isLoading={isLoadingStationDetails}
        onClose={handleCloseBottomSheet}
      />
    </View>
  );
}

const BOTTOM_OFFSET = 30; // Adjust as needed for your design

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  locationButton: {
    position: "absolute",
    right: 20,
    borderRadius: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderCurve: "continuous",
  },
  locationButtonBlur: {
    padding: 10,
  },
  statusContainer: {
    position: "absolute",
    left: 20,
    borderRadius: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderCurve: "continuous",
  },
  statusBlur: {
    padding: 10,
  },
  searchContainer: {
    position: "absolute",
    top: Constants.statusBarHeight + 15,
    left: 15,
    right: 15,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
    overflow: "hidden", // Important for BlurView border radius
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: "black",
    fontSize: 16,
  },
  clearButton: {
    padding: 5,
  },
  suggestionsContainer: {
    position: "absolute",
    top: Constants.statusBarHeight + 75, // Position below search bar
    left: 15,
    right: 15,
    maxHeight: 300,
    borderRadius: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(150, 150, 150, 0.2)",
  },
  suggestionIcon: {
    marginRight: 10,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 16,
    fontWeight: "500",
  },
  suggestionAddress: {
    fontSize: 14,
    opacity: 0.8,
    marginTop: 2,
  },
  suggestionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(150, 150, 150, 0.2)",
  },
  suggestionsTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  searchingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  searchingText: {
    marginLeft: 10,
    fontSize: 16,
  },
  noResultsContainer: {
    padding: 20,
    alignItems: "center",
  },
  noResultsText: {
    fontSize: 16,
  },
  connectorOptionText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
