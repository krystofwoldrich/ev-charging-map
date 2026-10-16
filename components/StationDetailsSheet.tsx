import type { ChargingStation } from '@/api/converters';
import { useStationDetails } from '@/hooks/useStationDetail';
import { useSettings } from '@/lib/settings';
import { connectorName, priceLabel } from '@/lib/stationFormat';
import React from 'react';
import { ActivityIndicator, Alert, Linking, Platform, View, useWindowDimensions } from 'react-native';
import { Action, Icon, Label, palette, Section, styles } from './ui/Native';

// Content of the shared native sheet. Keeping one presentation avoids stacked map sheets.
export default function StationDetailsSheet({ station }: { station: ChargingStation }) {
  const { source } = useSettings();
  const { fontScale } = useWindowDimensions();
  const largeText = fontScale > 1.4;
  const { data, isLoading, isError, refetch } = useStationDetails(station.id, true);
  const sample = source === 'sample';
  async function directions() {
    const { latitude, longitude } = station.coordinates;
    const destination = `${latitude},${longitude}`;
    const url = Platform.OS === 'ios'
      ? `https://maps.apple.com/?${sample ? 'll' : 'daddr'}=${destination}&q=${encodeURIComponent(sample ? station.address || station.title : station.title)}${sample ? '' : '&dirflg=d'}`
      : `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    await Linking.openURL(url).catch(() => Alert.alert('Couldn’t open Maps', 'Please try again.'));
  }
  if (isLoading) return <View style={{ padding: 30, gap: 14, alignItems: 'center' }}><ActivityIndicator /><Label style={styles.secondary}>Loading station details…</Label></View>;
  if (isError || !data) return <View style={{ gap: 16 }}>
    <Label>Station details aren’t available right now.</Label>
    <Label style={styles.secondary}>Check your connection and try again.</Label>
    <Action title="Try again" symbol="arrow.clockwise" onPress={() => void refetch()} />
  </View>;
  const price = priceLabel(data.lowestPrice);
  const maxPower = Math.max(0, ...data.connectors.map(connector => connector.power));
  return <View>
    <View style={[styles.row, { marginBottom: 18 }]}>
      <Icon name={data.availableConnectors ? 'checkmark.circle.fill' : 'clock.fill'} color={data.availableConnectors ? palette.green : palette.secondary} size={19} />
      <Label style={{ fontWeight: '600' }}>{data.availableConnectors} of {data.totalConnectors} available</Label>
    </View>
    <View style={[styles.card, { flexDirection: largeText ? 'column' : 'row', paddingVertical: 18, marginBottom: 18, gap: largeText ? 18 : 0 }]}>
      <View style={{ flex: largeText ? undefined : 1, paddingHorizontal: 18, gap: 5 }}>
        <Label style={{ fontSize: 23, fontWeight: '700' }}>{maxPower ? `${maxPower} kW` : '—'}</Label>
        <Label style={styles.caption}>Up to · {data.connectors.some(connector => connector.powerType === 'DC') ? 'Fast charging' : 'AC charging'}</Label>
      </View>
      {!largeText && <View style={{ width: 0.5, backgroundColor: palette.separator }} />}
      <View style={{ flex: largeText ? undefined : 1, paddingHorizontal: 18, gap: 5 }}>
        <Label style={{ fontSize: 23, fontWeight: '700' }}>{price?.split('/')[0] ?? '—'}</Label>
        <Label style={styles.caption}>{price ? `From · per ${data.lowestPrice?.type === 'ENERGY' ? 'kWh' : 'session'}` : 'Price unavailable'}</Label>
      </View>
    </View>
    <Action title={sample ? 'View area in Maps' : 'Directions'} symbol={sample ? 'map' : 'arrow.turn.up.right'} onPress={directions} />
    {sample && <Label style={[styles.caption, { marginTop: 10 }]}>Sample station · Availability and prices are fictional.</Label>}
    <Section title="Connectors">
      <View style={styles.card}>
        {data.connectors.map((connector, index) => <React.Fragment key={connector.id}>
          {!!index && <View style={styles.divider} />}
          <View style={styles.cardRow} accessible accessibilityLabel={`${connectorName(connector.type)}, ${connector.power} kilowatts, ${connector.status.toLowerCase()}, ${priceLabel(connector.priceInfo) || 'price unavailable'}`}>
            <Icon name={connector.type === 'CCS' ? 'ev.plug.dc.ccs2' : 'powerplug'} size={26} color={palette.tint} />
            <View style={{ flex: 1, gap: 4 }}>
              <Label style={{ fontWeight: '600' }}>{connectorName(connector.type)} · {connector.power} kW</Label>
              <Label style={styles.secondary}>{connector.status === 'AVAILABLE' ? 'Available' : connector.status === 'OCCUPIED' ? 'In use' : connector.status === 'OUT_OF_ORDER' ? 'Out of service' : 'Status unknown'}</Label>
              {largeText && <Label style={styles.secondary}>{priceLabel(connector.priceInfo) || 'Price unavailable'}</Label>}
            </View>
            {!largeText && <Label style={[styles.secondary, { flexShrink: 1, textAlign: 'right' }]}>{priceLabel(connector.priceInfo) || '—'}</Label>}
          </View>
        </React.Fragment>)}
      </View>
      {!sample && <Label style={styles.caption}>Prices are supplied by Plugsurfing. Parking, session, or time fees may also apply. Confirm the full tariff before charging.</Label>}
    </Section>
    <Section title="Location">
      <View style={styles.card}>
        <View style={styles.cardRow}><Icon name="mappin.and.ellipse" color={palette.secondary} /><View style={{ flex: 1, gap: 4 }}><Label>{data.address.street}</Label><Label style={styles.secondary}>{[data.address.postalCode, data.address.city].filter(Boolean).join(' ')}</Label></View></View>
        <View style={styles.divider} />
        <View style={styles.cardRow}><Icon name="building.2" color={palette.secondary} /><View style={{ flex: 1, gap: 4 }}><Label>{data.operator.name || 'Operator unavailable'}</Label><Label style={styles.caption}>Charging operator</Label></View></View>
        <View style={styles.divider} />
        <View style={styles.cardRow}><Icon name="clock" color={palette.secondary} /><View style={{ flex: 1, gap: 4 }}><Label>{data.openingTimes?.map(time => `${time.day}: ${time.hours}`).join('\n') || 'Opening hours unavailable'}</Label></View></View>
      </View>
    </Section>
    {!sample && <Label style={[styles.caption, { marginTop: 22 }]}>Updated {new Date(data.lastUpdated).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} · Plugsurfing</Label>}
  </View>;
}
