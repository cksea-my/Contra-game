import React, { useState, useEffect } from 'react';
import { CharacterType, RoomSummary } from '../types';
import { networkManager, RoomInfo } from '../game/network';
import { retroAudio } from '../game/audio';
import { Users, Swords, Play, Shield, Wifi, RefreshCw, Sparkles, Trophy } from 'lucide-react';

interface ArcadeLobbyProps {
  onStartSolo: (character: CharacterType) => void;
  onStartLocal2P: () => void;
  onStartOnlineGame: (room: RoomInfo, localChar: CharacterType, isVersus: boolean) => void;
}

export const ArcadeLobby: React.FC<ArcadeLobbyProps> = ({
  onStartSolo,
  onStartLocal2P,
  onStartOnlineGame,
}) => {
  const [character, setCharacter] = useState<CharacterType>('bill');
  const [playerName, setPlayerName] = useState<string>('COMMANDO');
  const [joinRoomCode, setJoinRoomCode] = useState<string>('');
  const [publicRooms, setPublicRooms] = useState<RoomSummary[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState<boolean>(false);
  const [isWaitingInRoom, setIsWaitingInRoom] = useState<boolean>(false);
  const [hostedRoom, setHostedRoom] = useState<RoomInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'modes' | 'online' | 'join'>('modes');

  useEffect(() => {
    fetchPublicRooms();
    const interval = setInterval(fetchPublicRooms, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchPublicRooms = async () => {
    setIsLoadingRooms(true);
    try {
      const res = await fetch('/api/rooms');
      if (res.ok) {
        const data = await res.json();
        setPublicRooms(data);
      }
    } catch (e) {
      console.error('Error fetching public rooms:', e);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  const handleHostOnlineGame = async (mode: 'coop' | 'versus') => {
    setErrorMessage(null);
    retroAudio.init();
    retroAudio.powerup();

    const connected = await networkManager.connect();
    if (!connected) {
      setErrorMessage('Could not connect to online multiplayer server. Ensure network is active.');
      return;
    }

    networkManager.onRoomCreated = (room) => {
      setHostedRoom(room);
      setIsWaitingInRoom(true);
    };

    networkManager.onPlayerJoined = () => {
      if (networkManager.currentRoom) {
        setHostedRoom({ ...networkManager.currentRoom });
      }
    };

    networkManager.onError = (msg) => {
      setErrorMessage(msg);
    };

    networkManager.createRoom(`ROOM_${Math.floor(Math.random() * 900 + 100)}`, character, mode, playerName);
  };

  const handleJoinOnlineGame = async (targetRoomId: string) => {
    if (!targetRoomId.trim()) return;
    setErrorMessage(null);
    retroAudio.init();
    retroAudio.powerup();

    const connected = await networkManager.connect();
    if (!connected) {
      setErrorMessage('Could not connect to multiplayer server.');
      return;
    }

    networkManager.onRoomJoined = (room) => {
      // Game start or wait
      const isVersus = room.mode === 'versus';
      const assignedChar = room.players.find((p) => p.id === networkManager.localPlayerId)?.character || 'lance';
      onStartOnlineGame(room, assignedChar, isVersus);
    };

    networkManager.onError = (msg) => {
      setErrorMessage(msg);
    };

    networkManager.joinRoom(targetRoomId.trim().toUpperCase(), playerName);
  };

  const handleStartHostedMatch = () => {
    if (!hostedRoom) return;
    networkManager.startGame();
    const isVersus = hostedRoom.mode === 'versus';
    onStartOnlineGame(hostedRoom, character, isVersus);
  };

  return (
    <div id="arcade-lobby-screen" className="relative min-h-screen bg-[#0a0a0c] text-[#e0e0e0] flex flex-col items-center justify-between p-4 font-mono select-none overflow-x-hidden">
      {/* GEOMETRIC GRID & RETRO SCANLINES */}
      <div className="absolute inset-0 opacity-10 pointer-events-none geo-grid z-0" />
      <div className="absolute inset-0 crt-scanlines pointer-events-none opacity-30 z-10" />

      {/* HEADER LOGO & ARCADE BANNER */}
      <header className="relative z-20 text-center pt-6 pb-4 w-full max-w-4xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1a1a1e] border border-[#ff2d55] text-[#ff2d55] text-[10px] font-bold mb-3 uppercase tracking-widest shadow-[2px_2px_0px_#000]">
          <Sparkles className="w-3.5 h-3.5 text-[#ff2d55]" /> 8-BIT RUN & GUN ARCADE ACTION
        </div>

        <div>
          <div className="inline-block text-3xl sm:text-5xl font-black italic tracking-tighter text-white bg-[#ff2d55] px-6 py-1.5 skew-x-[-12deg] shadow-[4px_4px_0px_#000] mb-2">
            NEO-CONTRA
          </div>
        </div>
        <p className="text-xs text-[#00f2ff] mt-1 tracking-[0.3em] uppercase font-bold">
          ONLINE MULTIPLAYER CO-OP • WEAPON ARSENAL • BOSS BATTLES
        </p>
      </header>

      {/* ERROR MESSAGE DISPLAY */}
      {errorMessage && (
        <div id="lobby-error-banner" className="relative z-20 w-full max-w-md bg-[#1a1a1e] border-2 border-[#ff2d55] p-3 text-[#ff2d55] text-xs text-center mb-4 shadow-[4px_4px_0px_#000]">
          {errorMessage}
        </div>
      )}

      {/* LOBBY CONTENT CONTAINER WITH GEOMETRIC CASING */}
      <main className="relative z-20 w-full max-w-4xl bg-[#121216] border-4 border-[#333] shadow-[8px_8px_0px_#000] p-4 sm:p-6">
        {/* CHARACTER & NICKNAME SELECTION */}
        <section className="border-b-2 border-[#333] pb-5 mb-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Nickname */}
            <div className="w-full sm:w-auto flex items-center gap-3">
              <label htmlFor="input-player-name" className="text-xs text-[#888] font-bold tracking-wider">SOLDIER NAME:</label>
              <input
                id="input-player-name"
                type="text"
                maxLength={12}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
                className="bg-[#050507] border-2 border-[#333] px-3 py-1.5 text-[#ffca28] font-bold tracking-widest text-sm focus:outline-hidden focus:border-[#00f2ff] shadow-[2px_2px_0px_#000]"
              />
            </div>

            {/* Character Selector */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#888] font-bold tracking-wider">OPERATIVE:</span>
              <div className="flex gap-2">
                <button
                  id="btn-select-bill"
                  onClick={() => {
                    setCharacter('bill');
                    retroAudio.shootNormal();
                  }}
                  className={`px-3 py-1.5 border-2 text-xs font-bold transition flex items-center gap-2 shadow-[2px_2px_0px_#000] ${
                    character === 'bill'
                      ? 'bg-[#1a1a1e] border-[#00f2ff] text-[#00f2ff]'
                      : 'bg-[#0a0a0c] border-[#333] text-[#888] hover:text-white'
                  }`}
                >
                  <div className="w-2.5 h-2.5 bg-[#00f2ff]" />
                  BILL RIZER (BLUE)
                </button>

                <button
                  id="btn-select-lance"
                  onClick={() => {
                    setCharacter('lance');
                    retroAudio.shootMachine();
                  }}
                  className={`px-3 py-1.5 border-2 text-xs font-bold transition flex items-center gap-2 shadow-[2px_2px_0px_#000] ${
                    character === 'lance'
                      ? 'bg-[#1a1a1e] border-[#ff2d55] text-[#ff2d55]'
                      : 'bg-[#0a0a0c] border-[#333] text-[#888] hover:text-white'
                  }`}
                >
                  <div className="w-2.5 h-2.5 bg-[#ff2d55]" />
                  LANCE BEAN (RED)
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* HOSTED ROOM WAITING STATE */}
        {isWaitingInRoom && hostedRoom ? (
          <div id="lobby-waiting-room" className="space-y-6 text-center py-6">
            <div className="bg-[#0a0a0c] p-6 border-2 border-[#333] max-w-lg mx-auto shadow-[4px_4px_0px_#000]">
              <div className="flex items-center justify-center gap-2 text-[#00f2ff] text-sm font-bold mb-2 uppercase tracking-wider">
                <Wifi className="w-4 h-4 animate-pulse text-[#00f2ff]" /> ROOM ACTIVE & READY
              </div>
              <p className="text-slate-400 text-xs mb-3 uppercase tracking-wider">Share this Room Code with your Co-op Partner:</p>

              <div className="bg-[#121216] border-2 border-dashed border-[#ffca28] p-4 inline-block mb-4 shadow-[4px_4px_0px_#000]">
                <span className="text-3xl font-black tracking-widest text-[#ffca28] select-all">
                  {hostedRoom.id}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-2 text-left">
                <div className="bg-[#121216] p-3 border-2 border-[#00f2ff]">
                  <span className="text-[10px] text-[#00f2ff] font-bold block uppercase tracking-widest">1P (HOST)</span>
                  <span className="font-bold text-sm text-white">{hostedRoom.players[0]?.name || playerName}</span>
                </div>
                <div className="bg-[#121216] p-3 border-2 border-[#ff2d55]">
                  <span className="text-[10px] text-[#ff2d55] font-bold block uppercase tracking-widest">2P (JOINED)</span>
                  <span className="font-bold text-sm text-white">
                    {hostedRoom.players[1]?.name || (
                      <span className="text-slate-500 italic animate-pulse">Waiting for 2P...</span>
                    )}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  id="btn-lobby-start-match"
                  onClick={handleStartHostedMatch}
                  className="px-6 py-2.5 bg-[#00f2ff] hover:bg-cyan-300 text-black font-black text-xs uppercase tracking-widest shadow-[4px_4px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none flex items-center justify-center gap-2 transition"
                >
                  <Play className="w-4 h-4" /> LAUNCH MISSION NOW
                </button>
                <button
                  id="btn-lobby-cancel-room"
                  onClick={() => {
                    networkManager.disconnect();
                    setIsWaitingInRoom(false);
                    setHostedRoom(null);
                  }}
                  className="px-4 py-2 bg-[#1a1a1e] hover:bg-[#25252b] text-slate-300 text-xs font-bold uppercase tracking-wider border-2 border-[#333] shadow-[2px_2px_0px_#000] transition"
                >
                  CANCEL ROOM
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* PRIMARY MODE NAVIGATION TABS */
          <div>
            <div className="flex border-b-4 border-[#333] mb-6">
              <button
                id="tab-btn-modes"
                onClick={() => setActiveTab('modes')}
                className={`flex-1 py-3 text-xs sm:text-sm font-bold transition uppercase tracking-wider ${
                  activeTab === 'modes'
                    ? 'border-b-4 border-[#ffca28] text-[#ffca28] bg-[#1a1a1e]'
                    : 'border-transparent text-[#888] hover:text-white'
                }`}
              >
                GAME MODES
              </button>
              <button
                id="tab-btn-online"
                onClick={() => setActiveTab('online')}
                className={`flex-1 py-3 text-xs sm:text-sm font-bold transition uppercase tracking-wider ${
                  activeTab === 'online'
                    ? 'border-b-4 border-[#00f2ff] text-[#00f2ff] bg-[#1a1a1e]'
                    : 'border-transparent text-[#888] hover:text-white'
                }`}
              >
                HOST & JOIN MATCH
              </button>
              <button
                id="tab-btn-join"
                onClick={() => setActiveTab('join')}
                className={`flex-1 py-3 text-xs sm:text-sm font-bold transition uppercase tracking-wider ${
                  activeTab === 'join'
                    ? 'border-b-4 border-[#ff2d55] text-[#ff2d55] bg-[#1a1a1e]'
                    : 'border-transparent text-[#888] hover:text-white'
                }`}
              >
                BROWSE ROOMS ({publicRooms.length})
              </button>
            </div>

            {/* TAB 1: MODES */}
            {activeTab === 'modes' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1P SOLO */}
                <div className="bg-[#0a0a0c] p-5 border-2 border-[#333] hover:border-[#ffca28] transition shadow-[4px_4px_0px_#000] flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 bg-[#1a1a1e] border-2 border-[#ffca28] text-[#ffca28] flex items-center justify-center mb-3 shadow-[2px_2px_0px_#000]">
                      <Play className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-base text-white mb-1 tracking-wider">1P SOLO ARCADE</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Fight through the jungle, waterfalls, and alien fortress solo with classic Contra mechanics.
                    </p>
                  </div>
                  <button
                    id="btn-start-solo"
                    onClick={() => {
                      retroAudio.init();
                      retroAudio.shootSpread();
                      onStartSolo(character);
                    }}
                    className="mt-5 w-full py-2.5 bg-[#ffca28] hover:bg-amber-400 text-black font-black text-xs uppercase tracking-widest shadow-[4px_4px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition"
                  >
                    START SOLO MISSION
                  </button>
                </div>

                {/* 2P ONLINE CO-OP */}
                <div className="bg-[#0a0a0c] p-5 border-2 border-[#333] hover:border-[#00f2ff] transition shadow-[4px_4px_0px_#000] flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 bg-[#1a1a1e] border-2 border-[#00f2ff] text-[#00f2ff] flex items-center justify-center mb-3 shadow-[2px_2px_0px_#000]">
                      <Users className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-base text-white mb-1 tracking-wider">2P ONLINE CO-OP</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Host a room or join a comrade online in real time with synchronized bullets, enemies, and bosses.
                    </p>
                  </div>
                  <button
                    id="btn-host-coop"
                    onClick={() => handleHostOnlineGame('coop')}
                    className="mt-5 w-full py-2.5 bg-[#00f2ff] hover:bg-cyan-300 text-black font-black text-xs uppercase tracking-widest shadow-[4px_4px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition"
                  >
                    HOST CO-OP ROOM
                  </button>
                </div>

                {/* LOCAL 2P SHARED SCREEN */}
                <div className="bg-[#0a0a0c] p-5 border-2 border-[#333] hover:border-[#ff2d55] transition shadow-[4px_4px_0px_#000] flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 bg-[#1a1a1e] border-2 border-[#ff2d55] text-[#ff2d55] flex items-center justify-center mb-3 shadow-[2px_2px_0px_#000]">
                      <Shield className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-base text-white mb-1 tracking-wider">LOCAL 2P CO-OP</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Two players on one device! P1 uses WASD + J/K, P2 uses Arrow Keys + NumPad or Gamepads.
                    </p>
                  </div>
                  <button
                    id="btn-start-local-2p"
                    onClick={() => {
                      retroAudio.init();
                      retroAudio.powerup();
                      onStartLocal2P();
                    }}
                    className="mt-5 w-full py-2.5 bg-[#ff2d55] hover:bg-red-600 text-white font-bold text-xs uppercase tracking-widest shadow-[4px_4px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition"
                  >
                    PLAY LOCAL 2-PLAYER
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: ONLINE HOST & JOIN CODE */}
            {activeTab === 'online' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Host Section */}
                <div className="bg-[#0a0a0c] p-5 border-2 border-[#333] shadow-[4px_4px_0px_#000]">
                  <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-2 uppercase tracking-wider">
                    <Wifi className="w-4 h-4 text-[#00f2ff]" /> CREATE A NEW MATCH
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">
                    Host a game room and invite a friend using a unique 5-character code.
                  </p>
                  <div className="space-y-3">
                    <button
                      id="btn-host-coop-tab"
                      onClick={() => handleHostOnlineGame('coop')}
                      className="w-full py-2.5 bg-[#00f2ff] hover:bg-cyan-300 text-black font-black text-xs uppercase tracking-widest shadow-[4px_4px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition"
                    >
                      HOST CO-OP MISSION (2 PLAYERS)
                    </button>
                    <button
                      id="btn-host-versus-tab"
                      onClick={() => handleHostOnlineGame('versus')}
                      className="w-full py-2.5 bg-[#ff2d55] hover:bg-red-600 text-white font-bold text-xs uppercase tracking-widest shadow-[4px_4px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition flex items-center justify-center gap-2"
                    >
                      <Swords className="w-4 h-4" /> HOST VERSUS DEATHMATCH
                    </button>
                  </div>
                </div>

                {/* Join by Code Section */}
                <div className="bg-[#0a0a0c] p-5 border-2 border-[#333] shadow-[4px_4px_0px_#000]">
                  <h3 className="font-bold text-white text-sm mb-3 uppercase tracking-wider">JOIN WITH ROOM CODE</h3>
                  <p className="text-xs text-slate-400 mb-4">
                    Enter the code provided by the room host:
                  </p>
                  <div className="space-y-3">
                    <input
                      id="input-room-code"
                      type="text"
                      maxLength={6}
                      placeholder="E.G. 9XZ4A"
                      value={joinRoomCode}
                      onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())}
                      className="w-full bg-[#050507] border-2 border-[#333] px-4 py-2 text-center font-bold tracking-widest text-lg text-[#ffca28] uppercase focus:outline-hidden focus:border-[#00f2ff] shadow-[2px_2px_0px_#000]"
                    />
                    <button
                      id="btn-join-room-by-code"
                      disabled={!joinRoomCode.trim()}
                      onClick={() => handleJoinOnlineGame(joinRoomCode)}
                      className="w-full py-2.5 bg-[#00f2ff] hover:bg-cyan-300 disabled:opacity-40 text-black font-black text-xs uppercase tracking-widest shadow-[4px_4px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition"
                    >
                      CONNECT & JOIN ROOM
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: BROWSE PUBLIC ROOMS */}
            {activeTab === 'join' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 uppercase tracking-wider">Available public rooms on server:</span>
                  <button
                    id="btn-refresh-rooms"
                    onClick={fetchPublicRooms}
                    className="flex items-center gap-1 text-xs text-[#00f2ff] hover:text-white px-2.5 py-1 bg-[#1a1a1e] border border-[#333] shadow-[2px_2px_0px_#000]"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRooms ? 'animate-spin' : ''}`} /> Refresh
                  </button>
                </div>

                {publicRooms.length === 0 ? (
                  <div className="bg-[#0a0a0c] p-8 border-2 border-[#333] text-center text-xs text-slate-500 uppercase tracking-wider shadow-[4px_4px_0px_#000]">
                    No active rooms found right now. Host your own room and invite a friend!
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {publicRooms.map((r) => (
                      <div
                        key={r.id}
                        className="bg-[#0a0a0c] p-3 border-2 border-[#333] flex items-center justify-between hover:border-[#00f2ff] shadow-[2px_2px_0px_#000]"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-[#ffca28] text-sm">{r.id}</span>
                          <span className="text-xs text-slate-300">{r.name}</span>
                          <span className={`text-[10px] px-2 py-0.5 font-bold uppercase ${r.mode === 'coop' ? 'bg-[#1a1a1e] text-[#00f2ff] border border-[#00f2ff]' : 'bg-[#1a1a1e] text-[#ff2d55] border border-[#ff2d55]'}`}>
                            {r.mode}
                          </span>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="text-xs text-slate-400">
                            {r.playerCount} / {r.maxPlayers} Players
                          </span>
                          <button
                            id={`btn-join-room-${r.id}`}
                            disabled={r.playerCount >= r.maxPlayers}
                            onClick={() => handleJoinOnlineGame(r.id)}
                            className="px-3 py-1 bg-[#00f2ff] hover:bg-cyan-300 disabled:opacity-40 text-black font-bold text-xs uppercase tracking-wider shadow-[2px_2px_0px_#000] transition"
                          >
                            {r.playerCount >= r.maxPlayers ? 'FULL' : 'JOIN'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* FOOTER & CONTROLS CHEAT SHEET */}
      <footer className="relative z-20 text-center text-[10px] text-[#666] py-4 max-w-2xl uppercase tracking-widest">
        <p>KEYBOARD CONTROLS: WASD / Arrows to Move & Aim • J / Z to Jump • K / X to Fire</p>
        <p className="mt-0.5 text-[#555]">Gamepad & Mobile Touchscreen controls fully supported</p>
      </footer>
    </div>
  );
};
