// "Toasted Board" theme — warm wood palette, embossed shadows, fonts.
// Ported from the Perfect Fit 1B design. RN 0.86 supports multi-layer + inset boxShadow.

export const COLORS = {
  bg: '#E7E0D4',
  boardBg: ['#F0DBB8', '#E2C596'] as const,
  frame: ['#6b4423', '#42260f'] as const,
  tile: ['#c68d48', '#8f5827'] as const,
  tileTop: '#c68d48',
  tileBottom: '#8f5827',
  current: ['#e8b866', '#cf9440'] as const,
  primaryBtn: ['#b57e3c', '#8a5827'] as const,
  secondaryBtn: ['#8a5a30', '#6b4321'] as const,
  cream: ['#fbeed7', '#f0d9b6'] as const,
  empty: 'rgba(74,42,18,.14)',
  gold: '#f3d9a8',
  goldBright: '#e7b54a',
  ink: '#4a2a12',
  inkSoft: '#5f3616',
  danger: '#a8482f',
  star: '#ffce55',
  starStroke: '#c98a1e',
};

// Embossed tile face
export const TILE_SHADOW =
  'inset 0px 3px 1px rgba(255,235,205,0.4), inset 0px -7px 3px rgba(40,20,6,0.4), 0px 7px 13px rgba(70,40,16,0.32)';
// Recessed empty well
export const WELL_SHADOW =
  'inset 0px 5px 10px rgba(50,26,8,0.32), inset 0px -2px 3px rgba(255,235,200,0.28)';
// Raised dark frame
export const FRAME_SHADOW =
  'inset 0px 3px 2px rgba(255,220,180,0.28), inset 0px -6px 5px rgba(0,0,0,0.4), 0px 12px 24px rgba(60,34,14,0.4)';
// Recessed dark inset (board/grid wells)
export const INSET_SHADOW = 'inset 0px 4px 9px rgba(0,0,0,0.4)';
// Primary button emboss (3D press)
export const PRIMARY_BTN_SHADOW =
  'inset 0px 3px 1px rgba(255,230,190,0.45), inset 0px -8px 2px rgba(50,28,10,0.5), 0px 10px 0px rgba(70,42,18,0.45), 0px 14px 18px rgba(60,34,14,0.3)';
export const SECONDARY_BTN_SHADOW =
  'inset 0px 2px 1px rgba(255,220,180,0.3), inset 0px -6px 2px rgba(40,22,8,0.45), 0px 7px 0px rgba(58,34,14,0.4), 0px 11px 14px rgba(60,34,14,0.24)';

export const FONTS = {
  headingBold: 'Baloo2_700Bold',
  heading: 'Baloo2_800ExtraBold',
  body: 'Nunito_700Bold',
  bodySemi: 'Nunito_600SemiBold',
};
