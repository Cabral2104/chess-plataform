import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Game, GameMode, GameChallenge, GameMove, GameChatMessage } from '../models';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /**
   * Obtener lista de ritmos oficiales para el lobby.
   */
  getGameModes(): Observable<{ game_modes: GameMode[] }> {
    return this.http.get<{ game_modes: GameMode[] }>(`${this.apiUrl}/game-modes`);
  }

  /**
   * Listar retos públicos abiertos en espera de rival.
   */
  getOpenChallenges(): Observable<{ challenges: GameChallenge[] }> {
    return this.http.get<{ challenges: GameChallenge[] }>(`${this.apiUrl}/challenges`);
  }

  /**
   * Listar partidas activas en curso para espectadores (Chess TV).
   */
  getActiveGames(): Observable<{ games: Game[] }> {
    return this.http.get<{ games: Game[] }>(`${this.apiUrl}/games/active`);
  }

  /**
   * Crear un nuevo reto o sala (pública o privada con enlace).
   */
  createChallenge(data: {
    game_mode_id: number;
    color_preference: 'white' | 'black' | 'random';
    is_rated: boolean;
    is_private?: boolean;
    challenged_id?: number | null;
  }): Observable<{ message: string; challenge: GameChallenge }> {
    return this.http.post<{ message: string; challenge: GameChallenge }>(`${this.apiUrl}/challenges`, data);
  }

  /**
   * Consultar información de un reto por código.
   */
  getChallenge(code: string): Observable<{ challenge: GameChallenge }> {
    return this.http.get<{ challenge: GameChallenge }>(`${this.apiUrl}/challenges/${code}`);
  }

  /**
   * Aceptar un reto y generar la partida oficial.
   */
  acceptChallenge(code: string): Observable<{ message: string; game: Game }> {
    return this.http.post<{ message: string; game: Game }>(`${this.apiUrl}/challenges/${code}/accept`, {});
  }

  /**
   * Cancelar un reto pendiente propio.
   */
  cancelChallenge(code: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/challenges/${code}/cancel`, {});
  }

  /**
   * Obtener el estado autoritativo completo de una partida.
   */
  getGame(code: string): Observable<{
    game: Game;
    dynamic_clocks: { white_time_left_ms: number; black_time_left_ms: number };
  }> {
    return this.http.get<{
      game: Game;
      dynamic_clocks: { white_time_left_ms: number; black_time_left_ms: number };
    }>(`${this.apiUrl}/games/${code}`);
  }

  /**
   * Enviar un movimiento al servidor con validación y reloj atómico.
   */
  makeMove(code: string, moveData: {
    from: string;
    to: string;
    piece: string;
    captured_piece?: string | null;
    promotion?: string | null;
    san: string;
    fen: string;
    is_checkmate?: boolean;
    is_stalemate?: boolean;
    is_draw?: boolean;
  }): Observable<{ message: string; move: GameMove; game: Game }> {
    return this.http.post<{ message: string; move: GameMove; game: Game }>(`${this.apiUrl}/games/${code}/move`, moveData);
  }

  /**
   * Rendirse en una partida activa.
   */
  resign(code: string): Observable<{ message: string; game: Game }> {
    return this.http.post<{ message: string; game: Game }>(`${this.apiUrl}/games/${code}/resign`, {});
  }

  /**
   * Proponer o aceptar tablas.
   */
  offerDraw(code: string): Observable<{ message: string; game?: Game }> {
    return this.http.post<{ message: string; game?: Game }>(`${this.apiUrl}/games/${code}/draw-offer`, {});
  }

  /**
   * Enviar un mensaje de chat a la sala.
   */
  sendChatMessage(code: string, message: string): Observable<{ message: string; chat: GameChatMessage }> {
    return this.http.post<{ message: string; chat: GameChatMessage }>(`${this.apiUrl}/games/${code}/chat`, { message });
  }
}

