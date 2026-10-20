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
