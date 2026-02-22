import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Play, RotateCcw, Pause, ChevronLeft, ChevronRight, ChevronDown, RotateCw } from 'lucide-react';
import { useTetris } from './useTetris';
import { COLS, ROWS, PIECES } from './constants';

interface Score {
  id: number;
  name: string;
  score: number;
  level: number;
  lines: number;
  created_at: string;
}

export default function App() {
  const {
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
  } = useTetris();

  const [scores, setScores] = useState<Score[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchScores = async () => {
    try {
      const res = await fetch('/api/scores');
      const data = await res.json();
      setScores(data);
    } catch (err) {
      console.error('Failed to fetch scores', err);
    }
  };

  useEffect(() => {
    fetchScores();
  }, []);

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    setIsSubmitting(true);
    try {
      await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playerName, score, level, lines })
      });
      await fetchScores();
      setShowLeaderboard(true);
    } catch (err) {
      console.error('Failed to submit score', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return;
      switch (e.key) {
        case 'ArrowLeft': move({ x: -1, y: 0 }); break;
        case 'ArrowRight': move({ x: 1, y: 0 }); break;
        case 'ArrowDown': drop(true); break;
        case 'ArrowUp': handleRotate(); break;
        case 'p': setPaused(!paused); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move, drop, handleRotate, gameOver, paused, setPaused]);

  const renderGrid = () => {
    const displayGrid = grid.map(row => [...row]);
    if (activePiece) {
      activePiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value !== 0) {
            const gridY = activePiece.pos.y + y;
            const gridX = activePiece.pos.x + x;
            if (gridY >= 0 && gridY < ROWS && gridX >= 0 && gridX < COLS) {
              displayGrid[gridY][gridX] = activePiece.type;
            }
          }
        });
      });
    }

    return (
      <div className="grid grid-cols-10 grid-rows-20 gap-px bg-gb-dark/20 p-px h-full">
        {displayGrid.map((row, y) => 
          row.map((cell, x) => (
            <div 
              key={`${y}-${x}`} 
              className={`w-full h-full border border-gb-dark/5 ${cell ? 'bg-gb-darkest shadow-[inset_2px_2px_0_rgba(255,255,255,0.2)]' : 'bg-transparent'}`}
            />
          ))
        )}
      </div>
    );
  };

  const renderNextPiece = () => {
    const piece = PIECES[nextPiece];
    const displayShape = Array.from({ length: 4 }, () => Array(4).fill(0));
    
    // Center the piece in the 4x4 preview
    const offsetX = Math.floor((4 - piece.shape[0].length) / 2);
    const offsetY = Math.floor((4 - piece.shape.length) / 2);

    piece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          displayShape[y + offsetY][x + offsetX] = 1;
        }
      });
    });

    return (
      <div className="grid grid-cols-4 grid-rows-4 gap-px w-12 h-12">
        {displayShape.map((row, y) => 
          row.map((value, x) => (
            <div 
              key={`${y}-${x}`} 
              className={`aspect-square w-full ${value ? 'bg-gb-darkest shadow-[inset_1px_1px_0_rgba(255,255,255,0.2)]' : 'bg-transparent'}`}
            />
          ))
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-900 overflow-auto">
      {/* Gameboy Body */}
      <div className="relative w-[380px] bg-zinc-400 rounded-[20px_20px_60px_20px] p-8 shadow-2xl border-b-8 border-r-8 border-zinc-500">
        
        {/* Screen Area */}
        <div className="bg-zinc-600 p-6 rounded-lg mb-8 shadow-inner">
          <div className="flex justify-between items-center mb-2 px-1">
            <div className="w-2 h-2 rounded-full bg-red-600 shadow-[0_0_5px_red]" />
            <span className="text-[8px] text-zinc-300 font-bold tracking-widest">BATTERY</span>
          </div>
          
          <div className="gb-screen pixel-grid relative aspect-[3/4] w-full border-4 border-zinc-800 overflow-hidden flex">
            {/* Game Content */}
            <div className="flex-1 h-full border-r-2 border-gb-dark/30 overflow-hidden">
              {renderGrid()}
            </div>

            {/* Side Info */}
            <div className="w-24 h-full p-2 flex flex-col gap-4 text-gb-darkest">
              <div className="flex flex-col">
                <span className="text-[8px] mb-1">NEXT</span>
                <div className="bg-gb-light/30 p-1 rounded border border-gb-dark/20 flex items-center justify-center h-14">
                  {renderNextPiece()}
                </div>
              </div>

              <div className="flex flex-col">
                <span className="text-[8px] mb-1">SCORE</span>
                <span className="text-[10px] font-bold">{score.toString().padStart(6, '0')}</span>
              </div>

              <div className="flex flex-col">
                <span className="text-[8px] mb-1">LEVEL</span>
                <span className="text-[10px] font-bold">{level.toString().padStart(2, '0')}</span>
              </div>

              <div className="flex flex-col">
                <span className="text-[8px] mb-1">LINES</span>
                <span className="text-[10px] font-bold">{lines.toString().padStart(3, '0')}</span>
              </div>
            </div>

            {/* Overlays */}
            <AnimatePresence>
              {gameOver && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-gb-lightest/90 flex flex-col items-center justify-center p-4 text-center"
                >
                  <h2 className="text-sm mb-4 text-gb-darkest">GAME OVER</h2>
                  <p className="text-[10px] mb-4 text-gb-darkest">SCORE: {score}</p>
                  
                  {!showLeaderboard ? (
                    <form onSubmit={handleSubmitScore} className="flex flex-col gap-2 w-full">
                      <input 
                        type="text" 
                        maxLength={10}
                        placeholder="NAME"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
                        className="bg-gb-light border-2 border-gb-darkest p-1 text-[10px] text-gb-darkest outline-none placeholder:text-gb-dark/50"
                        autoFocus
                      />
                      <button 
                        disabled={isSubmitting}
                        className="bg-gb-darkest text-gb-lightest p-2 text-[8px] hover:bg-gb-dark active:scale-95 transition-all"
                      >
                        {isSubmitting ? 'SAVING...' : 'SUBMIT SCORE'}
                      </button>
                    </form>
                  ) : (
                    <div className="w-full flex flex-col gap-2">
                      <div className="max-h-32 overflow-y-auto mb-2">
                        {scores.map((s, i) => (
                          <div key={s.id} className="flex justify-between text-[8px] text-gb-darkest mb-1">
                            <span>{i+1}. {s.name}</span>
                            <span>{s.score}</span>
                          </div>
                        ))}
                      </div>
                      <button 
                        onClick={() => { resetGame(); setShowLeaderboard(false); setPlayerName(''); }}
                        className="bg-gb-darkest text-gb-lightest p-2 text-[8px] hover:bg-gb-dark active:scale-95 transition-all"
                      >
                        PLAY AGAIN
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {paused && !gameOver && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-gb-lightest/60 backdrop-blur-[1px] flex items-center justify-center"
                >
                  <span className="text-sm text-gb-darkest animate-pulse">PAUSED</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-between items-start px-4">
          {/* D-Pad */}
          <div className="relative w-28 h-28">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-24 bg-zinc-800 rounded-sm shadow-lg" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-8 bg-zinc-800 rounded-sm shadow-lg" />
            
            <button onMouseDown={() => move({ x: -1, y: 0 })} className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center active:scale-90 transition-transform"><ChevronLeft className="text-zinc-600" /></button>
            <button onMouseDown={() => move({ x: 1, y: 0 })} className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center active:scale-90 transition-transform"><ChevronRight className="text-zinc-600" /></button>
            <button onMouseDown={() => handleRotate()} className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 flex items-center justify-center active:scale-90 transition-transform"><ChevronDown className="text-zinc-600 rotate-180" /></button>
            <button onMouseDown={() => drop(true)} className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-8 flex items-center justify-center active:scale-90 transition-transform"><ChevronDown className="text-zinc-600" /></button>
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-zinc-900/50" />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8 -rotate-12">
            <div className="flex flex-col items-center gap-1">
              <button 
                onMouseDown={() => handleRotate()}
                className="w-12 h-12 bg-zinc-800 rounded-full shadow-lg border-b-4 border-zinc-900 active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center"
              >
                <span className="text-zinc-500 text-xs font-bold">B</span>
              </button>
            </div>
            <div className="flex flex-col items-center gap-1">
              <button 
                onMouseDown={() => handleRotate()}
                className="w-12 h-12 bg-zinc-800 rounded-full shadow-lg border-b-4 border-zinc-900 active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center"
              >
                <span className="text-zinc-500 text-xs font-bold">A</span>
              </button>
            </div>
          </div>
        </div>

        {/* Start/Select */}
        <div className="flex justify-center gap-8 mt-12">
          <div className="flex flex-col items-center gap-2">
            <button 
              onClick={() => setPaused(!paused)}
              className="w-12 h-3 bg-zinc-700 rounded-full rotate-[-25deg] shadow-md active:scale-95 transition-transform"
            />
            <span className="text-[6px] text-zinc-600 font-bold">SELECT</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <button 
              onClick={() => { if (gameOver) resetGame(); else setPaused(!paused); }}
              className="w-12 h-3 bg-zinc-700 rounded-full rotate-[-25deg] shadow-md active:scale-95 transition-transform"
            />
            <span className="text-[6px] text-zinc-600 font-bold">START</span>
          </div>
        </div>

        {/* Logo */}
        <div className="mt-8 text-center">
          <h1 className="text-zinc-600 text-sm italic font-black tracking-tighter">
            Nintendo <span className="text-xs not-italic font-normal">GAME BOY</span>
          </h1>
        </div>
      </div>

      {/* Instructions */}
      <div className="fixed bottom-4 right-4 text-zinc-500 text-[8px] flex flex-col gap-1 text-right">
        <p>ARROWS: MOVE & ROTATE</p>
        <p>P: PAUSE</p>
        <p>RECREATED BY AI STUDIO</p>
      </div>
    </div>
  );
}
