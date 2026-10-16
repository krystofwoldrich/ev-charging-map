import type { ChargingStation } from '@/api/converters';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Marker } from 'react-native-maps';
import { Icon, palette } from './ui/Native';

export default function StationMarker({ station, selected, onPress }: {
  station: ChargingStation; selected: boolean; onPress: () => void;
}) {
  return <Marker coordinate={station.coordinates} onPress={onPress} title={station.title}
    description={`${station.power} · ${station.availability}`} zIndex={selected ? 10 : 1} tracksViewChanges>
    <View style={pin.target} accessible accessibilityLabel={`${station.title}, ${station.availability}`}>
      <View style={[pin.circle, { backgroundColor: selected ? palette.tint : (station.availableConnectors ?? 0) > 0 ? '#237947' : '#69757e', transform: [{ scale: selected ? 1.15 : 1 }] }]}>
        <Icon name="bolt.fill" size={18} color="white" />
      </View>
    </View>
  </Marker>;
}
const pin = StyleSheet.create({
  target: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  circle: { width: 34, height: 34, borderRadius: 18, borderWidth: 2.5, borderColor: 'white', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 3, shadowOffset: { width: 0, height: 2 } },
});
