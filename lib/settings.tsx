import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type DataSource = 'sample' | 'live';
const SOURCE_KEY = 'charging-map:data-source:v1';
const SettingsContext = createContext<{
  source: DataSource;
  setSource: (source: DataSource) => Promise<void>;
}>({ source: 'sample', setSource: async () => {} });

export function SettingsProvider({ children }: React.PropsWithChildren) {
  const [source, updateSource] = useState<DataSource>('sample');
  const [ready, setReady] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem(SOURCE_KEY)
      .then(value => updateSource(value === 'live' ? 'live' : 'sample'))
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);
  async function setSource(next: DataSource) {
    await AsyncStorage.setItem(SOURCE_KEY, next);
    updateSource(next);
  }
  return <SettingsContext.Provider value={{ source, setSource }}>{ready ? children : null}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);
