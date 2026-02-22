import { useState, useEffect, useCallback, useRef } from 'react';
import { COLS, ROWS, PIECES, PieceType, getSpeed, SCORING } from './constants';

export const useTetris = () => {
  const [grid, setGrid] = useState<string[][]>(Array.from({ length: ROWS }, () => Array(COLS).fill('')));
  const [activePiece, setActivePiece] = useState<{ pos: { x: number, y: number }, type: PieceType, shape: number[][] } | null>(null);
  const [nextPiece, setNextPiece] = useState<PieceType>(getRandomPiece());
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(0);
  const [lines, setLines] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);

  const gameLoopRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const dropCounterRef = useRef<number>(0);

  function getRandomPiece(): PieceType {
    const types: PieceType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
    return types[Math.floor(Math.random() * types.length)];
  }

  const spawnPiece = useCallback(() => {
    const type = nextPiece;
    const piece = PIECES[type];
    const newNext = getRandomPiece();
    setNextPiece(newNext);

    const pos = { x: Math.floor(COLS / 2) - Math.floor(piece.shape[0].length / 2), y: 0 };
    
    // Check for immediate game over
    if (checkCollision(pos, piece.shape, grid)) {
      setGameOver(true);
      return;
    }

    setActivePiece({ pos, type, shape: piece.shape });
  }, [nextPiece, grid]);

  const checkCollision = (pos: { x: number, y: number }, shape: number[][], currentGrid: string[][]) => {
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x] !== 0) {
          const newX = pos.x + x;
          const newY = pos.y + y;
          if (
            newX < 0 || 
            newX >= COLS || 
            newY >= ROWS ||
            (newY >= 0 && currentGrid[newY][newX] !== '')
          ) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const rotate = (shape: number[][]) => {
    const newShape = shape[0].map((_, i) => shape.map(row => row[i]).reverse());
    return newShape;
  };

  const handleRotate = useCallback(() => {
    if (!activePiece || gameOver || paused) return;
    const newShape = rotate(activePiece.shape);
    if (!checkCollision(activePiece.pos, newShape, grid)) {
      setActivePiece(prev => prev ? { ...prev, shape: newShape } : null);
    }
  }, [activePiece, grid, gameOver, paused]);

  const move = useCallback((dir: { x: number, y: number }, isSoftDrop = false) => {
    if (!activePiece || gameOver || paused) return;
    const newPos = { x: activePiece.pos.x + dir.x, y: activePiece.pos.y + dir.y };
    if (!checkCollision(newPos, activePiece.shape, grid)) {
      setActivePiece(prev => prev ? { ...prev, pos: newPos } : null);
      if (isSoftDrop) {
        setScore(prev => prev + 1);
      }
      return true;
    }
    return false;
  }, [activePiece, grid, gameOver, paused]);

  const lockPiece = useCallback(() => {
    if (!activePiece) return;
    
    const newGrid = grid.map(row => [...row]);
    activePiece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          const gridY = activePiece.pos.y + y;
          const gridX = activePiece.pos.x + x;
          if (gridY >= 0 && gridY < ROWS) {
            newGrid[gridY][gridX] = activePiece.type;
          }
        }
      });
    });

    // Clear lines
    let linesCleared = 0;
    const filteredGrid = newGrid.filter(row => {
      const isFull = row.every(cell => cell !== '');
      if (isFull) linesCleared++;
      return !isFull;
    });

    while (filteredGrid.length < ROWS) {
      filteredGrid.unshift(Array(COLS).fill(''));
    }

    if (linesCleared > 0) {
      const newTotalLines = lines + linesCleared;
      setLines(newTotalLines);
      setScore(prev => prev + SCORING[linesCleared] * (level + 1));
      
      // Level up every 10 lines
      const newLevel = Math.floor(newTotalLines / 10);
      if (newLevel > level) {
        setLevel(newLevel);
      }
    }

    setGrid(filteredGrid);
    setActivePiece(null);
    spawnPiece();
  }, [activePiece, grid, lines, level, spawnPiece]);

  const drop = useCallback((isSoftDrop = false) => {
    if (!move({ x: 0, y: 1 }, isSoftDrop)) {
      lockPiece();
    }
  }, [move, lockPiece]);

  const hardDrop = useCallback(() => {
    if (!activePiece || gameOver || paused) return;
    let newY = activePiece.pos.y;
    while (!checkCollision({ x: activePiece.pos.x, y: newY + 1 }, activePiece.shape, grid)) {
      newY++;
    }
    setActivePiece(prev => prev ? { ...prev, pos: { ...prev.pos, y: newY } } : null);
    // Lock will happen on next loop or we can force it
    // For Gameboy feel, we just move it and wait for the next tick or force it
    // Actually, hard drop in modern is instant, but Gameboy didn't have it.
    // I'll implement a fast drop instead or just leave it as is.
  }, [activePiece, grid, gameOver, paused]);

  useEffect(() => {
    if (!activePiece && !gameOver) {
      spawnPiece();
    }
  }, [activePiece, gameOver, spawnPiece]);

  const update = useCallback((time: number) => {
    if (gameOver || paused) return;
    
    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;
    dropCounterRef.current += deltaTime;

    if (dropCounterRef.current > getSpeed(level)) {
      drop();
      dropCounterRef.current = 0;
    }

    gameLoopRef.current = requestAnimationFrame(update);
  }, [gameOver, paused, level, drop]);

  useEffect(() => {
    gameLoopRef.current = requestAnimationFrame(update);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [update]);

  const resetGame = () => {
    setGrid(Array.from({ length: ROWS }, () => Array(COLS).fill('')));
    setActivePiece(null);
    setNextPiece(getRandomPiece());
    setScore(0);
    setLevel(0);
    setLines(0);
    setGameOver(false);
    setPaused(false);
  };

  return {
    grid,
    activePiece,
    nextPiece,
    score,
    level,
    lines,
    gameOver,
    paused,
    setPaused,
    move,
    handleRotate,
    drop,
    resetGame
  };
};
