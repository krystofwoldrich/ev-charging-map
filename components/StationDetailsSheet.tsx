import { DetailedStation } from '@/api/stationDetails';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import React, { useCallback, useMemo, useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

interface StationDetailsSheetProps {
  stationId: string | null;
  stationDetails: DetailedStation | null;
  isLoading: boolean;
  onClose: () => void;
}

const StationDetailsSheet = ({ stationId, stationDetails, isLoading, onClose }: StationDetailsSheetProps) => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Snap points for the bottom sheet (percentage from bottom of screen)
  const snapPoints = useMemo(() => ['30%', '60%'], []);

  // Callback for sheet changes
  const handleSheetChanges = useCallback((index: number) => {
    // If sheet is closed (index === -1), call the onClose callback
    if (index === -1) {
      onClose();
    }
  }, [onClose]);

  // Function to format date to readable string
  const formatDate = (timestamp: number | undefined) => {
    if (!timestamp) return 'Never';

    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Function to render connector status with icon
  const renderConnectorStatus = (status: string) => {
    const statusColors: Record<string, string> = {
      'AVAILABLE': '#4CAF50',
      'OCCUPIED': '#FF9800',
      'OUT_OF_ORDER': '#F44336',
      'UNKNOWN': '#9E9E9E'
    };

    const color = statusColors[status] || '#9E9E9E';

    return (
      <View style={styles.statusContainer}>
        <View style={[styles.statusDot, { backgroundColor: color }]} />
        <Text style={[styles.statusText, { color: isDark ? '#E5E5E7' : '#3C3C43' }]}>
          {status.replace('_', ' ')}
        </Text>
      </View>
    );
  };

  // Format price display
  const formatPrice = (priceInfo: { price: number, currency: string, type: string } | undefined) => {
    if (!priceInfo) return 'Not available';

    const { price, currency, type } = priceInfo;

    if (type === 'ENERGY') {
      return `${price.toFixed(2)} ${currency}/kWh`;
    } else if (type === 'TIME') {
      return `${price.toFixed(2)} ${currency}/min`;
    } else if (type === 'FLAT') {
      return `${price.toFixed(2)} ${currency}`;
    } else {
      return `${price.toFixed(2)} ${currency}`;
    }
  };

  // Render backdrop component
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  // Return null if there's no station selected
  if (!stationId) {
    return null;
  }

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      backgroundStyle={{ backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }}
      handleIndicatorStyle={{ backgroundColor: isDark ? '#E5E5E7' : '#3C3C43' }}
      backdropComponent={renderBackdrop}
    >
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#007AFF'} />
          <Text style={[styles.loadingText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            Loading station details...
          </Text>
        </View>
      ) : stationDetails ? (
        <BottomSheetScrollView contentContainerStyle={styles.contentContainer}>
          {/* Header with station name and close button */}
          <View style={styles.header}>
            <Text style={[styles.stationName, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              {stationDetails.name}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
            </TouchableOpacity>
          </View>

          {/* Station address */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="location" size={20} color={isDark ? '#FFFFFF' : '#000000'} />
              <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                Address
              </Text>
            </View>
            <Text style={[styles.sectionContent, { color: isDark ? '#E5E5E7' : '#3C3C43' }]}>
              {stationDetails.address.fullAddress}
            </Text>
          </View>

          {/* Station operator */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="business" size={20} color={isDark ? '#FFFFFF' : '#000000'} />
              <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                Operator
              </Text>
            </View>
            <Text style={[styles.sectionContent, { color: isDark ? '#E5E5E7' : '#3C3C43' }]}>
              {stationDetails.operator.name}
            </Text>
            {stationDetails.isGreenEnergy && (
              <View style={styles.greenEnergyContainer}>
                <Ionicons name="leaf" size={16} color="#4CAF50" />
                <Text style={styles.greenEnergyText}>Green Energy</Text>
              </View>
            )}
          </View>

          {/* Price information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="cash" size={20} color={isDark ? '#FFFFFF' : '#000000'} />
              <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                Lowest Price
              </Text>
            </View>
            <Text style={[styles.priceText, { color: isDark ? '#E5E5E7' : '#3C3C43' }]}>
              {formatPrice(stationDetails.lowestPrice)}
            </Text>
          </View>

          {/* Availability information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="information-circle" size={20} color={isDark ? '#FFFFFF' : '#000000'} />
              <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                Availability
              </Text>
            </View>
            <Text style={[styles.sectionContent, { color: isDark ? '#E5E5E7' : '#3C3C43' }]}>
              {stationDetails.availableConnectors} of {stationDetails.totalConnectors} connectors available
            </Text>
            {renderConnectorStatus(stationDetails.status)}
          </View>

          {/* Connectors list */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="flash" size={20} color={isDark ? '#FFFFFF' : '#000000'} />
              <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                Connectors
              </Text>
            </View>
            {stationDetails.connectors.map((connector, index) => (
              <View key={connector.id} style={styles.connectorItem}>
                <View style={styles.connectorHeader}>
                  <Text style={[styles.connectorType, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                    {connector.type} - {connector.power}kW ({connector.powerType})
                  </Text>
                  {connector.isQuickCharge && (
                    <View style={styles.quickChargeContainer}>
                      <Ionicons name="flash" size={14} color="#FF9800" />
                      <Text style={styles.quickChargeText}>Fast</Text>
                    </View>
                  )}
                </View>
                <View style={styles.connectorDetails}>
                  {renderConnectorStatus(connector.status)}
                  {connector.priceInfo && (
                    <Text style={[styles.connectorPrice, { color: isDark ? '#E5E5E7' : '#3C3C43' }]}>
                      {formatPrice(connector.priceInfo)}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>

          {/* Last viewed information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time" size={20} color={isDark ? '#FFFFFF' : '#000000'} />
              <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                Last Viewed
              </Text>
            </View>
            <Text style={[styles.sectionContent, { color: isDark ? '#E5E5E7' : '#3C3C43' }]}>
              {formatDate(stationDetails.lastViewed)}
            </Text>
          </View>

          {/* Opening times if available */}
          {stationDetails.openingTimes && stationDetails.openingTimes.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="calendar" size={20} color={isDark ? '#FFFFFF' : '#000000'} />
                <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                  Opening Hours
                </Text>
              </View>
              {stationDetails.openingTimes.map((time, index) => (
                <View key={index} style={styles.openingTimeItem}>
                  <Text style={[styles.openingDay, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                    {time.day}:
                  </Text>
                  <Text style={[styles.openingHours, { color: isDark ? '#E5E5E7' : '#3C3C43' }]}>
                    {time.hours}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </BottomSheetScrollView>
      ) : (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={32} color={isDark ? '#FF9800' : '#F44336'} />
          <Text style={[styles.errorText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            Failed to load station details
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: isDark ? '#007AFF' : '#007AFF' }]}
            onPress={() => queryClient.invalidateQueries({ queryKey: ['stationDetails', stationId] })}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  stationName: {
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  sectionContent: {
    fontSize: 16,
    lineHeight: 22,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
  },
  connectorItem: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
  },
  connectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  connectorType: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  quickChargeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  quickChargeText: {
    fontSize: 12,
    color: '#FF9800',
    marginLeft: 2,
  },
  connectorDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  connectorPrice: {
    fontSize: 14,
  },
  greenEnergyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  greenEnergyText: {
    color: '#4CAF50',
    marginLeft: 4,
    fontSize: 14,
  },
  openingTimeItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  openingDay: {
    width: 100,
    fontSize: 16,
    fontWeight: '500',
  },
  openingHours: {
    fontSize: 16,
  },
});

export default StationDetailsSheet;
