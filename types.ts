
export interface Player {
  name: string;
  flag: string;
  legs: number;
  score: number;
  sets: number;
}

export interface GameState {
  players: [Player, Player];
  activePlayerIndex: number;
  startingScore: number;
  firstToLegs: number;
  matchTitle: string;
  tournamentInfo: string;
  history: number[][]; // History of scores for each player
}

export type DartsAction = 
  | { type: 'SUBTRACT_SCORE'; amount: number }
  | { type: 'RESET_GAME' }
  | { type: 'UPDATE_PLAYER'; index: number; data: Partial<Player> }
  | { type: 'UPDATE_CONFIG'; data: Partial<GameState> }
  | { type: 'UNDO' }
  | { type: 'NEXT_LEG' };
