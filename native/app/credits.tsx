import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import WoodButton from '../components/WoodButton';
import { COLORS, FONTS, FRAME_SHADOW } from '../lib/theme';

const TRACK_URL = 'https://uppbeat.io/t/sky-toes/sandbox-serenade';

export default function CreditsScreen() {
  const router = useRouter();

  return (
    <LinearGradient colors={COLORS.boardBg} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>

          <View style={styles.titleRow}>
            <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.8 : 1 }]}>
              <Icon name="back" size={20} />
            </Pressable>
            <View style={styles.titleFrame}>
              <Text style={styles.title}>CREDITS</Text>
            </View>
          </View>

          <View style={styles.panel}>
            <Text style={styles.heading}>Music</Text>
            <Text style={styles.body}>Sandbox Serenade — sky-toes</Text>
            <Pressable onPress={() => Linking.openURL(TRACK_URL).catch(() => {})}>
              <Text style={styles.link}>Music from Uppbeat (free for Creators)</Text>
            </Pressable>
            <Text style={styles.license}>License code: L9M0UZ4WM04EEIEU</Text>
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
    borderRadius: 24, paddingHorizontal: 24, paddingVertical: 22, gap: 8, backgroundColor: COLORS.cream[0],
    boxShadow: 'inset 0px 2px 3px rgba(255,255,255,0.7), inset 0px -4px 6px rgba(150,110,60,0.15), 0px 10px 20px rgba(60,34,14,0.16)',
  },
  heading: { fontFamily: FONTS.heading, fontSize: 22, color: COLORS.inkSoft, marginBottom: 2 },
  body: { fontFamily: FONTS.headingBold, fontSize: 18, color: COLORS.ink },
  link: { fontFamily: FONTS.body, fontSize: 16, color: '#9a5a1e', textDecorationLine: 'underline' },
  license: { fontFamily: FONTS.bodySemi, fontSize: 14, color: COLORS.inkSoft, opacity: 0.8 },
});
