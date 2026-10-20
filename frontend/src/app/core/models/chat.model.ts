import { User } from './user.model';

export interface GameChatMessage {
  id: number;
  game_id: number;
  user_id: number | null;
  message: string;
  type: 'chat' | 'system';
  created_at: string;
  user?: User;
}
