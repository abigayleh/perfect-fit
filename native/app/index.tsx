import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle, useSharedValue, withRepeat, withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import Tile from '../components/Tile';
import WoodButton from '../components/WoodButton';
import { getLastUncompletedLevel } from '../lib/progress';
import { COLORS, FONTS, FRAME_SHADOW, INSET_SHADOW } from '../lib/theme';

// 3×3 preview: true = wood block, false = empty well
const MINI = [true, false, true, true, true, true, false, true, false];

export default function HomeScreen() {
  const router = useRouter();
  const [playLevel, setPlayLevel] = useState(1);
  const float = useSharedValue(0);

  useFocusEffect(useCallback(() => { getLastUncompletedLevel().then(setPlayLevel); }, []));

  useEffect(() => {
    float.value = withRepeat(withTiming(1, { duration: 2500 }), -1, true);
  }, []);

  const floatStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -8 * float.value }] }));

  return (
    <LinearGradient colors={COLORS.boardBg} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.inner}>

          <View style={styles.topRow}>
            <Pressable
              onPress={() => router.push('/settings')}
              style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.85 : 1 }]}
            >
              <Icon name="gear" size={21} />
            </Pressable>
          </View>

          <View style={styles.center}>
            <View style={styles.titleFrame}>
              <Text style={styles.titlePerfect}>PERFECT</Text>
              <Text style={styles.titleFit}>FIT</Text>
            </View>

            <Animated.View style={[styles.boardFrame, floatStyle]}>
              <View style={styles.boardWell}>
                <View style={styles.miniGrid}>
                  {MINI.map((filled, i) => (
                    <Tile key={i} size={40} radius={11} variant={filled ? 'filled' : 'empty'} />
                  ))}
                </View>
              </View>
            </Animated.View>
          </View>

          <View style={styles.buttons}>
            <WoodButton
              label="PLAY"
              onPress={() => router.push(`/play?level=${playLevel}`)}
              icon={<Icon name="play" size={20} color="#fff5e6" />}
            />
            <WoodButton label="LEVELS" variant="secondary" onPress={() => router.push('/levels')} />
          </View>

        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 26, paddingVertical: 20, justifyContent: 'space-between' },
  topRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  iconBtn: {
    width: 50, height: 50, borderRadius: 15, backgroundColor: COLORS.frame[0],
    alignItems: 'center', justifyContent: 'center',
    boxShadow: 'inset 0px 2px 1px rgba(255,220,180,0.3), inset 0px -4px 3px rgba(0,0,0,0.35), 0px 5px 11px rgba(60,34,14,0.35)',
  },
  center: { alignItems: 'center', gap: 40 },
  titleFrame: {
    paddingTop: 24, paddingBottom: 24, paddingHorizontal: 34, borderRadius: 26,
    backgroundColor: COLORS.frame[0], alignItems: 'center', boxShadow: FRAME_SHADOW,
  },
  titlePerfect: {
    fontFamily: FONTS.heading, fontSize: 50, color: '#f3d9a8', letterSpacing: -1, lineHeight: 58,
    textShadowColor: 'rgba(0,0,0,0.45)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 1,
  },
  titleFit: {
    fontFamily: FONTS.heading, fontSize: 50, color: COLORS.goldBright, letterSpacing: 2, lineHeight: 58, marginTop: -8,
    textShadowColor: 'rgba(0,0,0,0.45)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 1,
  },
  boardFrame: {
    padding: 12, borderRadius: 24, backgroundColor: COLORS.frame[0],
    boxShadow: '0px 12px 22px rgba(60,34,14,0.35), inset 0px 2px 2px rgba(255,220,180,0.22), inset 0px -3px 4px rgba(0,0,0,0.3)',
  },
  boardWell: {
    borderRadius: 15, backgroundColor: 'rgba(40,22,8,0.34)', padding: 10, boxShadow: INSET_SHADOW,
  },
  miniGrid: { flexDirection: 'row', flexWrap: 'wrap', width: 40 * 3 + 7 * 2, gap: 7 },
  buttons: { gap: 15 },
});
