import React, { useRef, useEffect, useState, useCallback } from 'react';
import { RetroGameEngine } from '../game/engine';
import { RetroSpriteRenderer } from '../game/sprites';
import { RetroBackgroundRenderer } from '../game/background';
import { ArcadeHUD } from './ArcadeHUD';
import { TouchControls } from './TouchControls';
import { ArcadeControlsGuide } from './ArcadeControlsGuide';
import { networkManager, RoomInfo } from '../game/network';
import { retroAudio } from '../game/audio';
import { PlayerInput, CharacterType, WeaponType, TauntMessage } from '../types';
import { RotateCcw, Home, Sparkles, Tv, HelpCircle, Trophy } from 'lucide-react';

interface GameCanvasProps {
  mode: 'solo' | 'local2p' | 'online';
  onlineRoom?: RoomInfo;
  localCharacter: CharacterType;
  onReturnToLobby: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  mode,
  onlineRoom,
  localCharacter,
  onReturnToLobby,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const engineRef = useRef<RetroGameEngine | null>(null);
  const inputRef = useRef<PlayerInput>({
    left: false,
    right: false,
    up: false,
    down: false,
    jump: false,
    fire: false,
  });

  const p2InputRef = useRef<PlayerInput>({
    left: false,
    right: false,
    up: false,
    down: false,
    jump: false,
    fire: false,
  });

  const [isMuted, setIsMuted] = useState<boolean>(retroAudio.getIsMuted());
  const [showControlsGuide, setShowControlsGuide] = useState<boolean>(false);
  const [showCrtFilter, setShowCrtFilter] = useState<boolean>(true);
  const [activeTaunt, setActiveTaunt] = useState<TauntMessage | null>(null);
  const [hudState, setHudState] = useState<{
    p1: any;
    p2: any;
    boss: any;
    ping: number;
    gameOver: boolean;
    stageCleared: boolean;
  }>({
    p1: null,
    p2: null,
    boss: null,
    ping: 0,
    gameOver: false,
    stageCleared: false,
  });

  // INITIALIZE ENGINE & NETWORK
  useEffect(() => {
    const isLocal2P = mode === 'local2p';
    const engine = new RetroGameEngine(localCharacter, isLocal2P);
    engine.isCoopOnline = mode === 'online' && (onlineRoom?.mode !== 'versus');
    engine.isVersusMode = mode === 'online' && (onlineRoom?.mode === 'versus');
    engineRef.current = engine;

    // Start background music
    retroAudio.playBgm('stage');

    // SETUP ONLINE MULTIPLAYER SYNC HOOKS
    if (mode === 'online' && onlineRoom) {
      // Create remote Player 2
      const remoteChar: CharacterType = localCharacter === 'bill' ? 'lance' : 'bill';
      const p2 = {
        id: 'p2_remote',
        name: remoteChar === 'bill' ? 'BILL RIZER' : 'LANCE BEAN',
        character: remoteChar,
        x: 120,
        y: 280,
        vx: 0,
        vy: 0,
        width: 24,
        height: 42,
        isGrounded: true,
        facingLeft: false,
        aimAngle: 0,
        aimDirection: { x: 1, y: 0 },
        state: 'idle' as const,
        weapon: 'NORMAL' as const,
        lives: 3,
        score: 0,
        invincibleTimer: 180,
        fireCooldown: 0,
        isDead: false,
        respawnTimer: 0,
        somersaultFrame: 0,
        runFrame: 0,
        isRemote: true,
      };
      engine.player2 = p2;

      // Local player fired -> broadcast
      engine.onPlayerFire = (bullet) => {
        networkManager.sendFireBullet(bullet);
      };

      // Local player damaged enemy -> broadcast
      engine.onEnemyHit = (enemyId, damage, killed) => {
        networkManager.sendEnemyHit(enemyId, damage, killed);
      };

      // Local player hit boss -> broadcast
      engine.onBossHit = (damage) => {
        networkManager.sendBossHit(damage);
      };

      // Local player took powerup -> broadcast
      engine.onPowerupTaken = (powerupId, weapon) => {
        networkManager.sendPowerupTaken(powerupId, weapon);
      };

      // REMOTE NETWORK LISTENERS
      networkManager.onRemotePlayerSync = (data) => {
        if (engine.player2) {
          engine.player2.x = data.x;
          engine.player2.y = data.y;
          engine.player2.vx = data.vx;
          engine.player2.vy = data.vy;
          engine.player2.aimAngle = data.aimAngle;
          engine.player2.state = data.state;
          engine.player2.facingLeft = data.facingLeft;
          engine.player2.weapon = data.weapon;
          engine.player2.lives = data.lives;
          engine.player2.score = data.score;
          engine.player2.invincibleTimer = data.invincibleTime;
        }
      };

      networkManager.onRemotePlayerFire = (bullet) => {
        engine.bullets.push(bullet);
      };

      networkManager.onEnemyHitEvent = (data) => {
        const e = engine.enemies.find((item) => item.id === data.enemyId);
        if (e) {
          e.hp -= data.damage;
          if (data.killed) e.hp = 0;
        }
      };

      networkManager.onBossUpdate = (data) => {
        engine.boss.hp = data.hp;
        if (data.defeated && !engine.boss.defeated) {
          engine.boss.defeated = true;
          engine.stageCleared = true;
          retroAudio.stopBgm();
          retroAudio.victoryFanfare();
        }
      };

      networkManager.onPowerupCollected = (data) => {
        const idx = engine.powerups.findIndex((p) => p.id === data.powerupId);
        if (idx !== -1) {
          engine.powerups.splice(idx, 1);
        }
      };

      networkManager.onTauntReceived = (taunt) => {
        setActiveTaunt(taunt);
        retroAudio.powerup();
        setTimeout(() => setActiveTaunt(null), 3500);
      };
    }

    return () => {
      retroAudio.stopBgm();
      if (mode === 'online') {
        networkManager.disconnect();
      }
    };
  }, [mode, onlineRoom, localCharacter]);

  // KEYBOARD EVENT LISTENERS
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const engine = engineRef.current;
      if (!engine) return;

      // Konami code check
      engine.handleKeyForKonami(e.key);

      // P1 Controls (WASD / Arrows, J/K or Z/X)
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') inputRef.current.up = true;
      if (k === 's' || k === 'arrowdown') inputRef.current.down = true;
      if (k === 'a' || k === 'arrowleft') inputRef.current.left = true;
      if (k === 'd' || k === 'arrowright') inputRef.current.right = true;
      if (k === 'j' || k === 'z' || k === ' ') inputRef.current.jump = true;
      if (k === 'k' || k === 'x') inputRef.current.fire = true;

      // Local 2P Controls (NumPad or N/M if sharing keyboard)
      if (mode === 'local2p') {
        if (e.key === 'ArrowUp') p2InputRef.current.up = true;
        if (e.key === 'ArrowDown') p2InputRef.current.down = true;
        if (e.key === 'ArrowLeft') p2InputRef.current.left = true;
        if (e.key === 'ArrowRight') p2InputRef.current.right = true;
        if (k === 'n' || e.key === '1') p2InputRef.current.jump = true;
        if (k === 'm' || e.key === '2') p2InputRef.current.fire = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') inputRef.current.up = false;
      if (k === 's' || k === 'arrowdown') inputRef.current.down = false;
      if (k === 'a' || k === 'arrowleft') inputRef.current.left = false;
      if (k === 'd' || k === 'arrowright') inputRef.current.right = false;
      if (k === 'j' || k === 'z' || k === ' ') inputRef.current.jump = false;
      if (k === 'k' || k === 'x') inputRef.current.fire = false;

      if (mode === 'local2p') {
        if (e.key === 'ArrowUp') p2InputRef.current.up = false;
        if (e.key === 'ArrowDown') p2InputRef.current.down = false;
        if (e.key === 'ArrowLeft') p2InputRef.current.left = false;
        if (e.key === 'ArrowRight') p2InputRef.current.right = false;
        if (k === 'n' || e.key === '1') p2InputRef.current.jump = false;
        if (k === 'm' || e.key === '2') p2InputRef.current.fire = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [mode]);

  // MAIN GAME LOOP & RENDER
  useEffect(() => {
    let animFrame: number;
    let netSyncCounter = 0;

    const loop = () => {
      const engine = engineRef.current;
      const canvas = canvasRef.current;

      if (engine && canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = false;

          // GAMEPAD POLLING
          const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
          const gp1 = gamepads[0];
          if (gp1) {
            inputRef.current.left = gp1.axes[0] < -0.3 || (gp1.buttons[14]?.pressed ?? false);
            inputRef.current.right = gp1.axes[0] > 0.3 || (gp1.buttons[15]?.pressed ?? false);
            inputRef.current.up = gp1.axes[1] < -0.3 || (gp1.buttons[12]?.pressed ?? false);
            inputRef.current.down = gp1.axes[1] > 0.3 || (gp1.buttons[13]?.pressed ?? false);
            inputRef.current.jump = gp1.buttons[0]?.pressed || false; // Button A
            inputRef.current.fire = gp1.buttons[2]?.pressed || gp1.buttons[7]?.pressed || false; // Button X or RT
          }

          // UPDATE ENGINE PHYSICS
          engine.handleInput(engine.player1, inputRef.current);
          if (engine.player2 && !engine.player2.isRemote) {
            engine.handleInput(engine.player2, p2InputRef.current, true);
          }

          engine.update();

          // NETWORK PLAYER SYNC EMISSION (20-30Hz)
          if (mode === 'online') {
            netSyncCounter++;
            if (netSyncCounter % 3 === 0) {
              const p = engine.player1;
              networkManager.syncPlayerState({
                x: p.x,
                y: p.y,
                vx: p.vx,
                vy: p.vy,
                aimAngle: p.aimAngle,
                state: p.state,
                facingLeft: p.facingLeft,
                lives: p.lives,
                score: p.score,
                weapon: p.weapon,
                invincibleTime: p.invincibleTimer,
                isFiring: inputRef.current.fire,
              });
            }
          }

          // RENDER FRAME
          ctx.clearRect(0, 0, 800, 450);

          // 1. Background Parallax
          RetroBackgroundRenderer.draw(ctx, engine.cameraX, 800, 450);

          // 2. Platforms & Terrain
          RetroBackgroundRenderer.drawPlatforms(ctx, engine.platforms, engine.cameraX);

          // 3. Powerups
          ctx.save();
          ctx.translate(-engine.cameraX, 0);
          engine.powerups.forEach((pow) => RetroSpriteRenderer.drawPowerup(ctx, pow));

          // 4. Boss
          RetroSpriteRenderer.drawBoss(ctx, engine.boss);

          // 5. Enemies
          engine.enemies.forEach((enemy) => RetroSpriteRenderer.drawEnemy(ctx, enemy));

          // 6. Players
          RetroSpriteRenderer.drawPlayer(ctx, engine.player1);
          if (engine.player2) {
            RetroSpriteRenderer.drawPlayer(ctx, engine.player2);
          }

          // 7. Bullets
          engine.bullets.forEach((bullet) => RetroSpriteRenderer.drawBullet(ctx, bullet));

          // 8. Explosions & Particles
          engine.particles.forEach((particle) => RetroSpriteRenderer.drawParticle(ctx, particle));

          ctx.restore();

          // Sync local state to HUD React state (throttled)
          if (netSyncCounter % 5 === 0) {
            setHudState({
              p1: { ...engine.player1 },
              p2: engine.player2 ? { ...engine.player2 } : null,
              boss: { ...engine.boss },
              ping: networkManager.ping,
              gameOver: engine.gameOver,
              stageCleared: engine.stageCleared,
            });
          }
        }
      }

      animFrame = requestAnimationFrame(loop);
    };

    animFrame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrame);
  }, [mode]);

  const handleRestart = () => {
    if (engineRef.current) {
      engineRef.current.restartGame(localCharacter);
    }
  };

  const handleToggleMute = () => {
    const muted = retroAudio.toggleMute();
    setIsMuted(muted);
  };

  const handleSendTaunt = (text: string) => {
    networkManager.sendTaunt(text);
    setActiveTaunt({
      id: `local_t_${Date.now()}`,
      playerId: networkManager.localPlayerId,
      playerName: 'YOU',
      text,
      time: Date.now(),
    });
    setTimeout(() => setActiveTaunt(null), 3500);
  };

  return (
    <div id="game-screen-wrapper" className="relative w-full min-h-screen bg-[#050507] flex flex-col justify-between select-none overflow-hidden font-mono text-[#e0e0e0]">
      {/* BACKGROUND GEOMETRIC GRID */}
      <div className="absolute inset-0 opacity-10 pointer-events-none geo-grid" />

      {/* ARCADE HUD AT TOP */}
      {hudState.p1 && (
        <ArcadeHUD
          player1={hudState.p1}
          player2={hudState.p2}
          boss={hudState.boss}
          ping={hudState.ping}
          isOnline={mode === 'online'}
          roomId={onlineRoom?.id}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onOpenControls={() => setShowControlsGuide(true)}
          onSendTaunt={mode === 'online' ? handleSendTaunt : undefined}
        />
      )}

      {/* CANVAS CONTAINER */}
      <main
        ref={containerRef}
        id="arcade-canvas-viewport"
        className="relative flex-1 w-full max-w-5xl flex items-center justify-center p-2 sm:p-4 my-auto mx-auto z-10"
      >
        {/* RETRO ARCADE BEZEL CASING WITH GEOMETRIC BORDERS */}
        <div className="relative w-full aspect-[16/9] max-h-[70vh] bg-black border-4 border-[#333] shadow-[4px_4px_0px_#000] overflow-hidden flex items-center justify-center">
          {/* THE CANVAS (Pixel Perfect 800x450 Resolution) */}
          <canvas
            ref={canvasRef}
            id="retro-game-canvas"
            width={800}
            height={450}
            className="w-full h-full object-contain pixelated"
          />

          {/* OPTIONAL CRT SCANLINES OVERLAY */}
          {showCrtFilter && (
            <div id="crt-scanline-layer" className="absolute inset-0 crt-scanlines pointer-events-none opacity-30" />
          )}

          {/* CRT CURVATURE & VIGNETTE */}
          {showCrtFilter && (
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_60px_rgba(0,0,0,0.8)]" />
          )}

          {/* FLOATING RETRO TAUNT SPEECH BUBBLE */}
          {activeTaunt && (
            <div id="floating-arcade-taunt" className="absolute top-8 left-1/2 -translate-x-1/2 z-30 bg-[#ff2d55] text-white border-2 border-white px-4 py-2 font-mono font-bold text-xs sm:text-sm tracking-wider shadow-[4px_4px_0px_#000] animate-bounce">
              <span className="text-[#ffca28] block text-[9px] uppercase tracking-widest">{activeTaunt.playerName}:</span>
              "{activeTaunt.text}"
            </div>
          )}

          {/* GAME OVER MODAL OVERLAY */}
          {hudState.gameOver && (
            <div id="overlay-game-over" className="absolute inset-0 z-40 bg-black/90 flex flex-col items-center justify-center p-6 text-center border-4 border-[#ff2d55]">
              <div className="text-3xl sm:text-5xl font-black italic tracking-tighter text-white bg-[#ff2d55] px-6 py-1 skew-x-[-12deg] shadow-[4px_4px_0px_#000] mb-3">
                MISSION FAILED
              </div>
              <p className="text-slate-400 font-mono text-xs sm:text-sm max-w-md mb-6 uppercase tracking-wider">
                Defensive sector overwhelmed. Deploy backup operative to continue operation.
              </p>
              <div className="flex gap-4">
                <button
                  id="btn-game-over-retry"
                  onClick={handleRestart}
                  className="px-6 py-2.5 bg-[#ff2d55] hover:bg-red-600 text-white font-bold text-xs uppercase tracking-widest shadow-[4px_4px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none flex items-center gap-2 transition"
                >
                  <RotateCcw className="w-4 h-4" /> RETRY MISSION
                </button>
                <button
                  id="btn-game-over-lobby"
                  onClick={onReturnToLobby}
                  className="px-6 py-2.5 bg-[#1a1a1e] hover:bg-[#25252b] text-[#e0e0e0] font-bold text-xs uppercase tracking-widest border-2 border-[#333] shadow-[4px_4px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition flex items-center gap-2"
                >
                  <Home className="w-4 h-4" /> ARCADE LOBBY
                </button>
              </div>
            </div>
          )}

          {/* STAGE CLEAR VICTORY MODAL OVERLAY */}
          {hudState.stageCleared && (
            <div id="overlay-stage-clear" className="absolute inset-0 z-40 bg-black/90 flex flex-col items-center justify-center p-6 text-center border-4 border-[#00f2ff]">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1a1a1e] text-[#00f2ff] border border-[#00f2ff] text-[10px] font-mono font-bold mb-3 uppercase tracking-widest">
                <Trophy className="w-3.5 h-3.5" /> SECTOR SECURED
              </div>
              <div className="text-3xl sm:text-5xl font-black italic tracking-tighter text-black bg-[#ffca28] px-6 py-1 skew-x-[-12deg] shadow-[4px_4px_0px_#000] mb-3">
                STAGE 01 CLEAR!
              </div>
              <p className="text-slate-300 font-mono text-xs sm:text-sm max-w-md mb-6 uppercase tracking-wider">
                Alien fortress neutralized. Commando efficiency rating: 100%.
              </p>
              <div className="flex gap-4">
                <button
                  id="btn-victory-replay"
                  onClick={handleRestart}
                  className="px-6 py-2.5 bg-[#00f2ff] hover:bg-cyan-300 text-black font-black text-xs uppercase tracking-widest shadow-[4px_4px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none flex items-center gap-2 transition"
                >
                  <RotateCcw className="w-4 h-4" /> REPLAY STAGE
                </button>
                <button
                  id="btn-victory-lobby"
                  onClick={onReturnToLobby}
                  className="px-6 py-2.5 bg-[#1a1a1e] hover:bg-[#25252b] text-[#e0e0e0] font-bold text-xs uppercase tracking-widest border-2 border-[#333] shadow-[4px_4px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition flex items-center gap-2"
                >
                  <Home className="w-4 h-4" /> RETURN TO LOBBY
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* GEOMETRIC BALANCE 3-PANEL STATUS FOOTER */}
      <footer id="game-status-footer" className="w-full bg-[#121216] border-t-4 border-[#333] z-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-0">
          {/* Panel 1: Weapon System */}
          <div className="border-b md:border-b-0 md:border-r-2 border-[#333] p-4 flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-[#888] uppercase block mb-1.5 font-bold tracking-wider">Weapon System</span>
              <div className="flex gap-3 items-center">
                <div className="w-12 h-12 bg-[#1a1a1e] border-2 border-[#00f2ff] flex items-center justify-center text-2xl font-black text-[#00f2ff] shadow-[2px_2px_0px_#000]">
                  {hudState.p1?.weapon === 'SPREAD' ? 'S' : hudState.p1?.weapon === 'MACHINE_GUN' ? 'M' : hudState.p1?.weapon === 'LASER' ? 'L' : hudState.p1?.weapon === 'FIRE' ? 'F' : hudState.p1?.weapon === 'BARRIER' ? 'B' : 'R'}
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-bold text-sm tracking-wider">
                    {hudState.p1?.weapon === 'SPREAD' ? 'SPREAD SHOT' : hudState.p1?.weapon === 'MACHINE_GUN' ? 'MACHINE GUN' : hudState.p1?.weapon === 'LASER' ? 'LASER BEAM' : hudState.p1?.weapon === 'FIRE' ? 'FIRE BLASTER' : hudState.p1?.weapon === 'BARRIER' ? 'FORCE BARRIER' : 'STANDARD RIFLE'}
                  </span>
                  <span className="text-[#00f2ff] text-[10px] font-bold">CALIBER: MK-II AUTO</span>
                </div>
              </div>
            </div>
            <div className="h-1 bg-[#333] w-full mt-2">
              <div className="h-full bg-[#00f2ff] w-3/4 animate-pulse"></div>
            </div>
          </div>

          {/* Panel 2: Multiplayer Status */}
          <div className="border-b md:border-b-0 md:border-r-2 border-[#333] p-4 flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-[#888] uppercase block mb-1.5 font-bold tracking-wider">Tactical Network</span>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center bg-[#1a1a1e] px-2.5 py-1 border-l-4 border-[#00f2ff]">
                  <span className="text-xs text-white font-bold">{onlineRoom?.id ? `NODE: ${onlineRoom.id}` : mode === 'local2p' ? 'LOCAL CO-OP' : 'SOLO COMBAT'}</span>
                  <span className="text-[9px] bg-[#00f2ff] text-black px-1.5 py-0.5 font-black uppercase">
                    {mode === 'online' ? 'CONNECTED' : 'LOCAL'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-[#888] px-1">
                  <span>PING: {hudState.ping || 16}MS</span>
                  <span className="text-[#00f2ff]">STATUS: NOMINAL</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2 text-[10px] text-[#666]">
              <span className="text-[#00f2ff] font-bold">OPERATIVES:</span>
              <span className="text-white">BILL</span>
              {hudState.p2 && <span className="text-white">+ LANCE</span>}
            </div>
          </div>

          {/* Panel 3: System Comms & Toolbar Controls */}
          <div className="p-4 flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-[#888] uppercase block mb-1.5 font-bold tracking-wider">Mission Comms</span>
              <div className="text-[11px] space-y-1">
                <p><span className="text-[#ff2d55] font-bold">[HQ_RADIO]:</span> Secure the Alien Defense Core!</p>
                {activeTaunt ? (
                  <p><span className="text-[#00f2ff] font-bold">[{activeTaunt.playerName}]:</span> {activeTaunt.text}</p>
                ) : (
                  <p className="text-[#888] text-[10px] italic">Tactical comms frequency open...</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-[#26262b]">
              <div className="flex items-center gap-2">
                <button
                  id="btn-toggle-crt"
                  onClick={() => setShowCrtFilter(!showCrtFilter)}
                  className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 border transition ${
                    showCrtFilter ? 'bg-[#1a1a1e] border-[#00f2ff] text-[#00f2ff]' : 'bg-[#1a1a1e] border-[#333] text-[#666]'
                  } shadow-[2px_2px_0px_#000]`}
                >
                  CRT: {showCrtFilter ? 'ON' : 'OFF'}
                </button>
                <button
                  id="btn-open-help"
                  onClick={() => setShowControlsGuide(true)}
                  className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 bg-[#1a1a1e] hover:bg-[#25252b] border border-[#333] hover:border-[#00f2ff] text-[#00f2ff] shadow-[2px_2px_0px_#000]"
                >
                  CONTROLS
                </button>
              </div>
              <button
                id="btn-exit-to-lobby"
                onClick={onReturnToLobby}
                className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 bg-[#1a1a1e] hover:bg-red-950/40 border border-[#333] hover:border-[#ff2d55] text-[#ff2d55] shadow-[2px_2px_0px_#000]"
              >
                EXIT
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* MOBILE / TABLET TOUCH CONTROLS */}
      <TouchControls
        onInputUpdate={(updater) => {
          inputRef.current = updater(inputRef.current);
        }}
      />

      {/* CONTROLS GUIDE MODAL */}
      {showControlsGuide && (
        <ArcadeControlsGuide onClose={() => setShowControlsGuide(false)} />
      )}
    </div>
  );
};
