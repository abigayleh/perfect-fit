import Animated, {
  useAnimatedStyle, useSharedValue, runOnJS,
  withSequence, withTiming, withSpring,
} from 'react-native-reanimated';
import { GestureDetector, Gesture, ScrollView as GHScrollView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BOARD_SIZE,
  BoardCell,
  Piece,
  canPlacePiece,
  createEmptyBoard,
  createLevelPieces,
  getMaxRotatedBounds,
  getShapeBounds,
  normalizeBoard,
  placePiece,
  rotateCellsClockwise,
} from '../lib/levels';
import { MAX_LEVEL, markLevelCompleted } from '../lib/progress';

const WOOD_DARK = '#8F5A2D';
const WOOD_MID = '#A86631';
const WOOD_CTRL = '#9C6B3E';
const TRAY_CELL = 40;

function woodColors(hex: string): [string, string, string] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lx = (v: number) => Math.min(255, Math.round(v * 1.28));
  const dk = (v: number) => Math.round(v * 0.72);
  const h = (r: number, g: number, b: number) =>
    '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
  return [h(lx(r), lx(g), lx(b)), hex, h(dk(r), dk(g), dk(b))];
}
const TRAY_GAP = 2;
const BOARD_PADDING = 16;

export default function PlayScreen() {
  const router = useRouter();
  const { level: levelParam } = useLocalSearchParams<{ level: string }>();
  const { width: screenWidth } = useWindowDimensions();

  const requestedLevel = useMemo(() => {
    const n = parseInt(levelParam ?? '1', 10);
    if (isNaN(n)) return 1;
    return Math.min(Math.max(n, 1), MAX_LEVEL);
  }, [levelParam]);

  const cellSize = useMemo(
    () => Math.floor((Math.min(screenWidth, 420) - BOARD_PADDING * 2) / BOARD_SIZE),
    [screenWidth],
  );

  const initialPieces = useMemo(() => createLevelPieces(requestedLevel), [requestedLevel]);

  const [level, setLevel] = useState(requestedLevel);
  const [levelPieces, setLevelPieces] = useState<Piece[]>(initialPieces);
  const [board, setBoard] = useState<BoardCell[][]>(() => createEmptyBoard());
  const [tray, setTray] = useState<Piece[]>(initialPieces);
  const [dragPiece, setDragPiece] = useState<Piece | null>(null);
  const [dropPos, setDropPos] = useState<{ row: number; col: number; valid: boolean } | null>(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Shared values drive the overlay position on the UI thread (smooth 60fps)
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const boardScale = useSharedValue(1);

  // Refs for safe access inside gesture worklets via runOnJS
  const boardViewRef = useRef<View>(null);
  const boardLayoutRef = useRef<{ x: number; y: number } | null>(null);
  const dragPieceRef = useRef<Piece | null>(null);
  const placedPiecesRef = useRef<Map<string, Piece>>(new Map());
  // Always-current board/level for endDrag (avoids stale closure)
  const boardStateRef = useRef(board);
  boardStateRef.current = board;
  const levelRef = useRef(level);
  levelRef.current = level;

  const isComplete = tray.length === 0 && !dragPiece;
  const safeBoard = useMemo(() => normalizeBoard(board), [board]);

  const highlightCells = useMemo((): Set<string> => {
    if (!dropPos || !dragPiece) return new Set();
    return new Set(
      dragPiece.shape.cells.map(([dr, dc]) => `${dropPos.row + dr}-${dropPos.col + dc}`),
    );
  }, [dropPos, dragPiece]);

  function measureBoard() {
    boardViewRef.current?.measureInWindow((x, y) => {
      boardLayoutRef.current = { x, y };
    });
  }

  function computeDropPos(absX: number, absY: number) {
    const layout = boardLayoutRef.current;
    const piece = dragPieceRef.current;
    if (!layout || !piece) { setDropPos(null); return; }
    const col = Math.floor((absX - layout.x) / cellSize);
    const row = Math.floor((absY - layout.y) / cellSize);
    if (row < 0 || col < 0 || row >= BOARD_SIZE || col >= BOARD_SIZE) {
      setDropPos(null); return;
    }
    const valid = canPlacePiece(boardStateRef.current, piece, row, col);
    setDropPos({ row, col, valid });
  }

  function beginDrag(piece: Piece) {
    dragPieceRef.current = piece;
    setDragPiece(piece);
    setScrollEnabled(false);
    setDropPos(null);
  }

  function endDrag(absX: number, absY: number) {
    const layout = boardLayoutRef.current;
    const piece = dragPieceRef.current;
    dragPieceRef.current = null;
    setDragPiece(null);
    setDropPos(null);
    setScrollEnabled(true);

    if (!layout || !piece) return;

    const col = Math.floor((absX - layout.x) / cellSize);
    const row = Math.floor((absY - layout.y) / cellSize);

    if (row >= 0 && col >= 0 && canPlacePiece(boardStateRef.current, piece, row, col)) {
      const next = placePiece(boardStateRef.current, piece, row, col);
      placedPiecesRef.current.set(piece.id, piece);
      setBoard(next);
      setTray(prev => {
        const remaining = prev.filter(p => p.id !== piece.id);
        if (remaining.length === 0) void markLevelCompleted(levelRef.current);
        return remaining;
      });
    }
    // invalid drop: piece stays in tray (already there)
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

  function loadLevel(target: number) {
    const clamped = Math.min(Math.max(target, 1), MAX_LEVEL);
    const pieces = createLevelPieces(clamped);
    setLevel(clamped);
    setLevelPieces(pieces);
    setBoard(createEmptyBoard());
    setTray(pieces);
    setDragPiece(null);
    setDropPos(null);
    setScrollEnabled(true);
    setShowModal(false);
    boardScale.value = 1;
    dragPieceRef.current = null;
    placedPiecesRef.current.clear();
  }

  function restartGame() {
    setBoard(createEmptyBoard());
    setTray(levelPieces);
    setDragPiece(null);
    setDropPos(null);
    setScrollEnabled(true);
    setShowModal(false);
    boardScale.value = 1;
    dragPieceRef.current = null;
    placedPiecesRef.current.clear();
  }

  const dragOverlayStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: dragX.value }, { translateY: dragY.value }],
  }));

  const boardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: boardScale.value }],
  }));

  useEffect(() => {
    if (!isComplete) return;
    boardScale.value = withSequence(
      withTiming(1.06, { duration: 180 }),
      withTiming(0.97, { duration: 140 }),
      withSpring(1.0, { damping: 12, stiffness: 180 }),
    );
    const t = setTimeout(() => setShowModal(true), 700);
    return () => clearTimeout(t);
  }, [isComplete]);

  // Single board-level gesture so the host never unmounts mid-drag
  function handleBoardDragStart(absX: number, absY: number) {
    const layout = boardLayoutRef.current;
    if (!layout) return;
    const col = Math.floor((absX - layout.x) / cellSize);
    const row = Math.floor((absY - layout.y) / cellSize);
    if (row < 0 || col < 0 || row >= BOARD_SIZE || col >= BOARD_SIZE) return;
    const cell = boardStateRef.current[row]?.[col];
    if (!cell) return;
    pickupFromBoard(cell.pieceId);
  }

  const boardGesture = Gesture.Pan()
    .minDistance(4)
    .onStart(e => {
      dragX.value = e.absoluteX;
      dragY.value = e.absoluteY;
      runOnJS(handleBoardDragStart)(e.absoluteX, e.absoluteY);
    })
    .onUpdate(e => {
      dragX.value = e.absoluteX;
      dragY.value = e.absoluteY;
      runOnJS(computeDropPos)(e.absoluteX, e.absoluteY);
    })
    .onEnd(e => {
      runOnJS(endDrag)(e.absoluteX, e.absoluteY);
    });

  function makeTrayDragGesture(piece: Piece) {
    return Gesture.Pan()
      .minDistance(4)
      .onStart(e => {
        dragX.value = e.absoluteX;
        dragY.value = e.absoluteY;
        runOnJS(beginDrag)(piece);
      })
      .onUpdate(e => {
        dragX.value = e.absoluteX;
        dragY.value = e.absoluteY;
        runOnJS(computeDropPos)(e.absoluteX, e.absoluteY);
      })
      .onEnd(e => {
        runOnJS(endDrag)(e.absoluteX, e.absoluteY);
      });
  }

  return (
    <LinearGradient colors={['#fff7ed', '#ffedd5', '#fed7aa']} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.screen}>

          {/* Header */}
          <View style={styles.header}>
            <Pressable
              onPress={restartGame}
              style={({ pressed }) => [styles.iconBtn, { backgroundColor: WOOD_CTRL, opacity: pressed ? 0.8 : 1 }]}
            >
              <Text style={styles.iconBtnText}>↺</Text>
            </Pressable>
            <View style={[styles.levelBadge, { backgroundColor: WOOD_DARK }]}>
              <Text style={styles.levelText}>LEVEL {level}</Text>
            </View>
            <Pressable
              onPress={() => router.replace('/')}
              style={({ pressed }) => [styles.iconBtn, { backgroundColor: WOOD_MID, opacity: pressed ? 0.8 : 1 }]}
            >
              <Text style={styles.iconBtnText}>⌂</Text>
            </Pressable>
          </View>

          {/* Board */}
          <View style={styles.boardArea}>
            <Animated.View style={boardAnimStyle}>
            <GestureDetector gesture={boardGesture}>
            <View
              ref={boardViewRef}
              style={[styles.board, { width: cellSize * BOARD_SIZE }]}
              onLayout={measureBoard}
            >
              {safeBoard.map((row, rIdx) => (
                <View key={rIdx} style={styles.boardRow}>
                  {row.map((cell, cIdx) => {
                    const key = `${rIdx}-${cIdx}`;
                    const isHighlighted = highlightCells.has(key);
                    const highlightColor = dropPos?.valid
                      ? 'rgba(34,197,94,0.4)'
                      : 'rgba(239,68,68,0.4)';

                    return (
                      <View
                        key={cIdx}
                        style={[
                          styles.boardCell,
                          { width: cellSize, height: cellSize },
                          isHighlighted ? { backgroundColor: highlightColor } : null,
                        ]}
                      >
                        {cell && (
                          <LinearGradient
                            colors={woodColors(cell.color)}
                            start={{ x: 0.15, y: 0 }}
                            end={{ x: 0.85, y: 1 }}
                            style={styles.filledCell}
                          />
                        )}
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
            </GestureDetector>
            </Animated.View>
          </View>

          {/* Tray */}
          <View style={styles.trayWrapper}>
            <GHScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.trayScroll}
              scrollEnabled={scrollEnabled}
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
                    <View
                      style={[
                        styles.trayItem,
                        { width: containerW + 16, height: containerH + 16, opacity: isDragged ? 0 : 1 },
                      ]}
                    >
                      <View style={{ width: pieceW, height: pieceH, position: 'relative' }}>
                        {piece.shape.cells.map(([r, c]) => (
                          <LinearGradient
                            key={`${r}-${c}`}
                            colors={woodColors(piece.color)}
                            start={{ x: 0.15, y: 0 }}
                            end={{ x: 0.85, y: 1 }}
                            style={[
                              styles.trayCell,
                              {
                                left: c * (TRAY_CELL + TRAY_GAP),
                                top: r * (TRAY_CELL + TRAY_GAP),
                              },
                            ]}
                          />
                        ))}
                        {piece.rotatable ? (
                          <GestureDetector
                            gesture={Gesture.Tap().onEnd(() => runOnJS(rotatePiece)(piece.id))}
                          >
                            <View style={styles.rotateBadge}>
                              <Text style={styles.rotateIcon}>↻</Text>
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

      {/* Drag overlay — absolutely positioned over entire screen */}
      {dragPiece && (
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { zIndex: 100 }]}
        >
          <Animated.View
            pointerEvents="none"
            style={[{ position: 'absolute', top: 0, left: 0 }, dragOverlayStyle]}
          >
            {dragPiece.shape.cells.map(([r, c]) => (
              <LinearGradient
                key={`${r}-${c}`}
                colors={woodColors(dragPiece.color)}
                start={{ x: 0.15, y: 0 }}
                end={{ x: 0.85, y: 1 }}
                style={[
                  styles.dragCell,
                  {
                    left: c * cellSize,
                    top: r * cellSize,
                    width: cellSize,
                    height: cellSize,
                  },
                ]}
              />
            ))}
          </Animated.View>
        </Animated.View>
      )}

      {/* Level Complete Modal */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Level Complete!</Text>
            <Text style={styles.modalBody}>Great job. Ready for the next puzzle?</Text>
            <View style={styles.modalButtons}>
              <Pressable
                style={({ pressed }) => [styles.modalBtn, styles.modalBtnSecondary, { opacity: pressed ? 0.8 : 1 }]}
                onPress={() => router.replace('/')}
              >
                <Text style={styles.modalBtnTextSecondary}>Home</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.modalBtn, styles.modalBtnPrimary, { opacity: pressed ? 0.8 : 1 }]}
                onPress={() => loadLevel(level >= MAX_LEVEL ? 1 : level + 1)}
              >
                <Text style={styles.modalBtnTextPrimary}>Next Level</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  screen: {
    flex: 1,
    paddingHorizontal: BOARD_PADDING,
    paddingVertical: 10,
    gap: 12,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#331b0c',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  iconBtnText: {
    color: '#fff8ef',
    fontSize: 22,
    fontWeight: '700',
  },
  levelBadge: {
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
    shadowColor: '#331b0c',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 3,
  },
  levelText: {
    color: '#fff8ef',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 3,
  },

  // Board
  boardArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  board: { gap: 0 },
  boardRow: { flexDirection: 'row' },
  boardCell: {
    borderWidth: 1,
    borderColor: 'rgba(253,186,116,0.6)',
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderRadius: 5,
  },
  filledCell: {
    flex: 1,
    borderRadius: 4,
    shadowColor: '#331b0c',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },

  // Drag overlay cell
  dragCell: {
    position: 'absolute',
    borderRadius: 5,
    opacity: 0.88,
    shadowColor: '#331b0c',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 8,
  },

  // Tray
  trayWrapper: {
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(253,186,116,0.5)',
    paddingVertical: 8,
    shadowColor: '#c28a4b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 3,
  },
  trayScroll: {
    paddingHorizontal: 12,
    gap: 16,
    alignItems: 'center',
  },
  trayItem: {
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  trayCell: {
    position: 'absolute',
    width: TRAY_CELL,
    height: TRAY_CELL,
    borderRadius: 5,
    shadowColor: '#331b0c',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  rotateBadge: {
    position: 'absolute',
    inset: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rotateIcon: {
    fontSize: 18,
    color: 'rgba(255,248,239,0.9)',
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.42)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#fff8ef',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#331b0c',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#7c2d12',
    letterSpacing: 1,
    marginBottom: 8,
  },
  modalBody: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9a3412',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalBtnSecondary: {
    borderWidth: 1,
    borderColor: 'rgba(253,186,116,0.7)',
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  modalBtnPrimary: {
    backgroundColor: 'rgba(251,191,36,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(180,83,9,0.3)',
  },
  modalBtnTextSecondary: {
    fontSize: 13,
    fontWeight: '900',
    color: '#9a3412',
    letterSpacing: 1,
  },
  modalBtnTextPrimary: {
    fontSize: 13,
    fontWeight: '900',
    color: '#7c2d12',
    letterSpacing: 1,
  },
});
