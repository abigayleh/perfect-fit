export const MAX_LEVEL = 10;

const STORAGE_KEY = "perfect-fit-progress-v1";

type ProgressState = {
  highestCompletedLevel: number;
};

function clampLevel(level: number): number {
  return Math.min(Math.max(level, 0), MAX_LEVEL);
}

function getDefaultState(): ProgressState {
  return { highestCompletedLevel: 0 };
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readState(): ProgressState {
  if (!canUseStorage()) {
    return getDefaultState();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return getDefaultState();
    }

    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    return {
      highestCompletedLevel: clampLevel(parsed.highestCompletedLevel ?? 0),
    };
  } catch {
    return getDefaultState();
  }
}

function writeState(state: ProgressState): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ highestCompletedLevel: clampLevel(state.highestCompletedLevel) }),
  );
}

export function getHighestCompletedLevel(): number {
  return readState().highestCompletedLevel;
}

export function getHighestUnlockedLevel(): number {
  const highestCompleted = getHighestCompletedLevel();
  return Math.min(MAX_LEVEL, highestCompleted + 1);
}

export function getLastUncompletedLevel(): number {
  const highestCompleted = getHighestCompletedLevel();
  if (highestCompleted >= MAX_LEVEL) {
    return MAX_LEVEL;
  }

  return highestCompleted + 1;
}

export function isLevelUnlocked(level: number): boolean {
  return level >= 1 && level <= getHighestUnlockedLevel();
}

export function markLevelCompleted(level: number): void {
  const clampedLevel = clampLevel(level);
  const current = readState();

  if (clampedLevel <= current.highestCompletedLevel) {
    return;
  }

  writeState({ highestCompletedLevel: clampedLevel });
}
