export interface Vector {
  x: number;
  y: number;
}

export interface Input {
  frame: number;
  left: boolean;
  right: boolean;
  jump: boolean;
  action: boolean;
}

export interface PlayerState {
  id: string;
  position: Vector;
  velocity: Vector;
  isGrounded: boolean;
  facingRight: boolean;
  width: number;
  height: number;
  color: number;
  sizeModifier: number;
  health: number;
  doubloons: number;
  jumpHeld: boolean; // Track if jump key is held (to prevent auto-repeat)
  isAttacking: boolean; // Is player currently attacking
  attackFrame: number; // Current frame of attack animation (0 = not attacking)
  attackCooldown: number; // Frames until can attack again
  hasSword: boolean; // Whether player has collected the sword power-up
}

export enum EntityType {
  PLATFORM = 'PLATFORM',
  COCONUT = 'COCONUT',
  RUM = 'RUM',
  DOUBLOON = 'DOUBLOON',
  CANNON = 'CANNON',
  SPIKE = 'SPIKE',
  GOAL = 'GOAL',
  ENEMY = 'ENEMY',
  SWORD_CHEST = 'SWORD_CHEST'
}

export interface Entity {
  id: string;
  type: EntityType;
  position: Vector;
  velocity?: Vector;
  width: number;
  height: number;
  active: boolean;
  collected?: boolean;
  patrolDirection?: number; // For enemies
}

export interface LevelData {
  id: number;
  name: string;
  width: number;
  height: number;
  platforms: { x: number; y: number; w: number; h: number }[];
  spawnPoint: Vector;
  goalPosition: Vector;
  doubloons: Vector[];
  enemies?: { x: number; y: number; patrolWidth: number }[];
  spikes?: { x: number; y: number; w: number }[];
  background?: number;
  requiredDoubloons?: number;
  swordChest?: Vector; // Position of the sword power-up chest
}

export interface CampaignProgress {
  currentLevel: number;
  totalDoubloons: number;
  unlockedLevels: number[];
  bestTimes: { [levelId: number]: number };
}

export interface GameState {
  frame: number;
  players: Map<string, PlayerState>;
  entities: Entity[];
  levelComplete?: boolean;
  levelFailed?: boolean;
}

export interface SerializedGameState {
  frame: number;
  players: { [key: string]: PlayerState };
  entities: Entity[];
}

export interface GameMessage {
  type: 'input' | 'state' | 'join' | 'leave';
  data: any;
  playerId?: string;
  timestamp?: number;
}

export type GameMode = 'menu' | 'campaign' | 'multiplayer';
