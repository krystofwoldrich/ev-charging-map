import type { ChargingStation } from '@/api/converters';
import type { ConnectorType } from '@/api/plugsurfing';
import { AMSTERDAM, sampleStations } from '@/api/sampleData';
import SettingsPage from '@/components/SettingsPage';
import StationDetailsSheet from '@/components/StationDetailsSheet';
import StationMarker from '@/components/StationMarker';
import { Action, Icon, IconButton, Label, palette, styles } from '@/components/ui/Native';
import { useChargingStations } from '@/hooks/useChargingStations';
import { useSettings } from '@/lib/settings';
import { connectorName, distanceKm, distanceLabel, priceLabel } from '@/lib/stationFormat';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { GlassView } from 'expo-glass-effect';
import * as Location from 'expo-location';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Alert, Keyboard, Pressable, ScrollView, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type Mode = 'search' | 'details' | 'settings';
export default function ChargingMap() {
  const { source } = useSettings();
  const insets = useSafeAreaInsets();
  const { height, fontScale } = useWindowDimensions();
  const map = useRef<MapView>(null);
  const sheet = useRef<TrueSheet>(null);
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const searchRequest = useRef(0);
  const [region, setRegion] = useState<Region>(AMSTERDAM);
  const [mode, setMode] = useState<Mode>('search');
  const [selected, setSelected] = useState<ChargingStation>();
  const [connector, setConnector] = useState<ConnectorType | null>(null);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [focused, setFocused] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [addressResults, setAddressResults] = useState<Location.LocationGeocodedLocation[]>([]);
  const [locationAllowed, setLocationAllowed] = useState(false);
  const [locating, setLocating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const { chargingStations, isLoading, isFetching, isError, refetch } = useChargingStations(region, connector);
  const previousSource = useRef(source);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    if (fontScale > 1.4) void sheet.current?.resize(2).catch(() => {});
  }, [fontScale]);
  useEffect(() => {
    if (source === previousSource.current) return;
    previousSource.current = source;
    searchRequest.current++;
    setSearch(''); setAddressResults([]); setSearchError(''); setSearching(false); setSelected(undefined);
    setRegion(AMSTERDAM);
    map.current?.animateToRegion(AMSTERDAM, 0);
  }, [source]);
  function moveMap(next: Region) {
    setRegion(next);
    map.current?.animateToRegion(next, reduceMotion ? 0 : 400);
  }
  function resize(index: number) { void sheet.current?.resize(index).catch(() => {}); }
  function showMode(next: Mode) {
    Keyboard.dismiss(); setFocused(false); setMode(next);
    scroll.current?.scrollTo({ y: 0, animated: false });
    resize(next === 'settings' || fontScale > 1.4 ? 2 : 1);
  }
  function selectStation(station: ChargingStation) {
    setSelected(station); showMode('details');
    moveMap({ ...station.coordinates, latitudeDelta: 0.018, longitudeDelta: 0.018 });
  }
  const visibleStations = useMemo(() => {
    // Search the whole demo, even if a previous pan put a matching station outside the viewport.
    const candidates = source === 'sample' && search.trim() ? sampleStations : chargingStations;
    const term = search.trim().toLocaleLowerCase();
    return candidates.filter(station => (!connector || station.connectorTypes.includes(connector)) &&
      (!availableOnly || (station.availableConnectors ?? 0) > 0) &&
      (!term || `${station.title} ${station.address || ''}`.toLocaleLowerCase().includes(term)))
      .sort((a, b) => distanceKm(a.coordinates, region) - distanceKm(b.coordinates, region));
  }, [source, search, chargingStations, connector, availableOnly, region]);
  async function searchAddress() {
    Keyboard.dismiss(); setFocused(false);
    if (source === 'sample' || !search.trim()) { resize(1); return; }
    const request = ++searchRequest.current;
    setSearching(true); setSearchError('');
    try {
      const results = await Location.geocodeAsync(search.trim());
      if (request !== searchRequest.current) return;
      setAddressResults(results.slice(0, 5));
      if (!results.length) setSearchError('No places found. Try a city or a full street address.');
    } catch {
      if (request === searchRequest.current) setSearchError('Address search is unavailable. Check your connection or explore the map.');
    } finally { if (request === searchRequest.current) setSearching(false); }
  }
  async function locate() {
    if (source === 'sample') { moveMap(AMSTERDAM); return; }
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Location is off', 'You can still search for an address or move the map. Allow location in iOS Settings to find chargers near you.');
        return;
      }
      setLocationAllowed(true);
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      moveMap({ ...position.coords, latitudeDelta: 0.035, longitudeDelta: 0.035 });
      setSearch(''); setAddressResults([]); showMode('search');
    } catch { Alert.alert('Location unavailable', 'Try again, or search for a city or address.'); }
    finally { setLocating(false); }
  }
  // TrueSheet reparents its header/content into a native presentation. Measure
  // each there so a narrow floating sheet doesn't inherit the whole window's rail.
  const header = <SafeAreaProvider style={{ flex: 0 }}>
    <SafeAreaView edges={['top', 'left', 'right']} style={local.header}>
      {mode === 'search' ? <>
        <View style={styles.between}>
          <View style={{ flex: 1, gap: 2 }}>
            <Label accessibilityRole="header" style={styles.title}>Charging</Label>
            <Label style={styles.secondary}>{source === 'sample' ? 'Amsterdam · Sample data' : 'Find your next charge'}</Label>
          </View>
          <IconButton label="Settings" name="gearshape" onPress={() => showMode('settings')} />
        </View>
        <View style={[styles.row, { marginTop: 16, gap: 10 }]}>
          <View style={local.searchField}>
            <Icon name="magnifyingglass" color={palette.secondary} size={19} />
            <TextInput accessibilityLabel={source === 'sample' ? 'Search sample stations' : 'Search stations or address'}
              placeholder={source === 'sample' ? 'Search Amsterdam chargers' : 'Search city, address, or station'} placeholderTextColor={palette.secondary}
              value={search} onChangeText={value => { setSearch(value); setAddressResults([]); setSearchError(''); searchRequest.current++; setSearching(false); }}
              onFocus={() => { setFocused(true); resize(2); }} onSubmitEditing={searchAddress} returnKeyType="search"
              clearButtonMode="while-editing" autoCorrect={false} style={[styles.body, { flex: 1, minHeight: 48, paddingVertical: 10 }]} />
          </View>
          {focused && <Pressable accessibilityRole="button" onPress={() => { Keyboard.dismiss(); setFocused(false); resize(1); }} style={{ minHeight: 44, justifyContent: 'center' }}><Label style={{ color: palette.tint }}>Cancel</Label></Pressable>}
        </View>
      </> : <View style={[styles.between, { alignItems: 'flex-start' }]}>
        <View style={{ flex: 1, gap: 5 }}>
          <Label accessibilityRole="header" style={styles.title}>{mode === 'settings' ? 'Settings' : selected?.title}</Label>
          {mode === 'details' && <Label style={styles.secondary}>{selected?.address || 'Charging station'}</Label>}
        </View>
        <IconButton label={mode === 'settings' ? 'Close Settings' : 'Close station details'} name="xmark" disabled={updating} onPress={() => { setSelected(undefined); showMode('search'); }} />
      </View>}
    </SafeAreaView>
  </SafeAreaProvider>;
  return <View style={local.root}>
    <MapView ref={map} style={StyleSheet.absoluteFill} initialRegion={AMSTERDAM} onRegionChangeComplete={setRegion}
      showsUserLocation={locationAllowed && source === 'live'} showsMyLocationButton={false} showsCompass={false} showsScale={false}
      mapPadding={{ top: insets.top + 55, right: insets.right, bottom: Math.max(height * 0.43, insets.bottom), left: insets.left }}
      onPress={() => { Keyboard.dismiss(); setFocused(false); }}>
      {visibleStations.map(station => <StationMarker key={`${source}-${station.id}`} station={station} selected={selected?.id === station.id} onPress={() => selectStation(station)} />)}
      {selected && !visibleStations.some(station => station.id === selected.id) && <StationMarker station={selected} selected onPress={() => showMode('details')} />}
    </MapView>
    <SafeAreaView pointerEvents="box-none" edges={['top', 'left', 'right']} style={local.mapControls}>
      <GlassView glassEffectStyle="regular" style={local.mapBadge}>
        <Icon name="bolt.fill" size={15} color={palette.green} />
        <Label style={{ fontSize: 15, fontWeight: '600' }}>{source === 'sample' ? 'Sample map' : 'Charging map'}</Label>
      </GlassView>
      <GlassView glassEffectStyle="regular" isInteractive style={{ borderRadius: 28 }}>
        <Pressable accessibilityRole="button" accessibilityLabel={source === 'sample' ? 'Show Amsterdam sample area' : 'Find my location'} disabled={locating} onPress={locate} style={local.mapButton}>
          {locating ? <ActivityIndicator /> : <Icon name={source === 'sample' ? 'map' : 'location.fill'} color={palette.tint} />}
        </Pressable>
      </GlassView>
    </SafeAreaView>
    <TrueSheet ref={sheet} detents={[Math.min(0.38, Math.max(0.23, 0.23 * fontScale)), 0.55, 1]} initialDetentIndex={fontScale > 1.4 ? 2 : 1}
      initialDetentAnimated={false} dismissible={false} dimmed={false} draggable={!updating} scrollable
      anchor="left" maxContentWidth={480} header={header} scrollableOptions={{ topScrollEdgeEffect: 'soft', bottomScrollEdgeEffect: 'soft' }}>
      <SafeAreaProvider>
        <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          {/* TrueSheet handles the scroll view's bottom/keyboard insets natively. */}
          <SafeAreaView edges={['left', 'right']} style={{ paddingHorizontal: 20, paddingBottom: 32, paddingTop: 4 }}>
            {mode === 'search' ? <>
              <View style={local.filters}>
                {([null, 'CCS', 'TYPE2'] as const).map(type => <Pressable key={type || 'all'} accessibilityRole="button"
                  accessibilityState={{ selected: connector === type }} onPress={() => setConnector(type)}
                  style={({ pressed }) => [local.chip, { backgroundColor: connector === type ? palette.tint : palette.fill, opacity: pressed ? 0.6 : 1 }]}>
                  <Label style={{ fontSize: 15, fontWeight: '600', color: connector === type ? 'white' : palette.label }}>{type ? connectorName(type) : 'All plugs'}</Label>
                </Pressable>)}
                <Pressable accessibilityRole="button" accessibilityLabel="Available stations only" accessibilityState={{ selected: availableOnly }} onPress={() => setAvailableOnly(value => !value)}
                  style={[local.chip, { backgroundColor: availableOnly ? palette.tint : palette.fill }]}><Label style={{ fontSize: 15, fontWeight: '600', color: availableOnly ? 'white' : palette.label }}>Available</Label></Pressable>
              </View>
              {searching && <View style={[styles.row, { paddingVertical: 16 }]}><ActivityIndicator /><Label style={styles.secondary}>Finding places…</Label></View>}
              {!!searchError && <Label style={[styles.secondary, { marginVertical: 16 }]}>{searchError}</Label>}
              {addressResults.map((result, index) => <Pressable accessibilityRole="button" key={`${result.latitude}-${result.longitude}`} style={local.stationRow}
                onPress={() => { moveMap({ ...result, latitudeDelta: 0.025, longitudeDelta: 0.025 }); setAddressResults([]); setSearch(''); resize(1); }}>
                <Icon name="mappin.circle.fill" color={palette.tint} size={28} /><View style={{ flex: 1, gap: 4 }}><Label>Search near {search}</Label><Label style={styles.caption}>Location {index + 1} · Show nearby chargers</Label></View><Icon name="chevron.right" size={13} color={palette.secondary} />
              </Pressable>)}
              <View style={[styles.between, { marginTop: 18, marginBottom: 4 }]}><Label accessibilityRole="header" style={{ fontSize: 20, fontWeight: '700' }}>{search.trim() ? 'Search results' : 'Near this area'}</Label>{isFetching ? <ActivityIndicator /> : <Label style={styles.secondary}>{visibleStations.length}</Label>}</View>
              <Label style={[styles.caption, { marginBottom: 10 }]}>Distance from the center of the map</Label>
              {isError ? <View style={{ paddingVertical: 24, gap: 12 }}><Icon name="wifi.exclamationmark" color={palette.secondary} size={30} /><Label style={{ fontWeight: '600' }}>Couldn’t load chargers</Label><Label style={styles.secondary}>Check your connection or switch to sample data in Settings.</Label><Action title="Try again" secondary onPress={() => void refetch()} /></View>
                : isLoading ? <View style={{ padding: 24 }}><ActivityIndicator /></View>
                : !visibleStations.length ? <View style={{ paddingVertical: 24, gap: 12 }}><Icon name="magnifyingglass" size={30} color={palette.secondary} /><Label style={{ fontWeight: '600' }}>No chargers found</Label><Label style={styles.secondary}>{source === 'sample' ? 'Try another name, change the filters, or return to the sample area.' : 'Move the map, change the filters, or search for an address.'}</Label>{source === 'sample' && <Action secondary title="Explore Amsterdam" onPress={() => { setSearch(''); setConnector(null); setAvailableOnly(false); moveMap(AMSTERDAM); }} />}</View>
                : visibleStations.map(station => {
                  const distance = distanceLabel(distanceKm(region, station.coordinates));
                  const price = station.price !== undefined ? priceLabel({ price: station.price, currency: station.currency!, type: station.priceType! }) : undefined;
                  return <Pressable key={station.id} accessibilityRole="button" accessibilityLabel={`${station.title}, ${station.power}, ${station.availability}, ${distance}${price ? `, ${price}` : ''}`} onPress={() => selectStation(station)} style={({ pressed }) => [local.stationRow, { opacity: pressed ? 0.5 : 1 }]}>
                    <View style={local.stationIcon}><Icon name="bolt.car.fill" size={25} color={palette.tint} /></View>
                    <View style={{ flex: 1, gap: 5 }}>
                      <Label style={{ fontWeight: '600' }}>{station.title}</Label>
                      <Label style={styles.secondary}>{distance} · {station.power} · {station.connectorTypes.map(connectorName).join(', ')}</Label>
                      <View style={[styles.row, { gap: 5, flexWrap: 'wrap' }]}><Icon name={(station.availableConnectors ?? 0) > 0 ? 'checkmark.circle.fill' : 'clock'} color={(station.availableConnectors ?? 0) > 0 ? palette.green : palette.secondary} size={13} /><Label style={styles.caption}>{station.availability}{price ? ` · ${price}` : ''}</Label></View>
                    </View>
                    <Icon name="chevron.right" size={12} color={palette.secondary} />
                  </Pressable>;
                })}
              <Label style={[styles.caption, { marginTop: 22 }]}>{source === 'sample' ? 'Made for exploring. These stations, prices, and availability are sample data.' : 'Station data by Plugsurfing. Availability can change before you arrive.'}</Label>
            </> : mode === 'details' && selected ? <StationDetailsSheet station={selected} /> : <SettingsPage
              dismissSheet={async () => { Keyboard.dismiss(); await sheet.current?.dismiss(); }}
              restoreSheet={async () => { await sheet.current?.present(2); }} onBusyChange={setUpdating} />}
          </SafeAreaView>
        </ScrollView>
      </SafeAreaProvider>
    </TrueSheet>
  </View>;
}

const local = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.background },
  header: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 },
  searchField: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, borderRadius: 14, backgroundColor: palette.fill },
  mapControls: { position: 'absolute', top: 0, left: 0, right: 0, paddingTop: 12, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  mapBadge: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 15, paddingVertical: 12, borderRadius: 24 },
  mapButton: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: { minHeight: 44, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 24, justifyContent: 'center' },
  stationRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 17, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: palette.separator },
  stationIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: palette.fill, alignItems: 'center', justifyContent: 'center' },
});
