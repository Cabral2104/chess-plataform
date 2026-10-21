import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, AuthResponse } from '../models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'chess_auth_token';

  // Signals para estado reactivo sin parpadeos (60 FPS)
  currentUser = signal<User | null>(null);
  isLoading = signal<boolean>(false);
  isAuthenticated = computed(() => !!this.currentUser());

  private heartbeatTimer: any = null;

  constructor() {
    this.checkAuth();
  }

  /**
   * Verificar sesión existente al cargar la aplicación.
   */
  checkAuth(): void {
    const token = this.getToken();
    if (!token) {
      this.currentUser.set(null);
      this.stopHeartbeat();
      return;
    }

    this.isLoading.set(true);
    this.http.get<{ user: User }>(`${this.apiUrl}/me`).pipe(
      tap((res) => {
        this.currentUser.set(res.user);
        this.isLoading.set(false);
        this.startHeartbeat();
      }),
      catchError(() => {
        this.logoutLocal();
        this.isLoading.set(false);
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Registro de un nuevo jugador.
   */
  register(data: { name: string; username: string; email: string; password: string; password_confirmation: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      tap((res) => {
        this.setSession(res);
        this.startHeartbeat();
      })
    );
  }

  /**
   * Inicio de sesión con email o username.
   */
  login(data: { login: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, data).pipe(
      tap((res) => {
        this.setSession(res);
        this.startHeartbeat();
      })
    );
  }

  /**
   * Cierre de sesión en servidor y local.
   */
  logout(): Observable<any> {
    this.stopHeartbeat();
    return this.http.post(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => {
        this.logoutLocal();
      }),
      catchError(() => {
        this.logoutLocal();
        return of(null);
      })
    );
  }

  private isSendingHeartbeat = false;

  /**
   * Envía un pulso de presencia al backend para mantener presence_status = 'online'
   */
  sendHeartbeat(): void {
    if (!this.getToken() || this.isSendingHeartbeat) return;
    this.isSendingHeartbeat = true;
    this.http.post<{ status: string; presence_status: 'online' | 'in_game' | 'offline' }>(`${this.apiUrl}/heartbeat`, {}).subscribe({
      next: (res) => {
        this.isSendingHeartbeat = false;
        const user = this.currentUser();
        if (user && user.presence_status !== res.presence_status) {
          this.currentUser.set({
            ...user,
            presence_status: res.presence_status
          });
        }
      },
      error: () => {
        this.isSendingHeartbeat = false;
      }
    });
  }

  startHeartbeat(): void {
    this.stopHeartbeat();
    this.sendHeartbeat();
    // Enviar cada 25 segundos
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, 25000);
  }

  stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Limpiar sesión local.
   */
  logoutLocal(): void {
    this.stopHeartbeat();
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUser.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private setSession(auth: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, auth.token);
    this.currentUser.set(auth.user);
    this.startHeartbeat();
  }
}

