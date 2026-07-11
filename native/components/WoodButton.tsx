import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { COLORS, FONTS, PRIMARY_BTN_SHADOW, SECONDARY_BTN_SHADOW } from '../lib/theme';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  icon?: React.ReactNode;
  iconRight?: boolean;
  style?: StyleProp<ViewStyle>;
  height?: number;
  fontSize?: number;
};

// 3D pressed-wood button. Primary = tall gold, secondary = darker brown.
export default function WoodButton({
  label, onPress, variant = 'primary', icon, iconRight, style, height, fontSize,
}: Props) {
  const primary = variant === 'primary';
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }, style]}>
      <LinearGradient
        colors={primary ? COLORS.primaryBtn : COLORS.secondaryBtn}
        style={[
          styles.btn,
          {
            height: height ?? (primary ? 68 : 62),
            boxShadow: primary ? PRIMARY_BTN_SHADOW : SECONDARY_BTN_SHADOW,
          },
        ]}
      >
        {icon && !iconRight ? icon : null}
        <Text
          style={{
            color: primary ? '#fff5e6' : COLORS.gold,
            fontFamily: primary ? FONTS.heading : FONTS.headingBold,
            fontSize: fontSize ?? (primary ? 26 : 20),
            letterSpacing: primary ? 2 : 1.5,
          }}
        >
          {label}
        </Text>
        {icon && iconRight ? icon : null}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
});

// Recessed dark frame container (level grids, board wrapper).
export function Frame({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[frameStyles.frame, style]}>{children}</View>;
}

const frameStyles = StyleSheet.create({
  frame: {
    borderRadius: 24,
    backgroundColor: COLORS.frame[0],
  },
});
