import { GameMode } from './game-mode.model';
import { GameMove } from './move.model';
import { GameChatMessage } from './chat.model';
import { User } from './user.model';

export interface Game {
  id: number;
  code: string;
  white_player_id: number;
  black_player_id: number;
  winner_id: number | null;
  game_mode_id: number;
  challenge_id?: number | null;
  is_rated: boolean;
  game_status: 'waiting' | 'in_progress' | 'completed' | 'aborted';
  end_reason?: string | null;
  fen: string;
  pgn: string;
  current_turn: 'w' | 'b';
  move_count: number;
  white_time_left_ms: number;
  black_time_left_ms: number;
  last_move_at?: string | null;
  started_at?: string | null;
  ended_at?: string | null;
  white_rating_change?: number | null;
  black_rating_change?: number | null;
  draw_offered_by?: number | null;
  white_player?: User;
  black_player?: User;
  winner?: User | null;
  game_mode?: GameMode;
  moves?: GameMove[];
  chat_messages?: GameChatMessage[];
}
