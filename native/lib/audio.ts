import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import type { Settings } from './settings';

// App-wide audio: a looping music track and a one-shot click SFX.
// Players are created once; `applyAudioSettings` keeps them in sync with the toggles.
let music: AudioPlayer | null = null;
let click: AudioPlayer | null = null;
let soundOn = true;
let musicOn = false;

export async function initAudio() {
  if (music) return;
  try {
    await setAudioModeAsync({ playsInSilentMode: true });
    music = createAudioPlayer(require('../assets/audio/music.mp3'));
    music.loop = true;
    music.volume = 0.4;
    click = createAudioPlayer(require('../assets/audio/click.mp3'));
    click.volume = 0.6;
  } catch {}
}

// Sync players with current settings — call on load and after every toggle.
export function applyAudioSettings(s: Settings) {
  soundOn = s.sound;
  musicOn = s.music;
  if (musicOn) music?.play();
  else music?.pause();
}

export function playClick() {
  if (!soundOn || !click) return;
  click.seekTo(0).catch(() => {});
  click.play();
}

// Background/foreground lifecycle — resuming respects the music toggle.
export function pauseMusic() { music?.pause(); }
export function resumeMusic() { if (musicOn) music?.play(); }
