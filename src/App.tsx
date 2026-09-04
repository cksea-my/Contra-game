/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ArcadeLobby } from './components/ArcadeLobby';
import { GameCanvas } from './components/GameCanvas';
import { CharacterType } from './types';
import { RoomInfo } from './game/network';

export default function App() {
  const [gameState, setGameState] = useState<'lobby' | 'playing'>('lobby');
  const [gameMode, setGameMode] = useState<'solo' | 'local2p' | 'online'>('solo');
  const [character, setCharacter] = useState<CharacterType>('bill');
  const [onlineRoom, setOnlineRoom] = useState<RoomInfo | undefined>(undefined);

  const handleStartSolo = (char: CharacterType) => {
    setCharacter(char);
    setGameMode('solo');
    setOnlineRoom(undefined);
    setGameState('playing');
  };

  const handleStartLocal2P = () => {
    setCharacter('bill');
    setGameMode('local2p');
    setOnlineRoom(undefined);
    setGameState('playing');
  };

  const handleStartOnlineGame = (room: RoomInfo, assignedChar: CharacterType, isVersus: boolean) => {
    setCharacter(assignedChar);
    setGameMode('online');
    setOnlineRoom(room);
    setGameState('playing');
  };

  const handleReturnToLobby = () => {
    setGameState('lobby');
    setOnlineRoom(undefined);
  };

  return (
    <div id="contra-arcade-app" className="w-full min-h-screen bg-[#0a0a0c] text-[#e0e0e0] font-mono antialiased selection:bg-[#ff2d55] selection:text-white border-[6px] sm:border-[12px] border-[#1a1a1e] flex flex-col">
      {gameState === 'lobby' ? (
        <ArcadeLobby
          onStartSolo={handleStartSolo}
          onStartLocal2P={handleStartLocal2P}
          onStartOnlineGame={handleStartOnlineGame}
        />
      ) : (
        <GameCanvas
          mode={gameMode}
          onlineRoom={onlineRoom}
          localCharacter={character}
          onReturnToLobby={handleReturnToLobby}
        />
      )}
    </div>
  );
}
