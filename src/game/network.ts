import { Bullet, CharacterType, WeaponType, TauntMessage } from '../types';

export interface RoomInfo {
  id: string;
  name: string;
  mode: 'coop' | 'versus';
  seed: number;
  hostId: string;
  stageStarted?: boolean;
  players: {
    id: string;
    name: string;
    character: CharacterType;
    lives: number;
    score: number;
    weapon: WeaponType;
  }[];
}

export class NetworkManager {
  private ws: WebSocket | null = null;
  public isConnected: boolean = false;
  public connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';
  public currentRoom: RoomInfo | null = null;
  public localPlayerId: string = '';
  public ping: number = 0;
  private pingInterval: number | null = null;

  // Event handlers
  public onRoomCreated?: (room: RoomInfo) => void;
  public onRoomJoined?: (room: RoomInfo) => void;
  public onPlayerJoined?: (player: any) => void;
  public onPlayerLeft?: (playerId: string) => void;
  public onGameStarted?: (seed: number) => void;
  public onRemotePlayerSync?: (data: any) => void;
  public onRemotePlayerFire?: (bullet: Bullet) => void;
  public onEnemyHitEvent?: (data: { enemyId: string; damage: number; killed: boolean }) => void;
  public onBossUpdate?: (data: { hp: number; maxHp: number; defeated: boolean }) => void;
  public onPowerupCollected?: (data: { powerupId: string; weapon: WeaponType }) => void;
  public onTauntReceived?: (taunt: TauntMessage) => void;
  public onError?: (msg: string) => void;

  public connect(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
        resolve(true);
        return;
      }

      this.connectionStatus = 'connecting';
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const url = `${protocol}//${window.location.host}`;

      try {
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          this.isConnected = true;
          this.connectionStatus = 'connected';
          this.startPingLoop();
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onclose = () => {
          this.isConnected = false;
          this.connectionStatus = 'disconnected';
          this.stopPingLoop();
        };

        this.ws.onerror = (err) => {
          console.warn('WebSocket connection error:', err);
          this.connectionStatus = 'error';
          resolve(false);
        };
      } catch (e) {
        this.connectionStatus = 'error';
        resolve(false);
      }
    });
  }

  private startPingLoop() {
    this.stopPingLoop();
    this.pingInterval = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'PING', clientTimestamp: Date.now() }));
      }
    }, 2000);
  }

  private stopPingLoop() {
    if (this.pingInterval !== null) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private handleMessage(raw: string) {
    try {
      const msg = JSON.parse(raw);

      switch (msg.type) {
        case 'PONG': {
          this.ping = Math.max(1, Date.now() - msg.clientTimestamp);
          break;
        }

        case 'ROOM_CREATED': {
          this.localPlayerId = msg.playerId;
          this.currentRoom = msg.room;
          if (this.onRoomCreated) this.onRoomCreated(msg.room);
          break;
        }

        case 'ROOM_JOINED': {
          this.localPlayerId = msg.playerId;
          this.currentRoom = msg.room;
          if (this.onRoomJoined) this.onRoomJoined(msg.room);
          break;
        }

        case 'PLAYER_JOINED': {
          if (this.currentRoom) {
            this.currentRoom.players = msg.players;
          }
          if (this.onPlayerJoined) this.onPlayerJoined(msg.player);
          break;
        }

        case 'PLAYER_LEFT': {
          if (this.currentRoom) {
            this.currentRoom.players = msg.players;
            this.currentRoom.hostId = msg.newHostId;
          }
          if (this.onPlayerLeft) this.onPlayerLeft(msg.playerId);
          break;
        }

        case 'GAME_STARTED': {
          if (this.onGameStarted) this.onGameStarted(msg.seed);
          break;
        }

        case 'PLAYER_SYNC_UPDATE': {
          if (this.onRemotePlayerSync) this.onRemotePlayerSync(msg.data);
          break;
        }

        case 'PLAYER_FIRED_BULLET': {
          if (this.onRemotePlayerFire) this.onRemotePlayerFire(msg.bullet);
          break;
        }

        case 'ENEMY_HIT_EVENT': {
          if (this.onEnemyHitEvent) this.onEnemyHitEvent(msg);
          break;
        }

        case 'BOSS_UPDATE': {
          if (this.onBossUpdate) this.onBossUpdate(msg);
          break;
        }

        case 'POWERUP_COLLECTED': {
          if (this.onPowerupCollected) this.onPowerupCollected(msg);
          break;
        }

        case 'TAUNT_MESSAGE': {
          if (this.onTauntReceived) {
            this.onTauntReceived({
              id: `t_${Date.now()}_${Math.random()}`,
              playerId: msg.playerId,
              playerName: msg.playerName,
              text: msg.text,
              time: Date.now(),
            });
          }
          break;
        }

        case 'ERROR': {
          if (this.onError) this.onError(msg.message);
          break;
        }
      }
    } catch (e) {
      console.error('Error handling WS message:', e);
    }
  }

  // Client Actions
  public createRoom(roomName: string, character: CharacterType, mode: 'coop' | 'versus', playerName?: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(
      JSON.stringify({
        type: 'CREATE_ROOM',
        roomName,
        character,
        mode,
        playerName,
      })
    );
  }

  public joinRoom(roomId: string, playerName?: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(
      JSON.stringify({
        type: 'JOIN_ROOM',
        roomId,
        playerName,
      })
    );
  }

  public startGame() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'START_GAME' }));
  }

  public syncPlayerState(data: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(
      JSON.stringify({
        type: 'PLAYER_SYNC',
        ...data,
        ping: this.ping,
      })
    );
  }

  public sendFireBullet(bullet: Bullet) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(
      JSON.stringify({
        type: 'PLAYER_FIRE',
        bullet,
      })
    );
  }

  public sendEnemyHit(enemyId: string, damage: number, killed: boolean) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(
      JSON.stringify({
        type: 'ENEMY_HIT',
        enemyId,
        damage,
        killed,
      })
    );
  }

  public sendBossHit(damage: number) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(
      JSON.stringify({
        type: 'BOSS_HIT',
        damage,
      })
    );
  }

  public sendPowerupTaken(powerupId: string, weapon: WeaponType) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(
      JSON.stringify({
        type: 'POWERUP_TAKEN',
        powerupId,
        weapon,
      })
    );
  }

  public sendTaunt(text: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(
      JSON.stringify({
        type: 'ARCADE_TAUNT',
        text,
      })
    );
  }

  public disconnect() {
    this.stopPingLoop();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.currentRoom = null;
    this.isConnected = false;
  }
}

export const networkManager = new NetworkManager();
