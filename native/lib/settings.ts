import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'perfect-fit-settings-v1';

export type Settings = { sound: boolean; music: boolean; vibration: boolean };

const DEFAULTS: Settings = { sound: true, music: false, vibration: true };

export async function getSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return DEFAULTS;
  }
}

async function saveSettings(s: Settings): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

// Load once on mount; `toggle` persists and updates local state.
export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);

  useEffect(() => { getSettings().then(setSettings); }, []);

  const toggle = (key: keyof Settings) => {
    setSettings(prev => {
      const next = { ...prev, [key]: !prev[key] };
      void saveSettings(next);
      return next;
    });
  };

  return { settings, toggle };
}
