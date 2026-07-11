import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle, useSharedValue, withRepeat, withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import WoodButton from '../components/WoodButton';
import { MAX_LEVEL, getHighestCompletedLevel } from '../lib/progress';
import { COLORS, FONTS, FRAME_SHADOW, INSET_SHADOW, TILE_SHADOW, WELL_SHADOW } from '../lib/theme';

// chunk 1..MAX into rows of 3, padding the last row with nulls for alignment
function rowsOfThree(max: number): (number | null)[][] {
  const rows: (number | null)[][] = [];
  for (let i = 1; i <= max; i += 3) {
    const row: (number | null)[] = [i, i + 1, i + 2].map(n => (n <= max ? n : null));
    rows.push(row);
  }
  return rows;
}

export default function LevelsScreen() {
  const router = useRouter();
  const [completed, setCompleted] = useState(0);
  const pulse = useSharedValue(0);

  useFocusEffect(useCallback(() => { getHighestCompletedLevel().then(setCompleted); }, []));

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1100 }), -1, true);
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + 0.04 * pulse.value }] }));

  return (
    <LinearGradient colors={COLORS.boardBg} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>

          <View style={styles.titleFrame}>
            <Text style={styles.title}>LEVELS</Text>
          </View>

          <View style={styles.gridFrame}>
            <View style={styles.gridWell}>
              {rowsOfThree(MAX_LEVEL).map((row, r) => (
                <View key={r} style={styles.gridRow}>
                  {row.map((level, c) => {
                    if (level === null) return <View key={`s${c}`} style={styles.cellSlot} />;
                    const done = level <= completed;
                    const current = level === completed + 1 && level <= MAX_LEVEL;
                    const locked = level > completed + 1;
                    const inner = (
                      <Animated.View style={[styles.cellFill, current ? pulseStyle : null]}>
                        <LinearGradient
                          colors={current ? COLORS.current : done ? COLORS.tile : [COLORS.empty, COLORS.empty]}
                          start={{ x: 0.12, y: 0 }}
                          end={{ x: 0.88, y: 1 }}
                          style={[
                            styles.cell,
                            { boxShadow: locked ? WELL_SHADOW : TILE_SHADOW },
                            current ? styles.cellCurrent : null,
                          ]}
                        >
                          {!locked && (
                            <Text style={[styles.num, { color: current ? COLORS.ink : '#fff3e0' }]}>
                              {level}
                            </Text>
                          )}
                          {locked && <Icon name="lock" size={24} color="rgba(240,209,153,0.4)" />}
                          {done && (
                            <View style={styles.badge}>
                              <Icon name="star" size={14} color="#ffdf8a" />
                            </View>
                          )}
                        </LinearGradient>
                      </Animated.View>
                    );
                    return locked ? (
                      <View key={level} style={styles.cellSlot}>{inner}</View>
                    ) : (
                      <Pressable
                        key={level}
                        style={({ pressed }) => [styles.cellSlot, { opacity: pressed ? 0.85 : 1 }]}
                        onPress={() => router.push(`/play?level=${level}`)}
                      >
                        {inner}
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>

          <View style={{ flex: 1 }} />
          <WoodButton
            label="HOME"
            variant="secondary"
            onPress={() => router.replace('/')}
            icon={<Icon name="home" size={18} color={COLORS.gold} />}
          />

        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 20 },
  titleFrame: {
    alignSelf: 'center', paddingVertical: 14, paddingHorizontal: 44, borderRadius: 20,
    backgroundColor: COLORS.frame[0], marginBottom: 22, boxShadow: FRAME_SHADOW,
  },
  title: {
    fontFamily: FONTS.heading, fontSize: 30, color: COLORS.gold, letterSpacing: 3,
    textShadowColor: 'rgba(0,0,0,0.45)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 1,
  },
  gridFrame: {
    borderRadius: 24, backgroundColor: COLORS.frame[0], padding: 14,
    boxShadow: 'inset 0px 3px 3px rgba(255,220,180,0.2), inset 0px -4px 5px rgba(0,0,0,0.35), 0px 10px 20px rgba(60,34,14,0.3)',
  },
  gridWell: {
    borderRadius: 16, backgroundColor: 'rgba(40,22,8,0.3)', padding: 14, gap: 13, boxShadow: INSET_SHADOW,
  },
  gridRow: { flexDirection: 'row', gap: 13 },
  cellSlot: { flex: 1 },
  cellFill: { width: '100%' },
  cell: {
    width: '100%', aspectRatio: 1 / 0.92, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
  },
  cellCurrent: { borderWidth: 3, borderColor: '#ffe7b0' },
  num: {
    fontFamily: FONTS.heading, fontSize: 32,
    textShadowColor: 'rgba(40,20,6,0.4)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 2,
  },
  badge: {
    position: 'absolute', top: -6, right: -6, width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#dfa22e', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0px 2px 5px rgba(60,34,14,0.4)',
  },
});
