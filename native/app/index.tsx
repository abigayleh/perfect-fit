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
const WOOD_LIGHT = '#B77940';

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

          {/* L + J tetrominoes: assembled they form a perfect 2×4 rectangle */}
          <View style={styles.decorContainer}>
            {([[0,0],[0,1],[1,0],[2,0]] as [number,number][]).map(([r, c]) => (
              <LinearGradient
                key={`a-${r}-${c}`}
                colors={['#C09050', '#8F5A2D', '#6B3F18']}
                start={{ x: 0.15, y: 0 }}
                end={{ x: 0.85, y: 1 }}
                style={[styles.decorCell, { left: c * 42 + 10, top: r * 42 + 12 }]}
              />
            ))}
            {([[1,1],[2,1],[3,0],[3,1]] as [number,number][]).map(([r, c]) => (
              <LinearGradient
                key={`b-${r}-${c}`}
                colors={['#D4A96A', '#B77940', '#8A501E']}
                start={{ x: 0.15, y: 0 }}
                end={{ x: 0.85, y: 1 }}
                style={[styles.decorCell, { left: c * 42 + 30, top: r * 42 + 28 }]}
              />
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
  decorRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 120,
  },
  decorLeft: {
    position: 'relative',
    width: 76,
    height: 120,
  },
  decorRight: {
    position: 'relative',
    width: 76,
    height: 120,
  },
  decorCell: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 6,
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
