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
  characterType: CharacterType; // Which character sprite to render
}

export enum EntityType {
  PLATFORM = 'PLATFORM',
  COCONUT = 'COCONUT',
  RUM = 'RUM',
  DOUBLOON = 'DOUBLOON',
  CANNON = 'CANNON',
  CANNONBALL = 'CANNONBALL',
  SPIKE = 'SPIKE',
  GOAL = 'GOAL',
  ENEMY = 'ENEMY',
  SWORD_CHEST = 'SWORD_CHEST'
}

// Enemy types - progressively introduced through campaign
export enum EnemyType {
  CRAB = 'CRAB',           // Level 1+: Basic patrol enemy, ground-based
  SEAGULL = 'SEAGULL',     // Level 1+: Flying enemy, sine wave pattern
  SKELETON = 'SKELETON',   // Level 2+: Walks and lunges at player
  CANNON_TURRET = 'CANNON_TURRET', // Level 3+: Stationary, fires cannonballs
  JELLYFISH = 'JELLYFISH', // Level 3+: Floats up and down vertically
  GHOST = 'GHOST',         // Level 4+: Phases in/out, only killed with sword
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
  // Enemy-specific properties
  enemyType?: EnemyType;
  patrolDirection?: number;
  spawnX?: number;           // Original spawn X for patrol bounds
  spawnY?: number;           // Original spawn Y for floating enemies
  patrolWidth?: number;      // Horizontal patrol range
  patrolHeight?: number;     // Vertical patrol range (for flying/floating)
  stateTimer?: number;       // General purpose timer for AI states
  phase?: number;            // Animation phase (for sine waves, ghost fading)
  isVisible?: boolean;       // For ghost enemies
  facingRight?: boolean;     // Direction enemy is facing
  isCharging?: boolean;      // For skeleton lunge attack
  fireRate?: number;         // For cannon turret
  lastFired?: number;        // Frame when last fired
}

// Enemy spawn data for level definition
export interface EnemySpawnData {
  x: number;
  y: number;
  type?: EnemyType;         // Defaults to CRAB for backwards compatibility
  patrolWidth?: number;     // Horizontal patrol distance
  patrolHeight?: number;    // Vertical patrol distance (for flying/floating)
  fireRate?: number;        // For cannons: frames between shots
  facingLeft?: boolean;     // Direction to face (for cannons, skeletons)
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
  enemies?: EnemySpawnData[];
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

export enum CharacterType {
  PIRATE = 'pirate',
  GIRL_PIRATE = 'girl_pirate',
  OCTOPUS = 'octopus',
  LOCKED = 'locked'
}

export interface CharacterInfo {
  type: CharacterType;
  name: string;
  description: string;
  unlocked: boolean;
}
