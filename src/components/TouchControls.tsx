import React, { useRef } from 'react';
import { PlayerInput } from '../types';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Crosshair, Zap } from 'lucide-react';

interface TouchControlsProps {
  onInputUpdate: (updater: (prev: PlayerInput) => PlayerInput) => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ onInputUpdate }) => {
  const dpadRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (dir: keyof PlayerInput) => {
    onInputUpdate((prev) => ({ ...prev, [dir]: true }));
  };

  const handleTouchEnd = (dir: keyof PlayerInput) => {
    onInputUpdate((prev) => ({ ...prev, [dir]: false }));
  };

  return (
    <div id="touch-controls-overlay" className="fixed bottom-3 inset-x-0 px-4 pointer-events-none flex justify-between items-end z-40 select-none md:hidden font-mono">
      {/* 8-WAY D-PAD */}
      <div id="virtual-dpad" className="pointer-events-auto bg-[#121216] p-2 border-2 border-[#333] shadow-[4px_4px_0px_#000]">
        <div className="grid grid-cols-3 gap-1 w-36 h-36">
          {/* Top-Left Diagonal */}
          <button
            id="btn-touch-up-left"
            className="bg-[#1a1a1e] active:bg-[#00f2ff] active:text-black border border-[#333] flex items-center justify-center text-slate-400"
            onTouchStart={() => {
              onInputUpdate((p) => ({ ...p, up: true, left: true }));
            }}
            onTouchEnd={() => {
              onInputUpdate((p) => ({ ...p, up: false, left: false }));
            }}
          >
            <span className="text-[10px] font-bold">↖</span>
          </button>

          {/* UP (Aim Up) */}
          <button
            id="btn-touch-up"
            className="bg-[#1a1a1e] active:bg-[#00f2ff] active:text-black border border-[#333] flex items-center justify-center text-[#00f2ff]"
            onTouchStart={() => handleTouchStart('up')}
            onTouchEnd={() => handleTouchEnd('up')}
          >
            <ArrowUp className="w-6 h-6" />
          </button>

          {/* Top-Right Diagonal */}
          <button
            id="btn-touch-up-right"
            className="bg-[#1a1a1e] active:bg-[#00f2ff] active:text-black border border-[#333] flex items-center justify-center text-slate-400"
            onTouchStart={() => {
              onInputUpdate((p) => ({ ...p, up: true, right: true }));
            }}
            onTouchEnd={() => {
              onInputUpdate((p) => ({ ...p, up: false, right: false }));
            }}
          >
            <span className="text-[10px] font-bold">↗</span>
          </button>

          {/* LEFT */}
          <button
            id="btn-touch-left"
            className="bg-[#1a1a1e] active:bg-[#00f2ff] active:text-black border border-[#333] flex items-center justify-center text-[#00f2ff]"
            onTouchStart={() => handleTouchStart('left')}
            onTouchEnd={() => handleTouchEnd('left')}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          {/* Center indicator */}
          <div className="bg-[#050507] flex items-center justify-center border border-[#333]">
            <div className="w-2.5 h-2.5 bg-[#ff2d55]" />
          </div>

          {/* RIGHT */}
          <button
            id="btn-touch-right"
            className="bg-[#1a1a1e] active:bg-[#00f2ff] active:text-black border border-[#333] flex items-center justify-center text-[#00f2ff]"
            onTouchStart={() => handleTouchStart('right')}
            onTouchEnd={() => handleTouchEnd('right')}
          >
            <ArrowRight className="w-6 h-6" />
          </button>

          {/* Bottom-Left Diagonal */}
          <button
            id="btn-touch-down-left"
            className="bg-[#1a1a1e] active:bg-[#00f2ff] active:text-black border border-[#333] flex items-center justify-center text-slate-400"
            onTouchStart={() => {
              onInputUpdate((p) => ({ ...p, down: true, left: true }));
            }}
            onTouchEnd={() => {
              onInputUpdate((p) => ({ ...p, down: false, left: false }));
            }}
          >
            <span className="text-[10px] font-bold">↙</span>
          </button>

          {/* DOWN (Prone/Duck/Drop through) */}
          <button
            id="btn-touch-down"
            className="bg-[#1a1a1e] active:bg-[#00f2ff] active:text-black border border-[#333] flex items-center justify-center text-[#00f2ff]"
            onTouchStart={() => handleTouchStart('down')}
            onTouchEnd={() => handleTouchEnd('down')}
          >
            <ArrowDown className="w-6 h-6" />
          </button>

          {/* Bottom-Right Diagonal */}
          <button
            id="btn-touch-down-right"
            className="bg-[#1a1a1e] active:bg-[#00f2ff] active:text-black border border-[#333] flex items-center justify-center text-slate-400"
            onTouchStart={() => {
              onInputUpdate((p) => ({ ...p, down: true, right: true }));
            }}
            onTouchEnd={() => {
              onInputUpdate((p) => ({ ...p, down: false, right: false }));
            }}
          >
            <span className="text-[10px] font-bold">↘</span>
          </button>
        </div>
      </div>

      {/* ACTION BUTTONS (JUMP & FIRE) */}
      <div id="virtual-action-buttons" className="pointer-events-auto flex items-center gap-3 bg-[#121216] p-2.5 border-2 border-[#333] shadow-[4px_4px_0px_#000]">
        {/* FIRE BUTTON */}
        <button
          id="btn-touch-fire"
          className="w-14 h-14 bg-[#ff2d55] active:bg-red-400 border-2 border-white shadow-[3px_3px_0px_#000] flex flex-col items-center justify-center text-white active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition"
          onTouchStart={() => handleTouchStart('fire')}
          onTouchEnd={() => handleTouchEnd('fire')}
        >
          <Crosshair className="w-5 h-5" />
          <span className="text-[9px] font-black tracking-widest mt-0.5">FIRE</span>
        </button>

        {/* JUMP BUTTON */}
        <button
          id="btn-touch-jump"
          className="w-14 h-14 bg-[#00f2ff] active:bg-cyan-200 border-2 border-white shadow-[3px_3px_0px_#000] flex flex-col items-center justify-center text-black active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition"
          onTouchStart={() => handleTouchStart('jump')}
          onTouchEnd={() => handleTouchEnd('jump')}
        >
          <Zap className="w-5 h-5" />
          <span className="text-[9px] font-black tracking-widest mt-0.5">JUMP</span>
        </button>
      </div>
    </div>
  );
};
