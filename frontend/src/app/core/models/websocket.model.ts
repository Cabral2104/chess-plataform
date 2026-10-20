import { GameMove } from './move.model';
import { GameChatMessage } from './chat.model';

export interface MoveMadeEventPayload {
  move: GameMove;
  fen: string;
  current_turn: 'w' | 'b';
  white_time_left_ms: number;
  black_time_left_ms: number;
  move_count: number;
}

export interface GameOverEventPayload {
  winner_id: number | null;
  end_reason: string;
  game_status: 'completed';
  white_rating_change: number | null;
  black_rating_change: number | null;
}

export interface DrawOfferedEventPayload {
  offered_by: number;
}

export interface ChatMessageSentEventPayload {
  message: GameChatMessage;
}

export interface PresenceMember {
  id: number;
  name: string;
  username: string;
  avatar_url: string;
  role: 'white' | 'black' | 'spectator';
}
