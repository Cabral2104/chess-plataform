export interface UserRating {
  id: number;
  user_id: number;
  type: 'bullet' | 'blitz' | 'rapid' | 'classical';
  rating: number;
  peak_rating: number;
  games_count: number;
  wins_count: number;
  losses_count: number;
  draws_count: number;
}

export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  avatar_url: string;
  presence_status: 'online' | 'in_game' | 'offline';
  total_games: number;
  total_wins: number;
  total_losses: number;
  total_draws: number;
  last_seen_at?: string;
  ratings?: UserRating[];
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

/**
 * Obtener la puntuación Elo real del usuario para la modalidad indicada.
 * Si no cuenta con registro para dicha modalidad, retorna el Elo inicial FIDE (1200).
 */
export function getUserRating(user: User | null | undefined, modeType: string = 'blitz'): number {
  if (!user || !user.ratings || user.ratings.length === 0) {
    return 1200;
  }
  const match = user.ratings.find(r => r.type === modeType);
  return match ? match.rating : 1200;
}
