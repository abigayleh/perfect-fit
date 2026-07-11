import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon, { IconName } from '../components/Icon';
import WoodButton from '../components/WoodButton';
import { resetProgress } from '../lib/progress';
import { Settings, useSettings } from '../lib/settings';
import { COLORS, FONTS, FRAME_SHADOW, TILE_SHADOW } from '../lib/theme';

function IconTile({ name, danger }: { name: IconName; danger?: boolean }) {
  return (
    <LinearGradient
      colors={danger ? ['#b4553a', '#8a3a26'] : COLORS.tile}
      start={{ x: 0.12, y: 0 }}
      end={{ x: 0.88, y: 1 }}
      style={styles.iconTile}
    >
      <Icon name={name} size={21} color="#fff3e0" />
    </LinearGradient>
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <LinearGradient
      colors={on ? COLORS.current : ['rgba(74,42,18,0.4)', 'rgba(74,42,18,0.4)']}
      style={[styles.toggle, { boxShadow: 'inset 0px 2px 3px rgba(40,20,6,0.28)' }]}
    >
      <View style={[styles.knob, { left: on ? 28 : 3, backgroundColor: on ? '#fff7ea' : '#e9dcc4' }]} />
    </LinearGradient>
  );
}

const TOGGLE_ROWS: { key: keyof Settings; label: string; icon: IconName }[] = [
  { key: 'sound', label: 'Sound Effects', icon: 'sound' },
  { key: 'music', label: 'Music', icon: 'music' },
  { key: 'vibration', label: 'Vibration', icon: 'vibrate' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, toggle } = useSettings();

  function confirmRestart() {
    Alert.alert('Restart Progress', 'This will lock every level except the first. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Restart', style: 'destructive', onPress: () => void resetProgress() },
    ]);
  }

  return (
    <LinearGradient colors={COLORS.boardBg} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>

          <View style={styles.titleRow}>
            <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.8 : 1 }]}>
              <Icon name="back" size={20} />
            </Pressable>
            <View style={styles.titleFrame}>
              <Text style={styles.title}>SETTINGS</Text>
            </View>
          </View>

          <View style={styles.panel}>
            {TOGGLE_ROWS.map(row => (
              <Pressable key={row.key} onPress={() => toggle(row.key)} style={styles.row}>
                <IconTile name={row.icon} />
                <Text style={styles.rowLabel}>{row.label}</Text>
                <Toggle on={settings[row.key]} />
              </Pressable>
            ))}

            <Pressable style={styles.row} onPress={() => Alert.alert('How to Play', 'Drag every wood block into the board so it fills up with no gaps. Complete the board to win the level.')}>
              <IconTile name="question" />
              <Text style={styles.rowLabel}>How to Play</Text>
              <Icon name="chevron" size={17} color="#b58a52" />
            </Pressable>

            <Pressable style={[styles.row, styles.rowLast]} onPress={confirmRestart}>
              <IconTile name="replay" danger />
              <Text style={[styles.rowLabel, { color: COLORS.danger }]}>Restart Progress</Text>
            </Pressable>
          </View>

          <View style={{ flex: 1 }} />
          <WoodButton label="DONE" variant="secondary" onPress={() => router.back()} icon={<Icon name="home" size={18} color={COLORS.gold} />} />

        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 26 },
  backBtn: {
    position: 'absolute', left: 0, width: 50, height: 50, borderRadius: 15, backgroundColor: COLORS.frame[0],
    alignItems: 'center', justifyContent: 'center',
    boxShadow: 'inset 0px 2px 1px rgba(255,220,180,0.3), inset 0px -4px 3px rgba(0,0,0,0.35), 0px 5px 11px rgba(60,34,14,0.32)',
  },
  titleFrame: { paddingVertical: 14, paddingHorizontal: 40, borderRadius: 20, backgroundColor: COLORS.frame[0], boxShadow: FRAME_SHADOW },
  title: {
    fontFamily: FONTS.heading, fontSize: 26, color: COLORS.gold, letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.45)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 1,
  },
  panel: {
    borderRadius: 24, paddingHorizontal: 20, backgroundColor: COLORS.cream[0],
    boxShadow: 'inset 0px 2px 3px rgba(255,255,255,0.7), inset 0px -4px 6px rgba(150,110,60,0.15), 0px 10px 20px rgba(60,34,14,0.16)',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 15, paddingVertical: 19,
    borderBottomWidth: 1.5, borderBottomColor: 'rgba(120,74,36,0.14)',
  },
  rowLast: { borderBottomWidth: 0 },
  rowLabel: { flex: 1, fontFamily: FONTS.headingBold, fontSize: 20, color: COLORS.inkSoft },
  iconTile: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', boxShadow: TILE_SHADOW },
  toggle: { width: 58, height: 33, borderRadius: 999, justifyContent: 'center' },
  knob: { position: 'absolute', top: 3, width: 27, height: 27, borderRadius: 999, boxShadow: '0px 2px 4px rgba(60,34,14,0.4)' },
});
