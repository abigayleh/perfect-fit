import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MAX_LEVEL, getHighestUnlockedLevel } from '../lib/progress';

const WOOD_DARK = '#8F5A2D';
const WOOD_MID = '#A86631';

export default function LevelsScreen() {
  const router = useRouter();
  const [highestUnlocked, setHighestUnlocked] = useState(1);

  useFocusEffect(
    useCallback(() => {
      getHighestUnlockedLevel().then(setHighestUnlocked);
    }, []),
  );

  return (
    <LinearGradient colors={['#fff7ed', '#ffedd5', '#fed7aa']} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>

          <View style={[styles.titleBox, { backgroundColor: WOOD_DARK }]}>
            <Text style={styles.title}>LEVELS</Text>
          </View>

          <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
            {Array.from({ length: MAX_LEVEL }, (_, i) => {
              const level = i + 1;
              const locked = level > highestUnlocked;
              return locked ? (
                <View key={level} style={styles.lockedCell}>
                  <Text style={styles.lockedNum}>{level}</Text>
                </View>
              ) : (
                <Pressable
                  key={level}
                  style={({ pressed }) => [
                    styles.levelCell,
                    { backgroundColor: WOOD_MID, opacity: pressed ? 0.85 : 1 },
                  ]}
                  onPress={() => router.push(`/play?level=${level}`)}
                >
                  <Text style={styles.levelNum}>{level}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Pressable
            onPress={() => router.replace('/')}
            style={({ pressed }) => [styles.homeBtn, { opacity: pressed ? 0.85 : 1 }]}
          >
            <Text style={styles.homeBtnText}>HOME</Text>
          </Pressable>

        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(168,102,49,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: {
    fontSize: 30,
    color: '#7E4D2A',
    lineHeight: 36,
    fontWeight: '300',
  },
  titleBox: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#331b0c',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    color: '#fff8ef',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  levelCell: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#331b0c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  levelNum: {
    color: '#fff8ef',
    fontSize: 36,
    fontWeight: '900',
  },
  lockedCell: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(253,186,116,0.5)',
    backgroundColor: 'rgba(254,215,170,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedNum: {
    color: 'rgba(154,74,16,0.4)',
    fontSize: 36,
    fontWeight: '900',
  },
});
