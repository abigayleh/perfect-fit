import AsyncStorage from '@react-native-async-storage/async-storage';

export const MAX_LEVEL = 10;

const STORAGE_KEY = 'perfect-fit-progress-v1';

type ProgressState = {
  highestCompletedLevel: number;
};

function clampLevel(level: number): number {
  return Math.min(Math.max(level, 0), MAX_LEVEL);
}

async function readState(): Promise<ProgressState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { highestCompletedLevel: 0 };
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    return { highestCompletedLevel: clampLevel(parsed.highestCompletedLevel ?? 0) };
  } catch {
    return { highestCompletedLevel: 0 };
  }
}

export async function getHighestCompletedLevel(): Promise<number> {
  const state = await readState();
  return state.highestCompletedLevel;
}

export async function getHighestUnlockedLevel(): Promise<number> {
  const highest = await getHighestCompletedLevel();
  return Math.min(MAX_LEVEL, highest + 1);
}

export async function getLastUncompletedLevel(): Promise<number> {
  const highest = await getHighestCompletedLevel();
  return highest >= MAX_LEVEL ? MAX_LEVEL : highest + 1;
}

export async function isLevelUnlocked(level: number): Promise<boolean> {
  const unlocked = await getHighestUnlockedLevel();
  return level >= 1 && level <= unlocked;
}

export async function resetProgress(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export async function markLevelCompleted(level: number): Promise<void> {
  const clamped = clampLevel(level);
  const current = await getHighestCompletedLevel();
  if (clamped <= current) return;
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ highestCompletedLevel: clamped }),
  );
}
