import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg';

export type IconName =
  | 'gear' | 'play' | 'star' | 'lock' | 'home' | 'back' | 'chevron'
  | 'arrow' | 'replay' | 'sound' | 'music' | 'vibrate' | 'question';

type Props = { name: IconName; size?: number; color?: string; strokeWidth?: number };

// Single SVG icon set ported from the design. Stroke icons use `color`; filled use it as fill.
export default function Icon({ name, size = 22, color = '#f0d199', strokeWidth = 2.3 }: Props) {
  const stroke = { stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };

  switch (name) {
    case 'gear':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx={12} cy={12} r={3.1} fill="none" stroke={color} strokeWidth={2} />
          <G stroke={color} strokeWidth={2} strokeLinecap="round">
            <Line x1={12} y1={2.5} x2={12} y2={5.3} /><Line x1={12} y1={18.7} x2={12} y2={21.5} />
            <Line x1={2.5} y1={12} x2={5.3} y2={12} /><Line x1={18.7} y1={12} x2={21.5} y2={12} />
            <Line x1={5.3} y1={5.3} x2={7.3} y2={7.3} /><Line x1={16.7} y1={16.7} x2={18.7} y2={18.7} />
            <Line x1={18.7} y1={5.3} x2={16.7} y2={7.3} /><Line x1={7.3} y1={16.7} x2={5.3} y2={18.7} />
          </G>
        </Svg>
      );
    case 'play':
      return (
        <Svg width={size} height={size * 1.1} viewBox="0 0 20 22">
          <Path d="M2 2.5v17a1.5 1.5 0 002.3 1.3l14-8.5a1.5 1.5 0 000-2.6l-14-8.5A1.5 1.5 0 002 2.5z" fill={color} />
        </Svg>
      );
    case 'star':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7z" fill={color} stroke="#c98a1e" strokeWidth={1} />
        </Svg>
      );
    case 'lock':
      return (
        <Svg width={size} height={size * 1.08} viewBox="0 0 24 26">
          <Rect x={4} y={11} width={16} height={12} rx={3.5} fill={color} />
          <Path d="M7.5 11V8a4.5 4.5 0 019 0v3" stroke={color} strokeWidth={2.4} fill="none" strokeLinecap="round" />
        </Svg>
      );
    case 'home':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M4 11L12 4l8 7" {...stroke} />
          <Path d="M6 10v9h12v-9" {...stroke} />
        </Svg>
      );
    case 'back':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M14 6l-6 6 6 6" {...stroke} strokeWidth={2.4} />
        </Svg>
      );
    case 'chevron':
      return (
        <Svg width={size * 0.6} height={size} viewBox="0 0 10 17">
          <Path d="M1.5 1.5L8 8.5l-6.5 7" stroke={color} strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'arrow':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M5 12h13M13 6l6 6-6 6" stroke={color} strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'replay':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M9 5L4 9.5l5 4.5" {...stroke} />
          <Path d="M4 9.5h9a6 6 0 110 12H7" {...stroke} />
        </Svg>
      );
    case 'sound':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M4 9v6h4l5 4V5L8 9H4z" fill={color} />
          <Path d="M16 8.5a4.5 4.5 0 010 7" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" />
        </Svg>
      );
    case 'music':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M9 18V6l10-2v12" {...stroke} strokeWidth={2} />
          <Circle cx={6.5} cy={18} r={2.6} fill={color} />
          <Circle cx={16.5} cy={16} r={2.6} fill={color} />
        </Svg>
      );
    case 'vibrate':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x={7} y={3} width={10} height={18} rx={2.5} stroke={color} strokeWidth={2} fill="none" />
          <Path d="M3 9v6M21 9v6" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" />
        </Svg>
      );
    case 'question':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M9.2 9a2.8 2.8 0 115.3 1.2c-.5 1-1.7 1.4-2.2 2.3-.2.4-.3.8-.3 1.5" stroke={color} strokeWidth={2.2} fill="none" strokeLinecap="round" />
          <Circle cx={12} cy={18} r={1.4} fill={color} />
        </Svg>
      );
  }
}
