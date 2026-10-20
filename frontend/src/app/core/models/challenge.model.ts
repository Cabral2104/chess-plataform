import { GameMode } from './game-mode.model';
import { Game } from './game.model';
import { User } from './user.model';

export interface GameChallenge {
  id: number;
  code: string;
  challenger_id: number;
  challenged_id?: number | null;
  game_mode_id: number;
  color_preference: 'white' | 'black' | 'random';
  is_rated: boolean;
  challenge_status: 'pending' | 'accepted' | 'declined' | 'expired' | 'canceled';
  expires_at?: string;
  created_at: string;
  challenger?: User;
  challenged?: User;
  game_mode?: GameMode;
  game?: Game;
}
