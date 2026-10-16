import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, TextInput, View } from 'react-native';
import { switchUpdateChannel, validChannel } from '@/lib/updateSwitch';
import { Action, Icon, Label, palette, Section, styles } from './ui/Native';

const CHANNEL_KEY = 'charging-map:update-channel';
const RECENTS_KEY = 'charging-map:update-recents';
export const releaseLabel = process.env.EXPO_PUBLIC_RELEASE_LABEL || 'Native sheets';

export default function UpdatePicker({ dismissSheet, restoreSheet, onBusyChange }: {
  dismissSheet: () => Promise<void>; restoreSheet: () => Promise<void>; onBusyChange: (busy: boolean) => void;
}) {
  const enabled = !__DEV__ && Updates.isEnabled;
  const [current, setCurrent] = useState<string | null>(null);
  const [selected, setSelected] = useState('preview');
  const [recent, setRecent] = useState<string[]>([]);
  const [custom, setCustom] = useState('');
  const [progress, setProgress] = useState('');
  const [ready, setReady] = useState(false);
  const busy = useRef(false);
  useEffect(() => {
    Promise.all([AsyncStorage.getItem(CHANNEL_KEY), AsyncStorage.getItem(RECENTS_KEY)])
      .then(([channel, recents]) => {
        setCurrent(channel);
        const parsed: unknown = JSON.parse(recents || '[]');
        if (Array.isArray(parsed)) setRecent(parsed.filter((value): value is string => typeof value === 'string' && validChannel(value)).slice(0, 6));
      }).catch(() => {}).finally(() => setReady(true));
  }, []);
  const channels = [...new Set(['production', 'preview', ...recent])];
  const target = custom.trim() || selected;
  async function loadVersion() {
    if (!enabled || busy.current || !ready) return;
    busy.current = true;
    onBusyChange(true);
    try {
      const result = await switchUpdateChannel(target, current, {
        setOverride: channel => Updates.setUpdateRequestHeadersOverride(channel ? { 'expo-channel-name': channel } : null),
        check: Updates.checkForUpdateAsync,
        fetch: Updates.fetchUpdateAsync,
        persist: async channel => {
          if (channel) {
            await AsyncStorage.setItem(CHANNEL_KEY, channel);
            await AsyncStorage.setItem(RECENTS_KEY, JSON.stringify([channel, ...recent.filter(value => value !== channel)].slice(0, 6)));
          } else await AsyncStorage.removeItem(CHANNEL_KEY);
          setCurrent(channel);
        },
        dismissSheets: dismissSheet,
        reload: () => Updates.reloadAsync(),
        onProgress: setProgress,
      });
      if (result === 'no-update') {
        Alert.alert('No new compatible version', `There’s nothing new to load from “${target}” for this app build. Your current version and channel are unchanged.`);
      }
    } catch (error) {
      await restoreSheet().catch(() => {});
      Alert.alert('Couldn’t switch versions', error instanceof Error ? error.message : 'Check your connection and try again.');
    } finally {
      busy.current = false;
      setProgress('');
      onBusyChange(false);
    }
  }
  return <Section title="App versions">
    <Label style={styles.secondary}>Try the latest preview, or return to the stable version. Your data preference stays the same.</Label>
    {!enabled ? <View style={[styles.card, { padding: 16, gap: 8 }]}>
      <Label style={{ fontWeight: '600' }}>Available in the release app</Label>
      <Label style={styles.secondary}>This development client loads code from Metro. Install the simulator release or TestFlight build to switch versions here.</Label>
    </View> : <>
      <View style={styles.card}>
        {channels.map((channel, index) => <React.Fragment key={channel}>
          {!!index && <View style={styles.divider} />}
          <Pressable accessibilityRole="radio" accessibilityState={{ checked: !custom && selected === channel }}
            accessibilityLabel={`${channel} update channel`} disabled={!!progress}
            onPress={() => { setSelected(channel); setCustom(''); }} style={styles.cardRow}>
            <Icon name={channel === 'production' ? 'checkmark.seal' : 'sparkles'} color={palette.tint} />
            <View style={{ flex: 1, gap: 3 }}>
              <Label style={{ fontWeight: '600' }}>{channel === 'production' ? 'Stable' : channel === 'preview' ? 'Preview' : channel}</Label>
              <Label style={styles.caption}>{channel === 'production' ? 'Recommended for everyday use' : channel === 'preview' ? 'The newest features to try' : channel}</Label>
            </View>
            {!custom && selected === channel && <Icon name="checkmark" color={palette.tint} />}
          </Pressable>
        </React.Fragment>)}
      </View>
      <TextInput accessibilityLabel="Custom update channel" placeholder="Another channel…" placeholderTextColor={palette.secondary}
        value={custom} onChangeText={setCustom} editable={!progress} autoCapitalize="none" autoCorrect={false}
        style={[styles.body, { backgroundColor: palette.fill, minHeight: 48, padding: 14, borderRadius: 14 }]} />
      <Action title={progress ? 'Updating…' : `Load ${target}`} symbol="arrow.down.circle" onPress={loadVersion} disabled={!!progress || !ready || !validChannel(target)} />
      {progress ? <View accessibilityLiveRegion="polite" style={styles.row}><ActivityIndicator /><Label style={styles.secondary}>{progress}</Label></View>
        : <Label style={styles.caption}>Downloads the latest compatible update and restarts the app. Updates that need a newer native build won’t be offered.</Label>}
    </>}
    <View style={{ gap: 5, marginTop: 10 }}>
      <Label style={styles.caption}>Version {Constants.expoConfig?.version} · {releaseLabel}</Label>
      <Label style={styles.caption}>Following {current || Updates.channel || 'production'} · {Updates.isEmbeddedLaunch ? 'Built-in version' : `Update ${Updates.updateId?.slice(0, 8) || 'development'}`}</Label>
      <Label style={styles.caption}>Runtime {Updates.runtimeVersion || 'development'}</Label>
    </View>
  </Section>;
}
