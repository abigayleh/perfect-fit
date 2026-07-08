import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { getLastUncompletedLevel } from '../lib/progress';

const WOOD_DARK = '#8F5A2D';
const WOOD_MID = '#A86631';

// 0 = empty board cell, 1/2/3 = filled piece
const DEMO_BOARD = [
  [1, 1, 2, 2],
  [1, 1, 2, 2],
  [3, 3, 0, 0],
  [3, 3, 0, 0],
] as const;

const DEMO_COLORS: Record<number, readonly [string, string, string]> = {
  1: ['#C09050', '#8F5A2D', '#6B3F18'],
  2: ['#D4A96A', '#B77940', '#8A501E'],
  3: ['#B88040', '#9C5E28', '#754018'],
};

export default function HomeScreen() {
  const router = useRouter();
  const [playLevel, setPlayLevel] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      getLastUncompletedLevel().then(setPlayLevel);
    }, []),
  );

  return (
    <LinearGradient colors={['#fff7ed', '#ffedd5', '#fed7aa']} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.inner}>

          <View style={[styles.titleBox, { backgroundColor: WOOD_DARK }]}>
            <Text style={styles.title}>PERFECT FIT</Text>
          </View>

          {/* Mini board: 3 pieces placed, one 2×2 gap showing where the last piece fits */}
          <View style={styles.miniBoard}>
            {DEMO_BOARD.map((row, r) => (
              <View key={r} style={styles.miniBoardRow}>
                {row.map((piece, c) => (
                  <View key={c} style={styles.miniCell}>
                    {piece > 0 && (
                      <LinearGradient
                        colors={DEMO_COLORS[piece]}
                        start={{ x: 0.15, y: 0 }}
                        end={{ x: 0.85, y: 1 }}
                        style={StyleSheet.absoluteFill}
                      />
                    )}
                  </View>
                ))}
              </View>
            ))}
          </View>

          <View style={styles.buttons}>
            {playLevel !== null ? (
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  { backgroundColor: WOOD_MID, opacity: pressed ? 0.85 : 1 },
                ]}
                onPress={() => router.push(`/play?level=${playLevel}`)}
              >
                <Text style={styles.buttonText}>PLAY</Text>
              </Pressable>
            ) : (
              <View style={[styles.button, { backgroundColor: WOOD_MID, justifyContent: 'center' }]}>
                <ActivityIndicator color="#fff7ed" />
              </View>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: WOOD_MID, opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={() => router.push('/levels')}
            >
              <Text style={styles.buttonText}>LEVEL SELECTION</Text>
            </Pressable>
          </View>

        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  inner: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleBox: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#331b0c',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    color: '#fff8ef',
    fontSize: 36,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 4,
  },
  miniBoard: {
    alignSelf: 'center',
    shadowColor: '#331b0c',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  miniBoardRow: {
    flexDirection: 'row',
  },
  miniCell: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(253,186,116,0.6)',
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  buttons: {
    width: '100%',
    gap: 12,
  },
  button: {
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    shadowColor: '#331b0c',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#fff8ef',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 3,
  },
});
