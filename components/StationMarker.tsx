import { ChargingStation } from '@/api/converters';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Marker } from 'react-native-maps';

interface StationMarkerProps {
  station: ChargingStation;
  onPress?: (stationId: string) => void;
}

const StationMarker = ({ station, onPress }: StationMarkerProps) => {
  // Determine what to display in the marker
  const hasPrice = station.hasPriceInfo && station.price !== undefined;
  
  let displayText: string | null = null;
  if (hasPrice && station.price !== undefined) {
    const price = station.price.toFixed(2);
    const currency = station.currency;
    const priceType = station.priceType;
    
    // Add appropriate units based on price type
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
      tracksViewChanges={false}
      centerOffset={{ x: 0, y: -15 }} // Fine-tuned offset
      onPress={() => onPress?.(station.id)}
    >
      <View style={styles.markerWrapper}>
        <View style={[
          styles.markerContainer,
          !displayText && styles.markerContainerIconOnly // Smaller container when no text
        ]}>
          <Ionicons 
            name="flash" 
            size={displayText ? 10 : 16} 
            color="white" 
            style={displayText ? { marginRight: 4 } : undefined} 
          />
          {displayText && (
            <Text style={styles.markerText}>{displayText}</Text>
          )}
        </View>
        <View style={styles.markerPin} />
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
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

export default StationMarker;
