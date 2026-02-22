export const COLS = 10;
export const ROWS = 20;

export type PieceType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

export interface Piece {
  shape: number[][];
  pattern: string;
  type: PieceType;
}

export const PIECES: Record<PieceType, Piece> = {
  'I': {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    pattern: 'block-pattern-1',
    type: 'I'
  },
  'J': {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    pattern: 'block-pattern-2',
    type: 'J'
  },
  'L': {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    pattern: 'block-pattern-3',
    type: 'L'
  },
  'O': {
    shape: [
      [1, 1],
      [1, 1],
    ],
    pattern: 'block-pattern-1',
    type: 'O'
  },
  'S': {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    pattern: 'block-pattern-2',
    type: 'S'
  },
  'T': {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    pattern: 'block-pattern-3',
    type: 'T'
  },
  'Z': {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    pattern: 'block-pattern-1',
    type: 'Z'
  },
};

export const GB_COLORS = {
  darkest: '#0f380f',
  dark: '#306230',
  light: '#8bac0f',
  lightest: '#9bbc0f',
};

// Gameboy scoring: 40, 100, 300, 1200 multiplied by (level + 1)
export const SCORING = [0, 40, 100, 300, 1200];

// Gameboy speeds (frames per grid cell) - roughly converted to ms
// Level 0: 53 frames (~880ms)
// Level 9: 6 frames (~100ms)
export const getSpeed = (level: number) => {
  const speeds = [
    880, 820, 750, 680, 620, 550, 470, 370, 270, 180, 150, 130, 120, 100, 100, 80, 80, 80, 70, 70
  ];
  return speeds[Math.min(level, speeds.length - 1)];
};
