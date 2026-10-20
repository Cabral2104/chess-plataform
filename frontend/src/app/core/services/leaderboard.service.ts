import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, UserRating, Game } from '../models';

export interface LeaderboardEntry extends UserRating {
  user: User;
}

export interface UserProfileResponse {
  user: User;
  stats: {
    win_rate: number;
    total_games: number;
    total_wins: number;
    total_losses: number;
    total_draws: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class LeaderboardService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /**
   * Obtener clasificación por modalidad (Bullet, Blitz, Rapid, Classical).
   */
  getLeaderboard(mode: string = 'blitz'): Observable<{ mode: string; leaderboard: LeaderboardEntry[] }> {
    return this.http.get<{ mode: string; leaderboard: LeaderboardEntry[] }>(`${this.apiUrl}/rankings?mode=${mode}`);
  }

  /**
   * Obtener perfil público de un jugador.
   */
  getUserProfile(username: string): Observable<UserProfileResponse> {
    return this.http.get<UserProfileResponse>(`${this.apiUrl}/users/${username}`);
  }

  /**
   * Obtener historial de partidas de un jugador para replay.
   */
  getUserHistory(username: string): Observable<{ games: Game[] }> {
    return this.http.get<{ games: Game[] }>(`${this.apiUrl}/users/${username}/history`);
  }
}
