import { ChargingStation } from '@/api/converters';
import { useStationPrice } from '@/hooks/useStationPrice';
import { Ionicons } from '@expo/vector-icons';
import React, { memo, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Marker } from 'react-native-maps';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

interface StationMarkerProps {
  station: ChargingStation;
  shouldFetchPrice: boolean;
  onPress?: (stationId: string) => void;
}

const StationMarker = ({ station, shouldFetchPrice, onPress }: StationMarkerProps) => {
  const { data: priceInfo } = useStationPrice(station.id, shouldFetchPrice);

  // Animation for marker width using Reanimated shared value
  const widthAnim = useSharedValue(28); // Initial width for icon-only state
  // Keep track of previous display text state to detect changes
  const prevDisplayTextRef = React.useRef<string | null>(null);

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

  // We removed the scale animation, so no need for an effect on mount

  // Effect to handle animation when price information changes
  useEffect(() => {
    // Set initial width based on whether there's display text
    // Calculate a more precise width based on text content - adjust multipliers as needed
    const textWidth = displayText.length * 8; // ~8 points per character as an estimate
    const iconWidth = displayText ? 10 + 4 : 16; // icon size + margin if there's text
    const paddingWidth = displayText ? 12 : 8; // horizontal padding
    const targetWidth = displayText ? (textWidth + iconWidth + paddingWidth) : 28; // Calculate total width

    // Detect when displayText changes from empty to non-empty or vice versa
    if (prevDisplayTextRef.current === null) {
      // First render, just store the current value and set initial width
      prevDisplayTextRef.current = displayText;
      widthAnim.value = targetWidth;
      return;
    }

    const hadTextBefore = Boolean(prevDisplayTextRef.current);
    const hasTextNow = Boolean(displayText);

    // Only animate when the presence of text changes, not on every price update
    if (hadTextBefore !== hasTextNow) {
      // Animate the width change with Reanimated's withTiming
      widthAnim.value = withTiming(targetWidth, { 
        duration: 300,
      });
    } else if (hasTextNow && displayText !== prevDisplayTextRef.current) {
      // If the text content changed but still has text, update the width without animation
      widthAnim.value = targetWidth;
    }

    // Update the ref for the next render
    prevDisplayTextRef.current = displayText;
  }, [displayText, widthAnim]);

  // Define animated styles using Reanimated's useAnimatedStyle
  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: widthAnim.value,
    };
  });

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
        <Animated.View style={[
          styles.markerContainer,
          animatedStyle
        ]}>
          <Ionicons
            name="flash"
            size={displayText ? 10 : 16}
            color="white"
            style={displayText ? { marginRight: 4 } : undefined}
          />
          <Text numberOfLines={1} style={styles.markerText}>{displayText}</Text>
        </Animated.View>
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
    justifyContent: 'center',
    overflow: 'hidden', // Important for width animation
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
