import { ChargingStation } from '@/api/converters';
import { useStationPrice } from '@/hooks/useStationPrice';
import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Marker } from 'react-native-maps';

interface StationMarkerProps {
  station: ChargingStation;
  shouldFetchPrice: boolean;
  onPress?: (stationId: string) => void;
}

const StationMarker = ({ station, shouldFetchPrice, onPress }: StationMarkerProps) => {
  const { data: priceInfo } = useStationPrice(station.id, shouldFetchPrice);

  // Determine what to display in the marker
  let displayText: string = '';
  if (shouldFetchPrice && priceInfo && priceInfo.price !== undefined) {
    const price = priceInfo.price.toFixed(2);
    const currency = priceInfo.currency;
    const priceType = priceInfo.type;
    if (priceType === 'ENERGY') {
      displayText = `${price} ${currency}/kWh`;
    } else if (priceType === 'TIME') {
      displayText = `${price} ${currency}/min`;
    } else if (priceType === 'FLAT') {
      displayText = `${price} ${currency}`;
    } else {
      displayText = `${price} ${currency}`;
    }
  }

  return (
    <Marker
      coordinate={station.coordinates}
      centerOffset={{ x: 0, y: -15 }}
      identifier={station.id}
      onPress={() => onPress?.(station.id)}
      tracksViewChanges={false}
    >
      <View
        // Mainly to avoid RN merging this wrapper with the children to minimize the number of views
        // The fixed max width ensures the markers don't slide on the map after the internal size change
        testID={`station-marker-wrapper-${station.id}`}
        style={styles.markerWrapper}>
        <View style={[
          styles.markerContainer,
          !displayText && styles.markerContainerIconOnly
        ]}>
          <Ionicons
            name="flash"
            size={displayText ? 10 : 16}
            color="white"
            style={displayText ? { marginRight: 4 } : undefined}
          />
          <Text style={styles.markerText}>{displayText}</Text>
        </View>
        <View style={styles.markerPin} />
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerWrapper: {
    alignItems: 'center',
    width: 200,
  },
  markerContainer: {
    backgroundColor: 'black',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  markerContainerIconOnly: {
    paddingHorizontal: 4,
    paddingVertical: 4,
    justifyContent: 'center',
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
    marginTop: -1,
  },
});

export default memo(StationMarker,
  // Custom equality function for memo - check ID and shouldFetchPrice
  (prevProps, nextProps) => {
    return prevProps.station.id === nextProps.station.id &&
           prevProps.shouldFetchPrice === nextProps.shouldFetchPrice;
  });
