import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector, ScrollView as GHScrollView } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate, measure, runOnJS, useAnimatedRef, useAnimatedStyle, useSharedValue,
  withDelay, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import Tile from '../components/Tile';
import WoodButton from '../components/WoodButton';
import {
  BoardCell, Piece,
  canPlacePiece, createEmptyBoard, createLevelPieces, getBoardSize, getLevelDifficulty,
  getMaxRotatedBounds, getShapeBounds, normalizeBoard, placePiece, rotateCellsClockwise,
} from '../lib/levels';
import { computeAnchor } from '../lib/drag-geometry';
import { MAX_LEVEL, markLevelCompleted } from '../lib/progress';
import { playClick } from '../lib/audio';
import { getSettings } from '../lib/settings';
import { COLORS, FONTS, FRAME_SHADOW, INSET_SHADOW, TILE_SHADOW } from '../lib/theme';

const TRAY_CELL = 34;
const TRAY_GAP = 6;
const BOARD_PADDING = 24;
const TILE_INSET = 6; // visual gap; hit-testing stays on the cellSize grid
const DRAG_SHADOW = '0px 12px 18px rgba(30,16,4,0.45)'; // lift shadow under a dragged piece

function fmtTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// Scattered confetti dots on the Level Complete screen (static, per design)
const CONFETTI = [
  { top: 150, left: 44, width: 12, height: 12, borderRadius: 3, backgroundColor: '#e7b54a', transform: [{ rotate: '20deg' }] },
  { top: 210, right: 52, width: 11, height: 11, borderRadius: 6, backgroundColor: '#c68d48' },
  { top: 120, right: 80, width: 10, height: 10, borderRadius: 3, backgroundColor: '#8a5827', transform: [{ rotate: '-15deg' }] },
  { top: 250, left: 70, width: 9, height: 9, borderRadius: 5, backgroundColor: '#e7b54a' },
  { top: 300, right: 60, width: 12, height: 12, borderRadius: 3, backgroundColor: '#e7b54a', transform: [{ rotate: '35deg' }] },
] as const;

export default function PlayScreen() {
  const router = useRouter();
  const { level: levelParam } = useLocalSearchParams<{ level: string }>();
  const { width: screenWidth } = useWindowDimensions();

  const requestedLevel = useMemo(() => {
    const n = parseInt(levelParam ?? '1', 10);
    if (isNaN(n)) return 1;
    return Math.min(Math.max(n, 1), MAX_LEVEL);
  }, [levelParam]);

  const initialPieces = useMemo(() => createLevelPieces(requestedLevel), [requestedLevel]);

  const [level, setLevel] = useState(requestedLevel);
  const boardSize = getBoardSize(level);

  const cellSize = useMemo(
    () => Math.floor((Math.min(screenWidth, 420) - BOARD_PADDING * 2 - 52) / boardSize),
    [screenWidth, boardSize],
  );
  // The floating block sits directly on its landing cells (WYSIWYG) — no offset between the
  // block and the green highlight. Small nudge up so the fingertip doesn't fully cover it.
  const DRAG_LIFT = cellSize * 0.35;

  const [levelPieces, setLevelPieces] = useState<Piece[]>(initialPieces);
  const [board, setBoard] = useState<BoardCell[][]>(() => createEmptyBoard(getBoardSize(requestedLevel)));
  const [tray, setTray] = useState<Piece[]>(initialPieces);
  const [dragPiece, setDragPiece] = useState<Piece | null>(null);
  const [dropPos, setDropPos] = useState<{ row: number; col: number; valid: boolean } | null>(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [showComplete, setShowComplete] = useState(false);
  const [merging, setMerging] = useState(false);
  const [moves, setMoves] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const startRef = useRef(Date.now());
  const vibrateRef = useRef(true);
  useEffect(() => { getSettings().then(s => { vibrateRef.current = s.vibration; }); }, []);

  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  // Board's window origin, re-measured every gesture event (see syncOrigin) so screen→board
  // conversion never drifts if the board shifts or the first measure() comes back null.
  const originX = useSharedValue(0);
  const originY = useSharedValue(0);
  const boardScale = useSharedValue(1);
  const merge = useSharedValue(0);
  const shine = useSharedValue(0);
  const overlay = useSharedValue(0);
  const pop = useSharedValue(0);
  // Dragged piece px bounds — used to re-center it under the finger.
  const dragW = useSharedValue(cellSize);
  const dragH = useSharedValue(cellSize);

  const boardRef = useAnimatedRef<Animated.View>();
  const dragPieceRef = useRef<Piece | null>(null);
  const placedPiecesRef = useRef<Map<string, Piece>>(new Map());
  const boardStateRef = useRef(board);
  boardStateRef.current = board;
  const levelRef = useRef(level);
  levelRef.current = level;

  const isComplete = tray.length === 0 && !dragPiece;
  const safeBoard = useMemo(() => normalizeBoard(board), [board]);

  // Landing cell = where the VISIBLE floating piece is, snapped to the grid. Delegates to the
  // shared drag-geometry helper so the green highlight, the floating block, and the actual drop
  // all derive from one calculation (see native/lib/drag-geometry.ts).
  const anchorFor = (fx: number, fy: number, piece: Piece) =>
    computeAnchor(fx, fy, piece, { cellSize, boardSize, dragLift: DRAG_LIFT });

  function computeDropPos(fx: number, fy: number) {
    const piece = dragPieceRef.current;
    const a = piece ? anchorFor(fx, fy, piece) : null;
    const next = a && piece
      ? { row: a.row, col: a.col, valid: canPlacePiece(boardStateRef.current, piece, a.row, a.col) }
      : null;
    // Only re-render when the target cell or validity actually changes
    setDropPos(prev => {
      if (!prev && !next) return prev;
      if (prev && next && prev.row === next.row && prev.col === next.col && prev.valid === next.valid) return prev;
      return next;
    });
  }

  function beginDrag(piece: Piece) {
    const { width: W, height: H } = getShapeBounds(piece.shape);
    dragW.value = W * cellSize;
    dragH.value = H * cellSize;
    dragPieceRef.current = piece;
    setDragPiece(piece);
    setScrollEnabled(false);
    setDropPos(null);
  }

  function endDrag(fx: number, fy: number) {
    const piece = dragPieceRef.current;
    dragPieceRef.current = null;
    setDragPiece(null);
    setDropPos(null);
    setScrollEnabled(true);
    if (!piece) return;

    const a = anchorFor(fx, fy, piece);
    if (a && canPlacePiece(boardStateRef.current, piece, a.row, a.col)) {
      const next = placePiece(boardStateRef.current, piece, a.row, a.col);
      placedPiecesRef.current.set(piece.id, piece);
      setBoard(next);
      setMoves(m => m + 1);
      playClick();
      if (vibrateRef.current) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setTray(prev => {
        const remaining = prev.filter(p => p.id !== piece.id);
        if (remaining.length === 0) void markLevelCompleted(levelRef.current);
        return remaining;
      });
    }
  }

  function pickupFromBoard(pieceId: string) {
    const piece = placedPiecesRef.current.get(pieceId);
    if (!piece) return;
    placedPiecesRef.current.delete(pieceId);
    const newBoard = boardStateRef.current.map(row =>
      row.map(cell => (cell?.pieceId === pieceId ? null : cell)),
    );
    boardStateRef.current = newBoard;
    setBoard(newBoard);
    setTray(prev => [...prev, piece]);
    beginDrag(piece);
  }

  function rotatePiece(pieceId: string) {
    setTray(prev =>
      prev.map(p =>
        p.id !== pieceId ? p : {
          ...p,
          rotation: (p.rotation + 1) % 4,
          shape: { ...p.shape, cells: rotateCellsClockwise(p.shape.cells) },
        },
      ),
    );
  }

  function resetPlayState(pieces: Piece[], size: number) {
    setBoard(createEmptyBoard(size));
    setTray(pieces);
    setDragPiece(null);
    setDropPos(null);
    setScrollEnabled(true);
    setShowComplete(false);
    setMerging(false);
    setMoves(0);
    setElapsed(0);
    startRef.current = Date.now();
    boardScale.value = 1;
    merge.value = 0;
    shine.value = 0;
    overlay.value = 0;
    pop.value = 0;
    dragPieceRef.current = null;
    placedPiecesRef.current.clear();
  }

  function loadLevel(target: number) {
    const clamped = Math.min(Math.max(target, 1), MAX_LEVEL);
    const pieces = createLevelPieces(clamped);
    setLevel(clamped);
    setLevelPieces(pieces);
    resetPlayState(pieces, getBoardSize(clamped));
  }

  function restartGame() { resetPlayState(levelPieces, boardSize); }

  const boardPx = cellSize * boardSize;

  // Must mirror dragBlockTopLeft() in lib/drag-geometry.ts (dragW/dragH = W/H * cellSize),
  // so the floating block and the green landing preview stay in lockstep.
  const dragOverlayStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: dragX.value - dragW.value / 2 },
      { translateY: dragY.value - dragH.value / 2 - DRAG_LIFT },
    ],
  }));
  const boardAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: boardScale.value }] }));
  const mergeStyle = useAnimatedStyle(() => ({
    opacity: merge.value,
    transform: [{ scale: 0.9 + 0.1 * merge.value }],
  }));
  // Fade the underlying tile grid out as the block fuses, so no grid can peek
  // through once the merge is complete (kills the post-shine flicker).
  const gridStyle = useAnimatedStyle(() => ({ opacity: 1 - merge.value }));
  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlay.value }));
  // Staggered springy pop for the three stars, driven off one shared value (no entering animations)
  const star0Style = useAnimatedStyle(() => ({ transform: [{ scale: interpolate(pop.value, [0, 0.4, 0.55], [0, 1.15, 1], Extrapolation.CLAMP) }] }));
  const star1Style = useAnimatedStyle(() => ({ transform: [{ scale: interpolate(pop.value, [0.12, 0.52, 0.67], [0, 1.15, 1], Extrapolation.CLAMP) }] }));
  const star2Style = useAnimatedStyle(() => ({ transform: [{ scale: interpolate(pop.value, [0.24, 0.64, 0.79], [0, 1.15, 1], Extrapolation.CLAMP) }] }));
  const starStyles = [star0Style, star1Style, star2Style];
  const shineStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shine.value, [0, 0.12, 0.88, 1], [0, 1, 1, 0], Extrapolation.CLAMP),
    transform: [
      { translateX: interpolate(shine.value, [0, 1], [-boardPx * 1.3, boardPx * 1.3]) },
      { skewX: '-18deg' },
    ],
  }));

  useEffect(() => {
    if (!isComplete) return;
    setElapsed(Date.now() - startRef.current);
    setMerging(true);
    boardScale.value = withSequence(
      withTiming(1.05, { duration: 180 }),
      withSpring(1.0, { damping: 11, stiffness: 180 }),
    );
    shine.value = withDelay(200, withTiming(1, { duration: 800 }));
    const t = setTimeout(() => setShowComplete(true), 1150);
    return () => clearTimeout(t);
  }, [isComplete]);

  // Start the animations only after their views have mounted, so the first
  // painted frame reflects the true starting value instead of a snap.
  useEffect(() => {
    if (!merging) return;
    merge.value = withSpring(1, { damping: 10, stiffness: 140 });
  }, [merging]);

  useEffect(() => {
    if (!showComplete) return;
    overlay.value = withTiming(1, { duration: 250 });
    pop.value = withTiming(1, { duration: 750 });
  }, [showComplete]);

  function handleBoardDragStart(fx: number, fy: number) {
    const col = Math.floor(fx / cellSize);
    const row = Math.floor(fy / cellSize);
    if (row < 0 || col < 0 || row >= boardSize || col >= boardSize) return;
    const cell = boardStateRef.current[row]?.[col];
    if (!cell) return;
    pickupFromBoard(cell.pieceId);
  }

  // Re-measure the board on every event so the screen→board conversion can never use a stale
  // origin: measure() can return null on the first frame, and the board can shift on layout.
  // Re-measuring each frame recovers on the next, and computeAnchor rejects off-board coords, so
  // a rare null never places a piece in the wrong cell.
  const syncOrigin = () => {
    'worklet';
    const m = measure(boardRef);
    if (m) { originX.value = m.pageX; originY.value = m.pageY; }
  };

  const boardGesture = Gesture.Pan()
    .minDistance(4)
    .onStart(e => {
      dragX.value = e.absoluteX; dragY.value = e.absoluteY;
      syncOrigin();
      runOnJS(handleBoardDragStart)(e.absoluteX - originX.value, e.absoluteY - originY.value);
    })
    .onUpdate(e => {
      dragX.value = e.absoluteX; dragY.value = e.absoluteY;
      syncOrigin();
      runOnJS(computeDropPos)(e.absoluteX - originX.value, e.absoluteY - originY.value);
    })
    .onEnd(e => {
      syncOrigin();
      runOnJS(endDrag)(e.absoluteX - originX.value, e.absoluteY - originY.value);
    });

  function makeTrayDragGesture(piece: Piece) {
    return Gesture.Pan()
      .minDistance(4)
      .onStart(e => {
        dragX.value = e.absoluteX; dragY.value = e.absoluteY;
        syncOrigin();
        runOnJS(beginDrag)(piece);
      })
      .onUpdate(e => {
        dragX.value = e.absoluteX; dragY.value = e.absoluteY;
        syncOrigin();
        runOnJS(computeDropPos)(e.absoluteX - originX.value, e.absoluteY - originY.value);
      })
      .onEnd(e => {
        syncOrigin();
        runOnJS(endDrag)(e.absoluteX - originX.value, e.absoluteY - originY.value);
      });
  }

  const tileInner = cellSize - TILE_INSET;

  return (
    <LinearGradient colors={COLORS.boardBg} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.screen}>

          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={restartGame} style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.8 : 1 }]}>
              <Icon name="replay" size={22} />
            </Pressable>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>LEVEL {level}</Text>
              {getLevelDifficulty(level) === 'hard' && (
                <View style={styles.hardTag}>
                  <Text style={styles.hardTagText}>HARD LEVEL!</Text>
                </View>
              )}
            </View>
            <Pressable onPress={() => router.replace('/')} style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.8 : 1 }]}>
              <Icon name="home" size={21} />
            </Pressable>
          </View>

          {/* Board */}
          <View style={styles.boardArea}>
            <Animated.View style={[styles.boardFrame, boardAnimStyle]}>
              <View style={styles.boardWell}>
                <GestureDetector gesture={boardGesture}>
                  <Animated.View ref={boardRef} style={{ width: cellSize * boardSize }}>
                    <Animated.View style={gridStyle}>
                      {safeBoard.map((row, rIdx) => (
                        <View key={rIdx} style={styles.boardRow}>
                          {row.map((cell, cIdx) => (
                            <View key={cIdx} style={{ width: cellSize, height: cellSize, alignItems: 'center', justifyContent: 'center' }}>
                              <Tile size={tileInner} radius={11} variant={cell ? 'filled' : 'empty'} />
                            </View>
                          ))}
                        </View>
                      ))}
                    </Animated.View>

                    {/* Ghost: soft shadow of the piece on the target cells */}
                    {dragPiece && dropPos && dragPiece.shape.cells.map(([r, c]) => (
                      <View
                        key={`ghost-${r}-${c}`}
                        pointerEvents="none"
                        style={{
                          position: 'absolute',
                          left: (dropPos.col + c) * cellSize + TILE_INSET / 2,
                          top: (dropPos.row + r) * cellSize + TILE_INSET / 2,
                          width: tileInner, height: tileInner, borderRadius: 11,
                          backgroundColor: dropPos.valid ? 'rgba(86,176,92,0.42)' : 'rgba(200,70,55,0.32)',
                        }}
                      />
                    ))}

                    {/* Merge: tiles fuse into one solid block with a shine sweep */}
                    {merging && (
                      <Animated.View pointerEvents="none" style={[styles.mergeBlock, { width: boardPx, height: boardPx }, mergeStyle]}>
                        <LinearGradient colors={COLORS.tile} start={{ x: 0.12, y: 0 }} end={{ x: 0.88, y: 1 }} style={styles.mergeFill} />
                        <Animated.View style={[styles.shine, shineStyle]}>
                          <LinearGradient
                            colors={['transparent', 'rgba(255,244,214,0.65)', 'transparent']}
                            start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
                            style={{ flex: 1 }}
                          />
                        </Animated.View>
                      </Animated.View>
                    )}
                  </Animated.View>
                </GestureDetector>
              </View>
            </Animated.View>
          </View>

          {/* Tray */}
          <View style={styles.trayFrame}>
            <GHScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.trayScroll}
              scrollEnabled={scrollEnabled}
              style={styles.trayWell}
            >
              {tray.map(piece => {
                const bounds = getShapeBounds(piece.shape);
                const maxB = getMaxRotatedBounds(piece.shape.cells);
                const containerW = maxB.width * TRAY_CELL + (maxB.width - 1) * TRAY_GAP;
                const containerH = maxB.height * TRAY_CELL + (maxB.height - 1) * TRAY_GAP;
                const pieceW = bounds.width * TRAY_CELL + (bounds.width - 1) * TRAY_GAP;
                const pieceH = bounds.height * TRAY_CELL + (bounds.height - 1) * TRAY_GAP;
                const isDragged = dragPiece?.id === piece.id;

                return (
                  <GestureDetector key={piece.id} gesture={makeTrayDragGesture(piece)}>
                    <View style={[styles.trayItem, { width: containerW + 16, height: containerH + 16, opacity: isDragged ? 0 : 1 }]}>
                      <View style={{ width: pieceW, height: pieceH, position: 'relative' }}>
                        {piece.shape.cells.map(([r, c]) => (
                          <Tile
                            key={`${r}-${c}`}
                            size={TRAY_CELL}
                            radius={10}
                            style={{ position: 'absolute', left: c * (TRAY_CELL + TRAY_GAP), top: r * (TRAY_CELL + TRAY_GAP) }}
                          />
                        ))}
                        {piece.rotatable ? (
                          <GestureDetector gesture={Gesture.Tap().onEnd(() => runOnJS(rotatePiece)(piece.id))}>
                            <View style={styles.rotateBadge}>
                              <Icon name="replay" size={18} color="rgba(255,248,239,0.9)" />
                            </View>
                          </GestureDetector>
                        ) : null}
                      </View>
                    </View>
                  </GestureDetector>
                );
              })}
            </GHScrollView>
          </View>

        </View>
      </SafeAreaView>

      {/* Drag overlay */}
      {dragPiece && (
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 100 }]}>
          <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 0, left: 0 }, dragOverlayStyle]}>
            {dragPiece.shape.cells.map(([r, c]) => (
              <View
                key={`${r}-${c}`}
                style={{ position: 'absolute', left: c * cellSize + TILE_INSET / 2, top: r * cellSize + TILE_INSET / 2, width: tileInner, height: tileInner, borderRadius: 11, boxShadow: DRAG_SHADOW }}
              >
                <Tile size={tileInner} radius={11} />
              </View>
            ))}
          </Animated.View>
        </Animated.View>
      )}

      {/* Level Complete */}
      {showComplete && (
        <Animated.View style={[styles.completeOverlay, overlayStyle]}>
          <LinearGradient colors={COLORS.boardBg} style={StyleSheet.absoluteFill} />
          <LinearGradient colors={['rgba(255,222,150,0.5)', 'transparent']} style={styles.glow} pointerEvents="none" />
          {CONFETTI.map((c, i) => (
            <View key={i} pointerEvents="none" style={[styles.confetti, c]} />
          ))}
          <SafeAreaView style={styles.completeSafe}>
            <View style={styles.completeCenter}>
              <View style={styles.starsRow}>
                {[0, 1, 2].map(i => (
                  <View key={i} style={{ transform: [{ translateY: i === 1 ? -16 : 0 }] }}>
                    <Animated.View style={starStyles[i]}>
                      <Icon name="star" size={i === 1 ? 80 : 62} color={COLORS.star} />
                    </Animated.View>
                  </View>
                ))}
              </View>

              <View style={{ alignItems: 'center' }}>
                <Text style={styles.perfect}>PERFECT!</Text>
                <Text style={styles.completeSub}>LEVEL {level} COMPLETE</Text>
              </View>

              <View style={styles.chipsRow}>
                <View style={styles.chip}>
                  <Text style={styles.chipValue}>{moves}</Text>
                  <Text style={styles.chipLabel}>MOVES</Text>
                </View>
                <View style={styles.chip}>
                  <Text style={styles.chipValue}>{fmtTime(elapsed)}</Text>
                  <Text style={styles.chipLabel}>TIME</Text>
                </View>
              </View>
            </View>

            <View style={styles.completeButtons}>
              <WoodButton
                label="NEXT LEVEL"
                onPress={() => loadLevel(level >= MAX_LEVEL ? 1 : level + 1)}
                fontSize={24}
                iconRight
                icon={<Icon name="arrow" size={22} color="#fff5e6" />}
              />
              <View style={styles.completeRow}>
                <WoodButton label="REPLAY" variant="secondary" onPress={restartGame} style={{ flex: 1 }} height={58} fontSize={18} icon={<Icon name="replay" size={17} color={COLORS.gold} />} />
                <WoodButton label="HOME" variant="secondary" onPress={() => router.replace('/')} style={{ flex: 1 }} height={58} fontSize={18} icon={<Icon name="home" size={17} color={COLORS.gold} />} />
              </View>
            </View>
          </SafeAreaView>
        </Animated.View>
      )}
    </LinearGradient>
  );
}

const frameShadow = {
  boxShadow: '0px 14px 26px rgba(60,34,14,0.4), inset 0px 3px 2px rgba(255,220,180,0.24), inset 0px -4px 5px rgba(0,0,0,0.35)',
};

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  screen: { flex: 1, paddingHorizontal: BOARD_PADDING, paddingVertical: 12, gap: 16 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBtn: {
    width: 52, height: 52, borderRadius: 15, backgroundColor: COLORS.frame[0],
    alignItems: 'center', justifyContent: 'center',
    boxShadow: 'inset 0px 2px 1px rgba(255,220,180,0.3), inset 0px -4px 3px rgba(0,0,0,0.35), 0px 5px 11px rgba(60,34,14,0.32)',
  },
  levelBadge: {
    backgroundColor: COLORS.frame[0], paddingVertical: 13, paddingHorizontal: 30, borderRadius: 16,
    alignItems: 'center',
    boxShadow: 'inset 0px 2px 1px rgba(255,220,180,0.28), inset 0px -5px 4px rgba(0,0,0,0.35), 0px 6px 12px rgba(60,34,14,0.3)',
  },
  levelText: {
    fontFamily: FONTS.heading, fontSize: 20, color: COLORS.gold, letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 1,
  },
  hardTag: {
    marginTop: 6, paddingVertical: 3, paddingHorizontal: 12, borderRadius: 9, backgroundColor: COLORS.danger,
  },
  hardTagText: {
    fontFamily: FONTS.heading, fontSize: 12, color: '#fff3e0', letterSpacing: 1.5,
  },

  boardArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  boardFrame: { padding: 14, borderRadius: 26, backgroundColor: COLORS.frame[0], ...frameShadow },
  boardWell: { borderRadius: 17, backgroundColor: 'rgba(36,20,7,0.4)', padding: 12, boxShadow: INSET_SHADOW },
  boardRow: { flexDirection: 'row' },
  mergeBlock: { position: 'absolute', top: 0, left: 0, borderRadius: 6, overflow: 'hidden' },
  mergeFill: { flex: 1, borderRadius: 6, boxShadow: TILE_SHADOW },
  shine: { position: 'absolute', top: -12, bottom: -12, width: '38%' },

  trayFrame: { padding: 14, borderRadius: 24, backgroundColor: COLORS.frame[0], ...frameShadow },
  trayWell: { borderRadius: 15, backgroundColor: 'rgba(36,20,7,0.32)', boxShadow: INSET_SHADOW },
  trayScroll: { paddingHorizontal: 12, paddingVertical: 14, gap: 16, alignItems: 'center', minHeight: 96 },
  trayItem: { borderRadius: 10, justifyContent: 'center', alignItems: 'center', padding: 8 },
  rotateBadge: { position: 'absolute', inset: 0, justifyContent: 'center', alignItems: 'center' },

  completeOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200 },
  glow: { position: 'absolute', top: 0, left: 0, right: 0, height: '55%' },
  confetti: { position: 'absolute', opacity: 0.8 },
  completeSafe: { flex: 1, paddingHorizontal: 26, paddingVertical: 20 },
  completeCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 30 },
  starsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 14 },
  perfect: {
    fontFamily: FONTS.heading, fontSize: 56, color: COLORS.inkSoft, letterSpacing: -0.5, lineHeight: 72,
    textShadowColor: 'rgba(255,255,255,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 0,
  },
  completeSub: { fontFamily: FONTS.headingBold, fontSize: 21, color: '#a87c44', letterSpacing: 2, marginTop: 8 },
  chipsRow: { flexDirection: 'row', gap: 14 },
  chip: {
    alignItems: 'center', paddingVertical: 14, paddingHorizontal: 26, borderRadius: 18,
    backgroundColor: COLORS.cream[0],
    boxShadow: 'inset 0px 2px 2px rgba(255,255,255,0.7), 0px 6px 12px rgba(60,34,14,0.14)',
  },
  chipValue: { fontFamily: FONTS.heading, fontSize: 28, color: '#8f5827', lineHeight: 38 },
  chipLabel: { fontFamily: FONTS.body, fontSize: 13, color: '#a87c44', letterSpacing: 1, marginTop: 4 },
  completeButtons: { gap: 14 },
  completeRow: { flexDirection: 'row', gap: 14 },
});
