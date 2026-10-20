export interface GameMode {
  id: number;
  name: string;
  slug: string;
  type: 'bullet' | 'blitz' | 'rapid' | 'classical' | 'custom';
  initial_time_seconds: number;
  increment_seconds: number;
  is_rated_default: boolean;
  icon?: string;
  description?: string;
}
