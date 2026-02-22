import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
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
      <div className="flex h-full w-full">
        {/* Left Brick Border */}
        <div className="w-4 h-full brick-border border-r border-gb-4" />
        
        {/* Playfield */}
        <div className="flex-1 h-full grid grid-cols-10 grid-rows-20 bg-gb-1">
          {displayGrid.map((row, y) => 
            row.map((cell, x) => (
              <div key={`${y}-${x}`} className="w-full h-full p-[0.5px]">
                {cell && (
                  <div className={`w-full h-full ${PIECES[cell as keyof typeof PIECES].pattern}`} />
                )}
              </div>
            ))
          )}
        </div>

        {/* Right Brick Border */}
        <div className="w-4 h-full brick-border border-l border-gb-4" />
      </div>
    );
  };

  const renderNextPiece = () => {
    const piece = PIECES[nextPiece];
    const displayShape = Array.from({ length: 4 }, () => Array(4).fill(0));
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
      <div className="grid grid-cols-4 grid-rows-4 gap-0 w-12 h-12">
        {displayShape.map((row, y) => 
          row.map((value, x) => (
            <div key={`${y}-${x}`} className="w-full h-full p-[0.5px]">
              {value !== 0 && (
                <div className={`w-full h-full ${piece.pattern}`} />
              )}
            </div>
          ))
        )}
      </div>
    );
  };

  const InfoBox = ({ title, value, className = "" }: { title: string, value: string | number, className?: string }) => (
    <div className={`border-2 border-gb-4 rounded-sm p-1 bg-gb-1 ${className}`}>
      <div className="border border-gb-4 rounded-sm p-1 flex flex-col items-center">
        <span className="text-[8px] font-bold mb-1">{title}</span>
        <span className="text-[10px] font-bold">{value}</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-black overflow-auto">
      {/* Gameboy Body */}
      <div className="relative w-[340px] bg-zinc-400 rounded-[15px_15px_50px_15px] p-6 shadow-2xl border-b-8 border-r-8 border-zinc-500">
        
        {/* Screen Area */}
        <div className="bg-zinc-600 p-4 rounded-lg mb-6 shadow-inner">
          <div className="flex justify-between items-center mb-1 px-1">
            <div className="w-1.5 h-1.5 rounded-full bg-red-600 shadow-[0_0_5px_red]" />
            <span className="text-[6px] text-zinc-300 font-bold tracking-widest">BATTERY</span>
          </div>
          
          <div className="gb-screen relative aspect-[1.1/1] w-full border-4 border-zinc-800 overflow-hidden">
            <div className="flex h-full w-full">
              {/* Playfield Area */}
              <div className="w-[65%] h-full">
                {renderGrid()}
              </div>

              {/* Info Panel Area */}
              <div className="flex-1 h-full flex flex-col p-2 gap-2 bg-gb-2 border-l-2 border-gb-4">
                <div className="flex flex-col gap-2">
                  <div className="border-2 border-gb-4 rounded-sm bg-gb-1">
                    <div className="bg-gb-4 text-gb-1 text-[8px] p-1 text-center">SCORE</div>
                    <div className="p-1 text-center text-[10px] font-bold">{score}</div>
                  </div>

                  <InfoBox title="LEVEL" value={level} />
                  <InfoBox title="LINES" value={lines} />
                </div>

                <div className="mt-auto border-2 border-gb-4 rounded-sm p-2 bg-gb-1 flex items-center justify-center aspect-square">
                  {renderNextPiece()}
                </div>
              </div>
            </div>

            {/* Overlays */}
            <AnimatePresence>
              {gameOver && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-gb-1/95 flex flex-col items-center justify-center p-4 text-center z-10"
                >
                  <h2 className="text-sm mb-4">GAME OVER</h2>
                  <p className="text-[10px] mb-4">SCORE: {score}</p>
                  
                  {!showLeaderboard ? (
                    <form onSubmit={handleSubmitScore} className="flex flex-col gap-2 w-full">
                      <input 
                        type="text" 
                        maxLength={10}
                        placeholder="NAME"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
                        className="bg-gb-1 border-2 border-gb-4 p-1 text-[10px] outline-none"
                        autoFocus
                      />
                      <button 
                        disabled={isSubmitting}
                        className="bg-gb-4 text-gb-1 p-2 text-[8px]"
                      >
                        {isSubmitting ? 'SAVING...' : 'SUBMIT'}
                      </button>
                    </form>
                  ) : (
                    <div className="w-full flex flex-col gap-2">
                      <div className="max-h-32 overflow-y-auto mb-2">
                        {scores.map((s, i) => (
                          <div key={s.id} className="flex justify-between text-[8px] mb-1">
                            <span>{i+1}. {s.name}</span>
                            <span>{s.score}</span>
                          </div>
                        ))}
                      </div>
                      <button 
                        onClick={() => { resetGame(); setShowLeaderboard(false); setPlayerName(''); }}
                        className="bg-gb-4 text-gb-1 p-2 text-[8px]"
                      >
                        RESTART
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {paused && !gameOver && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-gb-1/60 flex items-center justify-center z-10"
                >
                  <span className="text-sm animate-pulse">PAUSED</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-between items-start px-2">
          {/* D-Pad */}
          <div className="relative w-24 h-24">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-20 bg-zinc-800 rounded-sm shadow-lg" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-6 bg-zinc-800 rounded-sm shadow-lg" />
            
            <button onMouseDown={() => move({ x: -1, y: 0 })} className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center active:scale-90 transition-transform"><ChevronLeft className="text-zinc-600" /></button>
            <button onMouseDown={() => move({ x: 1, y: 0 })} className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center active:scale-90 transition-transform"><ChevronRight className="text-zinc-600" /></button>
            <button onMouseDown={() => handleRotate()} className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 flex items-center justify-center active:scale-90 transition-transform"><ChevronDown className="text-zinc-600 rotate-180" /></button>
            <button onMouseDown={() => drop(true)} className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-8 flex items-center justify-center active:scale-90 transition-transform"><ChevronDown className="text-zinc-600" /></button>
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-zinc-900/50" />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6 -rotate-12">
            <div className="flex flex-col items-center gap-1">
              <button 
                onMouseDown={() => handleRotate()}
                className="w-10 h-10 bg-zinc-800 rounded-full shadow-lg border-b-4 border-zinc-900 active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center"
              >
                <span className="text-zinc-500 text-[10px] font-bold">B</span>
              </button>
            </div>
            <div className="flex flex-col items-center gap-1">
              <button 
                onMouseDown={() => handleRotate()}
                className="w-10 h-10 bg-zinc-800 rounded-full shadow-lg border-b-4 border-zinc-900 active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center"
              >
                <span className="text-zinc-500 text-[10px] font-bold">A</span>
              </button>
            </div>
          </div>
        </div>

        {/* Start/Select */}
        <div className="flex justify-center gap-6 mt-8">
          <div className="flex flex-col items-center gap-1">
            <button 
              onClick={() => setPaused(!paused)}
              className="w-10 h-2.5 bg-zinc-700 rounded-full rotate-[-25deg] shadow-md active:scale-95 transition-transform"
            />
            <span className="text-[5px] text-zinc-600 font-bold">SELECT</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <button 
              onClick={() => { if (gameOver) resetGame(); else setPaused(!paused); }}
              className="w-10 h-2.5 bg-zinc-700 rounded-full rotate-[-25deg] shadow-md active:scale-95 transition-transform"
            />
            <span className="text-[5px] text-zinc-600 font-bold">START</span>
          </div>
        </div>

        {/* Logo */}
        <div className="mt-6 flex justify-between items-end px-2">
          <h1 className="text-zinc-600 text-[10px] italic font-black tracking-tighter">
            Nintendo <span className="text-[8px] not-italic font-normal">GAME BOY</span>
          </h1>
          
          {/* Speaker Grill */}
          <div className="flex gap-1 rotate-[-25deg] mb-1">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="w-1 h-8 bg-zinc-500 rounded-full shadow-inner" />
            ))}
          </div>
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
