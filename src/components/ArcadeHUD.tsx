import React from 'react';
import { Player, BossState, WeaponType } from '../types';
import { Wifi, Volume2, VolumeX, Shield, Swords, Users } from 'lucide-react';

interface ArcadeHUDProps {
  player1: Player;
  player2: Player | null;
  boss: BossState;
  ping: number;
  isOnline: boolean;
  roomId?: string;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenControls: () => void;
  onSendTaunt?: (text: string) => void;
}

export const ArcadeHUD: React.FC<ArcadeHUDProps> = ({
  player1,
  player2,
  boss,
  ping,
  isOnline,
  roomId,
  isMuted,
  onToggleMute,
  onOpenControls,
  onSendTaunt,
}) => {
  const renderWeaponBadge = (weapon: WeaponType) => {
    let border = 'border-[#00f2ff] text-[#00f2ff]';
    let letter = 'R';

    switch (weapon) {
      case 'SPREAD':
        border = 'border-[#ff2d55] text-[#ff2d55] animate-pulse';
        letter = 'S';
        break;
      case 'MACHINE_GUN':
        border = 'border-[#ffca28] text-[#ffca28]';
        letter = 'M';
        break;
      case 'LASER':
        border = 'border-[#00f2ff] text-[#00f2ff]';
        letter = 'L';
        break;
      case 'FIRE':
        border = 'border-[#ff9800] text-[#ff9800]';
        letter = 'F';
        break;
      case 'BARRIER':
        border = 'border-[#e040fb] text-[#e040fb] animate-bounce';
        letter = 'B';
        break;
      default:
        border = 'border-[#666] text-[#888]';
        letter = 'R';
    }

    return (
      <span
        id={`hud-weapon-${weapon}`}
        className={`inline-flex items-center justify-center w-8 h-8 bg-[#1a1a1e] border-2 ${border} font-black text-sm shadow-[2px_2px_0px_#000]`}
        title={`Weapon: ${weapon}`}
      >
        {letter}
      </span>
    );
  };

  const quickTaunts = ['COVER ME!', 'SPREAD GUN!', 'WATCH OUT!', 'ATTACK BOSS!'];

  return (
    <header id="arcade-hud-container" className="w-full border-b-4 border-[#333] bg-[#121216] px-4 sm:px-8 py-2.5 select-none font-mono text-[#e0e0e0]">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* PLAYER 1 HUD */}
        <div id="hud-player-1" className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] text-[#00f2ff] uppercase tracking-widest font-bold">Player 01</span>
            <span className="text-base sm:text-lg font-bold text-white flex items-center gap-1.5">
              SGT_BILL <span className="text-[#ff2d55]">[{Math.max(0, player1.lives)}]</span>
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-[#00f2ff] uppercase tracking-widest font-bold">Score</span>
            <span className="text-base sm:text-lg font-bold text-[#ffca28] tracking-widest leading-none">
              {String(player1.score).padStart(7, '0')}
            </span>
          </div>

          {/* Weapon */}
          {renderWeaponBadge(player1.weapon)}
        </div>

        {/* CENTER BANNER OR BOSS METER */}
        {boss.active ? (
          <div id="hud-boss-meter" className="flex-1 min-w-[200px] max-w-xs sm:max-w-md bg-[#1a1a1e] border-2 border-[#333] px-3 py-1.5 shadow-[4px_4px_0px_#000] flex flex-col items-center">
            <div className="flex justify-between w-full text-[10px] text-[#ff2d55] font-bold tracking-wider mb-1">
              <span className="flex items-center gap-1">
                <Swords className="w-3 h-3 text-[#ff2d55] animate-spin" /> ALIEN DEFENSE CORE
              </span>
              <span className="text-[#ffca28]">{Math.max(0, boss.hp)} / {boss.maxHp}</span>
            </div>
            <div className="w-full bg-[#222] h-2.5 border border-[#444] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#ff2d55] to-[#ffca28] transition-all duration-100"
                style={{ width: `${Math.max(0, (boss.hp / boss.maxHp) * 100)}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="hidden sm:flex flex-col items-center">
            <div className="text-xl sm:text-2xl font-black italic tracking-tighter text-white bg-[#ff2d55] px-4 py-0.5 skew-x-[-12deg] shadow-[3px_3px_0px_#000]">
              NEO-CONTRA
            </div>
            <span className="text-[9px] text-[#00f2ff] uppercase tracking-[0.3em] font-bold mt-0.5">
              STAGE 01: IRON INFILTRATION
            </span>
          </div>
        )}

        {/* PLAYER 2 HUD & CONTROLS */}
        <div className="flex items-center gap-4">
          {player2 ? (
            <div id="hud-player-2" className="flex items-center gap-4">
              <div className="flex flex-col text-right">
                <span className="text-[10px] text-[#00f2ff] uppercase tracking-widest font-bold">Player 02</span>
                <span className="text-base sm:text-lg font-bold text-white flex items-center justify-end gap-1.5">
                  LT_LANCE <span className="text-[#ff2d55]">[{Math.max(0, player2.lives)}]</span>
                </span>
              </div>

              <div className="flex flex-col text-right">
                <span className="text-[10px] text-[#00f2ff] uppercase tracking-widest font-bold">Score</span>
                <span className="text-base sm:text-lg font-bold text-[#ffca28] tracking-widest leading-none">
                  {String(player2.score).padStart(7, '0')}
                </span>
              </div>

              {renderWeaponBadge(player2.weapon)}
            </div>
          ) : (
            <div id="hud-player-2-empty" className="hidden lg:flex items-center gap-2 bg-[#1a1a1e] border-2 border-dashed border-[#333] px-3 py-1.5 text-[#666]">
              <Users className="w-3.5 h-3.5" />
              <span className="text-[10px] tracking-widest font-bold uppercase">2P STANDBY</span>
            </div>
          )}

          {/* Controls, Quick Taunts & Ping */}
          <div className="flex items-center gap-2">
            {isOnline && onSendTaunt && (
              <div className="hidden xl:flex items-center gap-1">
                {quickTaunts.map((txt) => (
                  <button
                    key={txt}
                    id={`btn-taunt-${txt.replace(/\s+/g, '-').toLowerCase()}`}
                    onClick={() => onSendTaunt(txt)}
                    className="bg-[#1a1a1e] hover:bg-[#25252b] border border-[#333] hover:border-[#00f2ff] text-[9px] text-[#00f2ff] font-bold px-2 py-1 shadow-[2px_2px_0px_#000] uppercase tracking-wider transition active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                  >
                    {txt}
                  </button>
                ))}
              </div>
            )}

            {isOnline && (
              <div id="hud-ping-indicator" className="flex items-center gap-1 bg-[#1a1a1e] border-2 border-[#333] px-2 py-1 text-[10px] shadow-[2px_2px_0px_#000]">
                <Wifi className="w-3 h-3 text-[#00f2ff]" />
                <span className="text-[#00f2ff] font-bold">{ping}MS</span>
                {roomId && <span className="text-[#888] font-bold ml-0.5">[{roomId}]</span>}
              </div>
            )}

            {/* Audio toggle */}
            <button
              id="btn-hud-audio-toggle"
              onClick={onToggleMute}
              className="p-1.5 bg-[#1a1a1e] hover:bg-[#25252b] border-2 border-[#333] hover:border-[#00f2ff] text-[#e0e0e0] shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-[#ff2d55]" /> : <Volume2 className="w-3.5 h-3.5 text-[#00f2ff]" />}
            </button>

            {/* Controls help modal */}
            <button
              id="btn-hud-controls-modal"
              onClick={onOpenControls}
              className="px-2.5 py-1 bg-[#1a1a1e] hover:bg-[#25252b] border-2 border-[#333] hover:border-[#00f2ff] text-[#00f2ff] font-bold text-[10px] uppercase tracking-wider shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              HELP
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
