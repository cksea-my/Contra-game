import React from 'react';
import { X, Gamepad2, Keyboard, Sparkles, Shield, Flame, Zap } from 'lucide-react';

interface ArcadeControlsGuideProps {
  onClose: () => void;
}

export const ArcadeControlsGuide: React.FC<ArcadeControlsGuideProps> = ({ onClose }) => {
  return (
    <div id="controls-guide-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs font-mono">
      <div className="bg-[#0a0a0c] border-4 border-[#333] w-full max-w-xl shadow-[8px_8px_0px_#000] p-6 text-[#e0e0e0] text-sm max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b-2 border-[#333] pb-3 mb-4">
          <div className="flex items-center gap-2 text-[#ffca28] font-bold text-base uppercase tracking-wider">
            <Gamepad2 className="w-5 h-5 text-[#ffca28]" />
            <span>TACTICAL COMBAT CONTROLS & ARSENAL</span>
          </div>
          <button
            id="btn-close-controls-modal"
            onClick={onClose}
            className="p-1 text-[#888] hover:text-white bg-[#1a1a1e] border border-[#333] hover:border-[#00f2ff] shadow-[2px_2px_0px_#000]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* PLAYER 1 CONTROLS */}
          <div className="bg-[#121216] p-3.5 border-2 border-[#333] shadow-[4px_4px_0px_#000]">
            <h4 className="text-[#00f2ff] font-bold flex items-center gap-2 mb-2 uppercase tracking-wider text-xs">
              <Keyboard className="w-4 h-4 text-[#00f2ff]" /> 1P (SGT_BILL) CONTROLS
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-[#888]">Move / Aim:</span> <span className="text-white font-bold bg-[#1a1a1e] px-1.5 py-0.5 border border-[#333]">W/A/S/D</span> or <span className="text-white font-bold bg-[#1a1a1e] px-1.5 py-0.5 border border-[#333]">Arrows</span></div>
              <div><span className="text-[#888]">Aim Diagonals:</span> <span className="text-white font-bold bg-[#1a1a1e] px-1.5 py-0.5 border border-[#333]">W+A / W+D</span></div>
              <div><span className="text-[#888]">Jump / Flip:</span> <span className="text-white font-bold bg-[#1a1a1e] px-1.5 py-0.5 border border-[#333]">J</span> or <span className="text-white font-bold bg-[#1a1a1e] px-1.5 py-0.5 border border-[#333]">Space</span></div>
              <div><span className="text-[#888]">Fire Weapon:</span> <span className="text-white font-bold bg-[#1a1a1e] px-1.5 py-0.5 border border-[#333]">K</span> or <span className="text-white font-bold bg-[#1a1a1e] px-1.5 py-0.5 border border-[#333]">X</span></div>
              <div><span className="text-[#888]">Prone / Duck:</span> <span className="text-white font-bold bg-[#1a1a1e] px-1.5 py-0.5 border border-[#333]">S</span> or <span className="text-white font-bold bg-[#1a1a1e] px-1.5 py-0.5 border border-[#333]">Down</span></div>
              <div><span className="text-[#888]">Drop Platform:</span> <span className="text-white font-bold bg-[#1a1a1e] px-1.5 py-0.5 border border-[#333]">Down+Jump</span></div>
            </div>
          </div>

          {/* LOCAL 2P CONTROLS */}
          <div className="bg-[#121216] p-3.5 border-2 border-[#333] shadow-[4px_4px_0px_#000]">
            <h4 className="text-[#ff2d55] font-bold flex items-center gap-2 mb-2 uppercase tracking-wider text-xs">
              <Keyboard className="w-4 h-4 text-[#ff2d55]" /> 2P (LT_LANCE) LOCAL CO-OP
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-[#888]">Move / Aim:</span> <span className="text-white font-bold bg-[#1a1a1e] px-1.5 py-0.5 border border-[#333]">Arrow Keys</span></div>
              <div><span className="text-[#888]">Jump:</span> <span className="text-white font-bold bg-[#1a1a1e] px-1.5 py-0.5 border border-[#333]">NumPad 1</span> or <span className="text-white font-bold bg-[#1a1a1e] px-1.5 py-0.5 border border-[#333]">N</span></div>
              <div><span className="text-[#888]">Fire:</span> <span className="text-white font-bold bg-[#1a1a1e] px-1.5 py-0.5 border border-[#333]">NumPad 2</span> or <span className="text-white font-bold bg-[#1a1a1e] px-1.5 py-0.5 border border-[#333]">M</span></div>
              <div><span className="text-[#888]">Gamepad:</span> <span className="text-[#00f2ff]">Auto-detected</span></div>
            </div>
          </div>

          {/* WEAPONS ARSENAL */}
          <div className="bg-[#121216] p-3.5 border-2 border-[#333] shadow-[4px_4px_0px_#000]">
            <h4 className="text-[#ffca28] font-bold flex items-center gap-2 mb-2 uppercase tracking-wider text-xs">
              <Sparkles className="w-4 h-4 text-[#ffca28]" /> WEAPONS ARSENAL
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 bg-[#1a1a1e] border-2 border-[#ff2d55] text-[#ff2d55] flex items-center justify-center font-black text-xs">S</span>
                <span className="text-[#ff2d55] font-bold">SPREAD GUN:</span>
                <span className="text-slate-300">5-bullet fan spread with immense room coverage.</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 bg-[#1a1a1e] border-2 border-[#ffca28] text-[#ffca28] flex items-center justify-center font-black text-xs">M</span>
                <span className="text-[#ffca28] font-bold">MACHINE GUN:</span>
                <span className="text-slate-300">Rapid continuous automatic high-velocity fire.</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 bg-[#1a1a1e] border-2 border-[#00f2ff] text-[#00f2ff] flex items-center justify-center font-black text-xs">L</span>
                <span className="text-[#00f2ff] font-bold">LASER CANNON:</span>
                <span className="text-slate-300">Piercing high-energy beam cutting through foes.</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 bg-[#1a1a1e] border-2 border-[#ff9800] text-[#ff9800] flex items-center justify-center font-black text-xs">F</span>
                <span className="text-[#ff9800] font-bold">FIRE BLASTER:</span>
                <span className="text-slate-300">Rotating explosive ballistic fireballs.</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 bg-[#1a1a1e] border-2 border-[#e040fb] text-[#e040fb] flex items-center justify-center font-black text-xs">B</span>
                <span className="text-[#e040fb] font-bold">FORCE BARRIER:</span>
                <span className="text-slate-300">Temporary invincibility; destroys enemies on touch!</span>
              </div>
            </div>
          </div>

          {/* KONAMI CODE CHEAT */}
          <div className="bg-[#121216] border-2 border-[#ffca28] p-3.5 shadow-[4px_4px_0px_#000] text-xs">
            <span className="text-[#ffca28] font-bold uppercase tracking-widest">LEGENDARY SECRET CODE:</span>
            <p className="text-slate-300 mt-1">
              Press <span className="text-white font-bold bg-[#1a1a1e] px-1.5 py-0.5 border border-[#444]">↑ ↑ ↓ ↓ ← → ← → B A</span> on your keyboard at any time to immediately receive <span className="text-[#ffca28] font-black">30 LIVES</span> and the Spread Gun!
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            id="btn-controls-confirm"
            onClick={onClose}
            className="px-5 py-2 bg-[#00f2ff] hover:bg-cyan-300 text-black font-black text-xs uppercase tracking-widest shadow-[4px_4px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition"
          >
            RETURN TO BATTLE
          </button>
        </div>
      </div>
    </div>
  );
};
