"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { MAX_LEVEL, markLevelCompleted } from "../../lib/progress";

type Shape = {
  id: string;
  cells: Array<[number, number]>;
};

type Piece = {
  id: string;
  shape: Shape;
  color: string;
  rotatable: boolean;
  rotation: number;
};

type BoardCell = {
  pieceId: string;
  color: string;
} | null;

type ShapeCells = Array<[number, number]>;
type LevelPiecePreset = {
  cells: ShapeCells;
  rotatable?: boolean;
  initialRotation?: number;
};

const BOARD_SIZE = 4;
const CELL_SIZE = "clamp(44px, 9.5vw, 72px)";
const TRAY_CELL_SIZE = "clamp(28px, 6.5vw, 44px)";
const CELL_GAP_PX = 0;
const BLOCK_RADIUS = "0.3rem";
const TRAY_PIECE_GAP_PX = 20;
const TRAY_INNER_GAP_PX = 3;
const BOARD_PIXEL_SIZE = `calc(${BOARD_SIZE} * ${CELL_SIZE} + ${(BOARD_SIZE - 1) * CELL_GAP_PX}px)`;

const PIECE_COLORS = [
  "#B77940",
  "#A86631",
  "#8F5A2D",
  "#C28A4B",
  "#9C6B3E",
  "#7E4D2A",
  "#B38354",
];

const PRESET_LEVELS: Record<number, LevelPiecePreset[]> = {
  // Level 1: four simple squares.
  1: [
    { cells: [[0, 0], [0, 1], [1, 0], [1, 1]] },
    { cells: [[0, 0], [0, 1], [1, 0], [1, 1]] },
    { cells: [[0, 0], [0, 1], [1, 0], [1, 1]] },
    { cells: [[0, 0], [0, 1], [1, 0], [1, 1]] },
  ],
  // Level 2: mostly dominoes with mixed orientations.
  2: [
    { cells: [[0, 0], [0, 1]] },
    { cells: [[0, 0], [0, 1]] },
    { cells: [[0, 0], [1, 0]] },
    { cells: [[0, 0], [0, 1]] },
    { cells: [[0, 0], [1, 0]] },
    { cells: [[0, 0], [0, 1]] },
    { cells: [[0, 0], [0, 1]] },
    { cells: [[0, 0], [0, 1]] },
  ],
  // Level 3: introduces larger L and line pieces.
  3: [
    { cells: [[0, 0], [0, 1], [0, 2], [1, 2]] },
    { cells: [[0, 0], [1, 0], [2, 0], [3, 0]] },
    { cells: [[0, 0], [0, 1]] },
    { cells: [[0, 0], [1, 0], [1, 1]] },
    { cells: [[0, 0], [0, 1], [1, 1]] },
  ],
  // Level 4: denser triomino combinations plus one square.
  4: [
    { cells: [[0, 0], [0, 1], [1, 0]] },
    { cells: [[0, 0], [0, 1], [1, 1]] },
    { cells: [[0, 0], [0, 1], [1, 0]] },
    { cells: [[0, 0], [1, 0], [1, 1]] },
    { cells: [[0, 0], [0, 1], [1, 0], [1, 1]] },
  ],
  // Level 5: four irregular tetrominoes.
  5: [
    { cells: [[0, 0], [0, 1], [0, 2], [1, 1]] },
    { cells: [[0, 0], [1, 0], [2, 0], [3, 0]] },
    { cells: [[0, 0], [1, 0], [2, 0], [2, 1]] },
    { cells: [[0, 1], [1, 0], [1, 1], [2, 1]] },
  ],
  // Level 6: first rotation level with two rotatable pieces.
  6: [
    { cells: [[0, 0], [0, 1], [0, 2], [1, 2]], rotatable: true, initialRotation: 1 },
    { cells: [[0, 0], [1, 0], [2, 0], [2, 1]], rotatable: true, initialRotation: 3 },
    { cells: [[0, 0], [0, 1], [1, 0], [1, 1]] },
    { cells: [[0, 0], [0, 1], [1, 1], [1, 2]] },
  ],
  // Level 7: adds a rotatable T piece and offset triominoes.
  7: [
    { cells: [[0, 0], [0, 1], [0, 2], [1, 1]], rotatable: true, initialRotation: 2 },
    { cells: [[0, 0], [1, 0], [1, 1]], rotatable: true, initialRotation: 1 },
    { cells: [[0, 1], [1, 0], [1, 1], [2, 1]] },
    { cells: [[0, 0], [0, 1], [1, 1]] },
    { cells: [[0, 0], [0, 1]] },
  ],
  // Level 8: more pieces and rotations, tighter packing.
  8: [
    { cells: [[0, 0], [1, 0], [2, 0], [3, 0]], rotatable: true, initialRotation: 1 },
    { cells: [[0, 0], [0, 1], [1, 1]], rotatable: true, initialRotation: 2 },
    { cells: [[0, 0], [1, 0]] },
    { cells: [[0, 0], [0, 1], [1, 1]] },
    { cells: [[0, 0], [0, 1], [0, 2], [1, 1]], rotatable: true, initialRotation: 3 },
  ],
  // Level 9: three rotatables and mixed tetrominoes.
  9: [
    { cells: [[0, 0], [0, 1], [0, 2], [1, 0]], rotatable: true, initialRotation: 1 },
    { cells: [[0, 0], [1, 0], [2, 0], [2, 1]], rotatable: true, initialRotation: 2 },
    { cells: [[0, 0], [0, 1], [1, 1], [1, 2]], rotatable: true, initialRotation: 1 },
    { cells: [[0, 0], [0, 1], [1, 0], [1, 1]] },
  ],
  // Level 10: hardest preset, all pieces rotatable and initially offset.
  10: [
    { cells: [[0, 0], [0, 1], [0, 2], [1, 1]], rotatable: true, initialRotation: 1 },
    { cells: [[0, 0], [1, 0], [1, 1], [2, 1]], rotatable: true, initialRotation: 2 },
    { cells: [[0, 1], [1, 0], [1, 1], [1, 2]], rotatable: true, initialRotation: 3 },
    { cells: [[0, 0], [1, 0], [2, 0], [2, 1]], rotatable: true, initialRotation: 1 },
  ],
};

function getWoodTileStyle(tone: string): CSSProperties {
  return {
    backgroundColor: tone,
    backgroundImage:
      "linear-gradient(160deg, rgba(255,255,255,0.26), rgba(255,255,255,0.04) 48%, rgba(0,0,0,0.1)), repeating-linear-gradient(10deg, rgba(255,255,255,0.1) 0, rgba(255,255,255,0.1) 2px, rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 4px)",
    border: "1px solid rgba(74, 39, 17, 0.4)",
    boxShadow: "inset 0 1px 0 rgba(255, 244, 219, 0.35), inset 0 -2px 3px rgba(51, 27, 12, 0.2)",
  };
}

function getWoodControlStyle(tone: string): CSSProperties {
  return {
    backgroundColor: tone,
    backgroundImage:
      "linear-gradient(160deg, rgba(255,255,255,0.24), rgba(255,255,255,0.06) 48%, rgba(0,0,0,0.14)), repeating-linear-gradient(10deg, rgba(255,255,255,0.09) 0, rgba(255,255,255,0.09) 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px)",
    border: "1px solid rgba(74, 39, 17, 0.58)",
    boxShadow:
      "inset 0 1px 0 rgba(255, 244, 219, 0.36), inset 0 -2px 3px rgba(51, 27, 12, 0.22), 0 6px 14px rgba(51, 27, 12, 0.16)",
  };
}

function createEmptyBoard(): BoardCell[][] {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => null),
  );
}

function normalizeBoard(board: BoardCell[][]): BoardCell[][] {
  return Array.from({ length: BOARD_SIZE }, (_, rowIndex) =>
    Array.from({ length: BOARD_SIZE }, (_, colIndex) => {
      return board[rowIndex]?.[colIndex] ?? null;
    }),
  );
}

function normalizeCells(cells: ShapeCells): ShapeCells {
  const minRow = Math.min(...cells.map(([row]) => row));
  const minCol = Math.min(...cells.map(([, col]) => col));

  return cells
    .map(([row, col]) => [row - minRow, col - minCol] as [number, number])
    .sort(([rowA, colA], [rowB, colB]) => rowA - rowB || colA - colB);
}

function rotateCellsClockwise(cells: ShapeCells): ShapeCells {
  const maxRow = Math.max(...cells.map(([row]) => row));
  const rotated = cells.map(([row, col]) => [col, maxRow - row] as [number, number]);
  return normalizeCells(rotated);
}

function rotateCells(cells: ShapeCells, turns: number): ShapeCells {
  let nextCells = normalizeCells(cells);
  const safeTurns = ((turns % 4) + 4) % 4;

  for (let turn = 0; turn < safeTurns; turn += 1) {
    nextCells = rotateCellsClockwise(nextCells);
  }

  return nextCells;
}

function createLevelPieces(level: number): Piece[] {
  const presets = PRESET_LEVELS[level] ?? PRESET_LEVELS[1];

  return presets.map((preset, pieceIndex) => {
    const initialRotation = ((preset.initialRotation ?? 0) % 4 + 4) % 4;

    return {
      id: `level-${level}-piece-${pieceIndex}`,
      shape: {
        id: `level-${level}-shape-${pieceIndex}`,
        cells: rotateCells(preset.cells, initialRotation),
      },
      color: PIECE_COLORS[pieceIndex % PIECE_COLORS.length],
      rotatable: Boolean(preset.rotatable),
      rotation: initialRotation,
    };
  });
}

function canPlacePiece(
  board: BoardCell[][],
  piece: Piece,
  anchorRow: number,
  anchorCol: number,
): boolean {
  return piece.shape.cells.every(([dRow, dCol]) => {
    const row = anchorRow + dRow;
    const col = anchorCol + dCol;

    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
      return false;
    }

    return board[row][col] === null;
  });
}

function placePiece(
  board: BoardCell[][],
  piece: Piece,
  anchorRow: number,
  anchorCol: number,
): BoardCell[][] {
  const next = board.map((row) => [...row]);

  for (const [dRow, dCol] of piece.shape.cells) {
    const row = anchorRow + dRow;
    const col = anchorCol + dCol;
    next[row][col] = { pieceId: piece.id, color: piece.color };
  }

  return next;
}

function getShapeBounds(shape: Shape): { width: number; height: number } {
  const maxRow = Math.max(...shape.cells.map(([row]) => row));
  const maxCol = Math.max(...shape.cells.map(([, col]) => col));
  return { width: maxCol + 1, height: maxRow + 1 };
}

function getCellsBounds(cells: ShapeCells): { width: number; height: number } {
  const maxRow = Math.max(...cells.map(([row]) => row));
  const maxCol = Math.max(...cells.map(([, col]) => col));
  return { width: maxCol + 1, height: maxRow + 1 };
}

function getMaxRotatedBounds(cells: ShapeCells): { width: number; height: number } {
  let maxWidth = 0;
  let maxHeight = 0;

  for (let turn = 0; turn < 4; turn += 1) {
    const rotated = rotateCells(cells, turn);
    const bounds = getCellsBounds(rotated);
    maxWidth = Math.max(maxWidth, bounds.width);
    maxHeight = Math.max(maxHeight, bounds.height);
  }

  return { width: maxWidth, height: maxHeight };
}

function getMergedBoardCellStyle(
  cell: NonNullable<BoardCell>,
): CSSProperties {
  return {
    ...getWoodTileStyle(cell.color),
    borderRadius: BLOCK_RADIUS,
  };
}

export function PlayContent() {
  const searchParams = useSearchParams();
  const requestedLevel = useMemo(() => {
    const parsedLevel = Number.parseInt(searchParams.get("level") ?? "1", 10);
    if (Number.isNaN(parsedLevel)) {
      return 1;
    }
    return Math.min(Math.max(parsedLevel, 1), MAX_LEVEL);
  }, [searchParams]);

  const initialPieces = useMemo(() => createLevelPieces(requestedLevel), [requestedLevel]);

  const [level, setLevel] = useState(requestedLevel);
  const [levelPieces, setLevelPieces] = useState<Piece[]>(initialPieces);
  const [board, setBoard] = useState<BoardCell[][]>(() => createEmptyBoard());
  const [tray, setTray] = useState<Piece[]>(initialPieces);
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const [draggingPieceId, setDraggingPieceId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ row: number; col: number }>({
    row: 0,
    col: 0,
  });
  const [hoverAnchor, setHoverAnchor] = useState<{ row: number; col: number } | null>(
    null,
  );
  const safeBoard = useMemo(() => normalizeBoard(board), [board]);
  const isLevelComplete = tray.length === 0;
  const boardGridRef = useRef<HTMLDivElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const musicIntervalRef = useRef<number | null>(null);

  function playTone(
    context: AudioContext,
    frequency: number,
    duration: number,
    gainValue: number,
    type: OscillatorType,
    when: number,
  ) {
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, when);

    gainNode.gain.setValueAtTime(0.0001, when);
    gainNode.gain.exponentialRampToValueAtTime(gainValue, when + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, when + duration);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.start(when);
    oscillator.stop(when + duration + 0.02);
  }

  function playPlacementClick() {
    const context = audioContextRef.current;
    if (!context) {
      return;
    }

    const now = context.currentTime;
    playTone(context, 540, 0.08, 0.07, "square", now);
    playTone(context, 740, 0.06, 0.04, "triangle", now + 0.01);
  }

  useEffect(() => {
    const startBackgroundMusic = (context: AudioContext) => {
      if (musicIntervalRef.current !== null) {
        return;
      }

      const progression = [220, 261.63, 293.66, 329.63, 293.66, 261.63];
      let noteIndex = 0;

      const playStep = () => {
        const now = context.currentTime;
        const frequency = progression[noteIndex % progression.length];
        playTone(context, frequency, 0.35, 0.025, "triangle", now);
        playTone(context, frequency / 2, 0.3, 0.01, "sine", now + 0.04);
        noteIndex += 1;
      };

      playStep();
      musicIntervalRef.current = window.setInterval(playStep, 480);
    };

    const bootstrapAudio = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new window.AudioContext();
      }

      const context = audioContextRef.current;
      if (context.state === "suspended") {
        void context.resume();
      }

      startBackgroundMusic(context);
    };

    window.addEventListener("pointerdown", bootstrapAudio, { once: true });

    return () => {
      window.removeEventListener("pointerdown", bootstrapAudio);
      if (musicIntervalRef.current !== null) {
        window.clearInterval(musicIntervalRef.current);
      }
      if (audioContextRef.current) {
        void audioContextRef.current.close();
      }
    };
  }, []);

  function loadLevel(targetLevel: number) {
    const clampedLevel = Math.min(Math.max(targetLevel, 1), MAX_LEVEL);
    const nextLevelPieces = createLevelPieces(clampedLevel);

    setLevel(clampedLevel);
    setLevelPieces(nextLevelPieces);
    setBoard(createEmptyBoard());
    setTray(nextLevelPieces);
    setSelectedPieceId(null);
    setDraggingPieceId(null);
    setHoverAnchor(null);
  }

  function findTrayPiece(pieceId: string | null): Piece | undefined {
    if (!pieceId) {
      return undefined;
    }
    return tray.find((piece) => piece.id === pieceId);
  }

  function consumePiece(pieceId: string) {
    setTray((prev) => prev.filter((piece) => piece.id !== pieceId));
  }

  function rotatePiece(pieceId: string) {
    setTray((prev) =>
      prev.map((piece) => {
        if (piece.id !== pieceId || !piece.rotatable) {
          return piece;
        }

        return {
          ...piece,
          rotation: (piece.rotation + 1) % 4,
          shape: {
            ...piece.shape,
            cells: rotateCellsClockwise(piece.shape.cells),
          },
        };
      }),
    );
  }

  function getDragOffsetFromEvent(eventTarget: EventTarget | null): {
    row: number;
    col: number;
  } {
    if (!(eventTarget instanceof HTMLElement)) {
      return { row: 0, col: 0 };
    }

    const activeCell = eventTarget.closest<HTMLElement>("[data-piece-cell='true']");
    if (!activeCell) {
      return { row: 0, col: 0 };
    }

    const row = Number.parseInt(activeCell.dataset.cellRow ?? "0", 10);
    const col = Number.parseInt(activeCell.dataset.cellCol ?? "0", 10);

    return {
      row: Number.isNaN(row) ? 0 : row,
      col: Number.isNaN(col) ? 0 : col,
    };
  }

  function getAnchorWithDragOffset(row: number, col: number, pieceId: string) {
    if (pieceId !== draggingPieceId) {
      return { row, col };
    }

    return {
      row: row - dragOffset.row,
      col: col - dragOffset.col,
    };
  }

  function getAnchorFromPointer(clientX: number, clientY: number) {
    const boardElement = boardGridRef.current;
    if (!boardElement) {
      return null;
    }

    const rect = boardElement.getBoundingClientRect();
    const gap = CELL_GAP_PX;
    const cellSizePx = (rect.width - (BOARD_SIZE - 1) * gap) / BOARD_SIZE;
    const stride = cellSizePx + gap;

    const pointerX = clientX - rect.left;
    const pointerY = clientY - rect.top;

    const col = Math.min(Math.max(Math.floor(pointerX / stride), 0), BOARD_SIZE - 1);
    const row = Math.min(Math.max(Math.floor(pointerY / stride), 0), BOARD_SIZE - 1);

    // Drag events already report cursor-anchored coordinates, so avoid extra offset.
    return { row, col };
  }

  function attemptPlacement(pieceId: string, row: number, col: number) {
    const piece = findTrayPiece(pieceId);
    if (!piece) {
      return;
    }

    setBoard((prevBoard) => placePiece(normalizeBoard(prevBoard), piece, row, col));
    playPlacementClick();
    const remainingAfterPlacement = tray.length - 1;
    consumePiece(piece.id);
    setSelectedPieceId(null);
    setHoverAnchor(null);
    if (remainingAfterPlacement <= 0) {
      markLevelCompleted(level);
      return;
    }
  }

  function restartGame() {
    setBoard(createEmptyBoard());
    setTray(levelPieces);
    setSelectedPieceId(null);
    setDraggingPieceId(null);
    setDragOffset({ row: 0, col: 0 });
    setHoverAnchor(null);
  }

  function loadNextLevel() {
    const nextLevel = level >= MAX_LEVEL ? 1 : level + 1;
    loadLevel(nextLevel);
  }

  const previewPiece = findTrayPiece(draggingPieceId ?? selectedPieceId);
  const previewFits =
    previewPiece && hoverAnchor
      ? canPlacePiece(safeBoard, previewPiece, hoverAnchor.row, hoverAnchor.col)
      : null;

  return (
    <main className="h-[100dvh] overflow-hidden bg-[radial-gradient(circle_at_top,_#fff7ed,_#ffedd5_45%,_#fed7aa)] px-3 py-3 text-zinc-900 sm:px-5 sm:py-4">
      <div className="mx-auto flex h-full w-full max-w-2xl flex-col gap-3 sm:gap-4">
        <div
          className="mx-auto flex w-full items-center justify-between"
          style={{ width: BOARD_PIXEL_SIZE }}
        >
          <button
            type="button"
            onClick={restartGame}
            aria-label="Restart"
            title="Restart"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-amber-50 transition hover:brightness-105"
            style={getWoodControlStyle("#9C6B3E")}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
              <path
                d="M4 4v6h6M20 12a8 8 0 1 1-2.34-5.66L20 8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <p
            className="rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-amber-50 sm:text-sm"
            style={getWoodControlStyle("#8F5A2D")}
          >
            Level {level}
          </p>
          <Link
            href="/"
            aria-label="Home"
            title="Home"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-amber-50 transition hover:brightness-105"
            style={getWoodControlStyle("#A86631")}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
              <path
                d="M3 11.5L12 4l9 7.5M6.5 9.5V20h11V9.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>

        <section className="flex min-h-0 flex-1 items-center justify-center p-1 sm:p-2">
          <div className="mx-auto">
            <div
              ref={boardGridRef}
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${BOARD_SIZE}, ${CELL_SIZE})`,
                gap: `${CELL_GAP_PX}px`,
                width: BOARD_PIXEL_SIZE,
              }}
              onDragOver={(event) => {
                event.preventDefault();
                const pieceId =
                  event.dataTransfer.getData("text/piece-id") || draggingPieceId;
                if (!pieceId) {
                  return;
                }

                const anchor = getAnchorFromPointer(event.clientX, event.clientY);
                if (!anchor) {
                  return;
                }

                event.dataTransfer.dropEffect = "move";
                setHoverAnchor(anchor);
              }}
              onDrop={(event) => {
                event.preventDefault();
                const pieceId =
                  event.dataTransfer.getData("text/piece-id") || draggingPieceId;
                if (!pieceId) {
                  return;
                }

                const anchor = getAnchorFromPointer(event.clientX, event.clientY);
                if (!anchor) {
                  return;
                }

                setHoverAnchor(anchor);
                attemptPlacement(pieceId, anchor.row, anchor.col);
                setDraggingPieceId(null);
                setDragOffset({ row: 0, col: 0 });
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                  setHoverAnchor(null);
                }
              }}
            >
            {safeBoard.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                let isPreviewCell = false;

                if (previewPiece && hoverAnchor) {
                  isPreviewCell = previewPiece.shape.cells.some(([dRow, dCol]) => {
                    return (
                      hoverAnchor.row + dRow === rowIndex &&
                      hoverAnchor.col + dCol === colIndex
                    );
                  });
                }

                return (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    type="button"
                    onClick={() => {
                      if (!selectedPieceId) {
                        return;
                      }
                      const anchor = getAnchorWithDragOffset(
                        rowIndex,
                        colIndex,
                        selectedPieceId,
                      );
                      setHoverAnchor(anchor);
                      attemptPlacement(selectedPieceId, anchor.row, anchor.col);
                    }}
                    className="rounded-[0.4rem] border border-orange-200 bg-white/70 transition-colors"
                    style={{
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                    }}
                  >
                    <span
                      className="block h-full w-full rounded-[0.3rem]"
                      style={{
                        ...(cell
                          ? getMergedBoardCellStyle(cell)
                          : {
                              backgroundColor: isPreviewCell
                                ? previewFits
                                  ? "rgba(22, 163, 74, 0.4)"
                                  : "rgba(220, 38, 38, 0.35)"
                                : "transparent",
                            }),
                      }}
                    />
                  </button>
                );
              }),
            )}
            </div>
          </div>
        </section>

        <section className="mt-auto p-2 sm:p-3">
          <div className="rounded-2xl border border-orange-200/80 bg-white/65 p-2 shadow-[0_10px_24px_rgba(194,138,75,0.2)] sm:p-3">
            <div
              className="flex overflow-x-auto pb-1"
              style={{ gap: `${TRAY_PIECE_GAP_PX}px` }}
            >
            {tray.map((piece) => {
              const bounds = getShapeBounds(piece.shape);
              const maxBounds = getMaxRotatedBounds(piece.shape.cells);
              const selected = selectedPieceId === piece.id;
              const isDragging = draggingPieceId === piece.id;
              const cellSize = TRAY_CELL_SIZE;

              return (
                <button
                  key={piece.id}
                  type="button"
                  draggable
                  onClick={() => {
                    if (piece.rotatable) {
                      rotatePiece(piece.id);
                      setSelectedPieceId(piece.id);
                      return;
                    }
                    setSelectedPieceId((prev) => (prev === piece.id ? null : piece.id));
                  }}
                  onDragStart={(event) => {
                    event.dataTransfer.setData("text/piece-id", piece.id);
                    event.dataTransfer.effectAllowed = "move";
                    setDraggingPieceId(piece.id);
                    setDragOffset(getDragOffsetFromEvent(event.target));
                    setSelectedPieceId(piece.id);
                  }}
                  onDragEnd={() => {
                    setDraggingPieceId(null);
                    setDragOffset({ row: 0, col: 0 });
                    setHoverAnchor(null);
                  }}
                  className={`shrink-0 rounded-lg transition ${
                    selected
                      ? "bg-orange-100/60"
                      : "hover:bg-orange-100/40"
                  }`}
                  style={{
                    width: `calc(${maxBounds.width} * ${cellSize} + ${(maxBounds.width - 1) * TRAY_INNER_GAP_PX}px)`,
                    height: `calc(${maxBounds.height} * ${cellSize} + ${(maxBounds.height - 1) * TRAY_INNER_GAP_PX}px)`,
                  }}
                >
                  <span
                    className={`relative mx-auto block transition-transform ${
                      isDragging ? "scale-[1.35]" : "scale-100"
                    }`}
                    style={{
                      width: `calc(${bounds.width} * ${cellSize} + ${(bounds.width - 1) * TRAY_INNER_GAP_PX}px)`,
                      height: `calc(${bounds.height} * ${cellSize} + ${(bounds.height - 1) * TRAY_INNER_GAP_PX}px)`,
                    }}
                  >
                    <span
                      className="grid"
                      style={{
                        gridTemplateRows: `repeat(${bounds.height}, ${cellSize})`,
                        gridTemplateColumns: `repeat(${bounds.width}, ${cellSize})`,
                        gap: `${TRAY_INNER_GAP_PX}px`,
                      }}
                    >
                      {Array.from({ length: bounds.height }).map((_, rowIndex) =>
                        Array.from({ length: bounds.width }).map((__, colIndex) => {
                          const active = piece.shape.cells.some(
                            ([dRow, dCol]) => dRow === rowIndex && dCol === colIndex,
                          );

                          return (
                            <span
                              key={`${piece.id}-${rowIndex}-${colIndex}`}
                              className="rounded-[0.3rem]"
                              data-piece-cell={active ? "true" : undefined}
                              data-cell-row={active ? rowIndex : undefined}
                              data-cell-col={active ? colIndex : undefined}
                              style={{
                                ...(active
                                  ? { ...getWoodTileStyle(piece.color), borderRadius: BLOCK_RADIUS }
                                  : { backgroundColor: "transparent", border: "none" }),
                              }}
                            />
                          );
                        }),
                      )}
                    </span>
                    {piece.rotatable ? (
                      <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-amber-100/80 bg-black/25">
                          <svg
                            viewBox="0 0 24 24"
                            className="h-4 w-4 text-amber-50"
                            fill="none"
                            aria-hidden="true"
                          >
                            <path
                              d="M6 6v5h5M18 12a6 6 0 1 1-1.76-4.24L18 9"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })}
            </div>
          </div>
        </section>

        {isLevelComplete ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-sm rounded-2xl border border-orange-300/80 bg-[radial-gradient(circle_at_top,_#fff8ef,_#ffedd5_52%,_#fed7aa)] p-5 text-center shadow-[0_18px_40px_rgba(51,27,12,0.35)]">
              <h2 className="text-2xl font-black uppercase tracking-[0.14em] text-orange-900">
                Level Complete!
              </h2>
              <p className="mt-2 text-sm font-semibold text-orange-800">
                Great job. Ready for the next puzzle?
              </p>
              <div className="mt-5 grid grid-cols-2 gap-2.5">
                <Link
                  href="/"
                  className="rounded-lg border border-orange-300 bg-white/85 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-orange-800 transition hover:bg-orange-100"
                >
                  Home Page
                </Link>
                <button
                  type="button"
                  onClick={loadNextLevel}
                  className="rounded-lg border border-orange-400 bg-orange-200/90 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-orange-900 transition hover:bg-orange-300"
                >
                  Next Level
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
