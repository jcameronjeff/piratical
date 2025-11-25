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
  sizeModifier: number; // For coconut size-up
}

export enum EntityType {
  PLATFORM = 'PLATFORM',
  COCONUT = 'COCONUT',
  RUM = 'RUM',
  DOUBLOON = 'DOUBLOON',
  CANNON = 'CANNON'
}

export interface Entity {
  id: string;
  type: EntityType;
  position: Vector;
  width: number;
  height: number;
  active: boolean;
}

export interface GameState {
  frame: number;
  players: Map<string, PlayerState>; // Using Map for easy access, but might need serialization for PartyKit
  entities: Entity[];
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
