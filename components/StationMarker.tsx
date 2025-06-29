import { ChargingStation } from '@/api/converters';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Marker } from 'react-native-maps';

interface StationMarkerProps {
  station: ChargingStation;
}

const StationMarker = ({ station }: StationMarkerProps) => {
  return (
    <Marker
      coordinate={station.coordinates}
      tracksViewChanges={false}
      centerOffset={{ x: 0, y: -15 }} // Fine-tuned offset
    >
      <View style={styles.markerWrapper}>
        <View style={styles.markerContainer}>
          <Ionicons name="flash" size={10} color="white" style={{ marginRight: 4 }} />
          <Text style={styles.markerText}>{station.power}</Text>
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
