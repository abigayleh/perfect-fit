import { LinearGradient } from 'expo-linear-gradient';
import { StyleProp, View, ViewStyle } from 'react-native';
import { COLORS, TILE_SHADOW, WELL_SHADOW } from '../lib/theme';

type Props = {
  size?: number;
  radius?: number;
  variant?: 'filled' | 'empty' | 'obstacle';
  style?: StyleProp<ViewStyle>;
};

const GRAD_START = { x: 0.12, y: 0 };
const GRAD_END = { x: 0.88, y: 1 };

// Uniform wood tile. `filled` = embossed block, `empty` = recessed well,
// `obstacle` = a permanently blocked dark plug.
export default function Tile({ size, radius = 13, variant = 'filled', style }: Props) {
  const box: ViewStyle = {
    width: size,
    height: size,
    borderRadius: radius,
  };
  if (variant === 'empty') {
    return <View style={[box, { backgroundColor: COLORS.empty, boxShadow: WELL_SHADOW }, style]} />;
  }
  if (variant === 'obstacle') {
    return <View style={[box, { backgroundColor: COLORS.frame[1], boxShadow: WELL_SHADOW }, style]} />;
  }
  return (
    <LinearGradient
      colors={COLORS.tile}
      start={GRAD_START}
      end={GRAD_END}
      style={[box, { boxShadow: TILE_SHADOW }, style]}
    />
  );
}
