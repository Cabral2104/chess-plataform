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
      return;
    }

    this.isLoading.set(true);
    this.http.get<{ user: User }>(`${this.apiUrl}/me`).pipe(
      tap((res) => {
        this.currentUser.set(res.user);
        this.isLoading.set(false);
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
      })
    );
  }

  /**
   * Cierre de sesión en servidor y local.
   */
  logout(): Observable<any> {
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

  /**
   * Limpiar sesión local.
   */
  logoutLocal(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUser.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private setSession(auth: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, auth.token);
    this.currentUser.set(auth.user);
  }
}
