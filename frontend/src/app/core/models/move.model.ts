export interface GameMove {
  id: number;
  game_id: number;
  user_id: number;
  move_number: number;
  ply: number;
  color: 'w' | 'b';
  from_square: string;
  to_square: string;
  piece: string;
  captured_piece?: string | null;
  promotion?: string | null;
  san: string;
  uci: string;
  fen_after: string;
  time_spent_ms: number;
  remaining_time_ms: number;
  created_at: string;
}
