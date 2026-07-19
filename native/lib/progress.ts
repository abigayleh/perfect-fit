import AsyncStorage from '@react-native-async-storage/async-storage';

export const MAX_LEVEL = 100;

const STORAGE_KEY = 'perfect-fit-progress-v1';
const STARS_KEY = 'perfect-fit-stars-v1';

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

// Per-level best star rating (1-3), keyed by level number.
async function readStars(): Promise<Record<number, number>> {
  try {
    const raw = await AsyncStorage.getItem(STARS_KEY);
    return raw ? (JSON.parse(raw) as Record<number, number>) : {};
  } catch {
    return {};
  }
}

export async function getStars(level: number): Promise<number> {
  return (await readStars())[level] ?? 0;
}

// Keeps the player's best result; never downgrades an earlier higher score.
export async function recordStars(level: number, stars: number): Promise<void> {
  const all = await readStars();
  if (stars <= (all[level] ?? 0)) return;
  all[level] = stars;
  await AsyncStorage.setItem(STARS_KEY, JSON.stringify(all));
}
