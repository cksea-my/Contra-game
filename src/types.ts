export type WeaponType = 'NORMAL' | 'MACHINE_GUN' | 'SPREAD' | 'LASER' | 'FIRE' | 'BARRIER';

export type CharacterType = 'bill' | 'lance';

export type PlayerActionState = 'idle' | 'run' | 'jump' | 'prone' | 'swim' | 'dead';

export interface PlayerInput {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jump: boolean;
  fire: boolean;
}

export interface Player {
  id: string;
  name: string;
  character: CharacterType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  isGrounded: boolean;
  facingLeft: boolean;
  aimAngle: number; // in radians or degrees
  aimDirection: { x: number; y: number };
  state: PlayerActionState;
  weapon: WeaponType;
  lives: number;
  score: number;
  invincibleTimer: number;
  fireCooldown: number;
  isDead: boolean;
  respawnTimer: number;
  somersaultFrame: number;
  runFrame: number;
  isRemote?: boolean;
  ping?: number;
}

export interface Bullet {
  id: string;
  ownerId: string;
  isPlayer: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  weapon: WeaponType;
  damage: number;
  life: number;
  color: string;
  trail?: { x: number; y: number }[];
  penetrates?: boolean;
}

export type EnemyType = 'SOLDIER' | 'SNIPER' | 'TURRET' | 'SCUBA' | 'FLYING_POD' | 'MINE';

export interface Enemy {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  isGrounded: boolean;
  facingLeft: boolean;
  aimAngle: number;
  shootCooldown: number;
  stateTimer: number;
  points: number;
  dropsPowerup?: WeaponType;
  subType?: number;
}

export interface PowerupItem {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  weapon: WeaponType;
  collected: boolean;
  life: number;
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'solid' | 'one-way' | 'water';
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  gravity?: number;
}

export interface BossPart {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  destroyed: boolean;
  aimAngle: number;
  cooldown: number;
}

export interface BossState {
  active: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  defeated: boolean;
  coreShieldOpen: boolean;
  coreTimer: number;
  parts: BossPart[];
  explosionTimer: number;
}

export interface RoomSummary {
  id: string;
  name: string;
  mode: 'coop' | 'versus';
  playerCount: number;
  maxPlayers: number;
  stageStarted: boolean;
  createdAt: number;
}

export interface TauntMessage {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  time: number;
}
