import { useSettings } from '@/lib/settings';
import React, { useState } from 'react';
import { Alert, Switch, View } from 'react-native';
import UpdatePicker from './UpdatePicker';
import { Icon, Label, palette, Section, styles } from './ui/Native';

export default function SettingsPage(props: React.ComponentProps<typeof UpdatePicker>) {
  const { source, setSource } = useSettings();
  const [saving, setSaving] = useState(false);
  async function changeSource(sample: boolean) {
    setSaving(true);
    try { await setSource(sample ? 'sample' : 'live'); }
    catch { Alert.alert('Couldn’t save setting', 'Please try again.'); }
    finally { setSaving(false); }
  }
  return <View>
    <Label style={styles.secondary}>Make yourself at home.</Label>
    <Section title="Charging data">
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Icon name="sparkles" color={palette.tint} />
          <View style={{ flex: 1, gap: 4 }}><Label style={{ fontWeight: '600' }}>Use sample data</Label><Label style={styles.caption}>{source === 'sample' ? 'Explore Amsterdam' : 'Live Plugsurfing data'}</Label></View>
          <Switch accessibilityLabel="Use sample data" value={source === 'sample'} disabled={saving} onValueChange={changeSource} />
        </View>
      </View>
      <Label style={styles.secondary}>{source === 'sample'
        ? 'A small, fictional collection of Amsterdam chargers. Search, prices, and availability work without the charging APIs.'
        : 'Stations, availability, and tariffs come from Plugsurfing. Address search uses Apple’s geocoder on iOS. An internet connection is required.'}</Label>
      <Label style={styles.caption}>Sample data is on by default. Your choice is saved on this device. The basemap is provided by Maps.</Label>
    </Section>
    <UpdatePicker {...props} />
  </View>;
}
