import { Injectable, inject, NgZone, signal } from '@angular/core';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { environment } from '../../../environments/environment';
import {
  MoveMadeEventPayload,
  GameOverEventPayload,
  DrawOfferedEventPayload,
  ChatMessageSentEventPayload,
  PresenceMember,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private ngZone = inject(NgZone);
  private echo: Echo<'reverb'> | null = null;
  private wsUnavailable = false;
  isConnected = signal<boolean>(false);

  private ensureEcho(): Echo<'reverb'> | null {
    if (this.wsUnavailable || typeof window === 'undefined') {
      return null;
    }
    if (this.echo) {
      return this.echo;
    }

    try {
      (window as any).Pusher = Pusher;
      const isHttps = environment.reverb.scheme === 'https';

      this.echo = new Echo({
        broadcaster: 'reverb',
        key: environment.reverb.key,
        wsHost: environment.reverb.host,
        wsPort: environment.reverb.port,
        wssPort: environment.reverb.port,
        forceTLS: isHttps,
        enabledTransports: isHttps ? ['ws', 'wss'] : ['ws'],
        disableStats: true,
        authorizer: (channel: any) => {
          return {
            authorize: (socketId: string, callback: Function) => {
              const token = localStorage.getItem('chess_auth_token');
              fetch(`${environment.apiUrl}/broadcasting/auth`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                  'Accept': 'application/json',
                },
                body: JSON.stringify({
                  socket_id: socketId,
                  channel_name: channel.name,
                }),
              })
                .then((res) => {
                  if (!res.ok) throw new Error('Fallo al autorizar canal WebSocket');
                  return res.json();
                })
                .then((data) => {
                  this.ngZone.run(() => callback(null, data));
                })
                .catch((err) => {
                  this.ngZone.run(() => callback(err, null));
                });
            },
          };
        },
      });

      const pusherClient = (this.echo.connector as any)?.pusher;
      if (pusherClient?.connection) {
        pusherClient.connection.bind('connected', () => {
          this.ngZone.run(() => this.isConnected.set(true));
        });

        // Si el servidor Reverb no está encendido en el puerto 8085, cortar reintentos infinitos
        // para no inundar la consola y delegar en la sincronización reactiva HTTP.
        const stopRetriesOnOffline = () => {
          if (!this.isConnected()) {
            this.wsUnavailable = true;
            try {
              pusherClient.disconnect();
            } catch {
              // Ignorar error de desconexión
            }
          }
        };

        pusherClient.connection.bind('error', stopRetriesOnOffline);
        pusherClient.connection.bind('unavailable', stopRetriesOnOffline);
        pusherClient.connection.bind('failed', stopRetriesOnOffline);
      }
    } catch {
      this.wsUnavailable = true;
      this.echo = null;
    }

    return this.echo;
  }

  /**
   * Conectarse al canal de presencia de una partida específica.
   */
  joinGameRoom(
    gameCode: string,
    callbacks: {
      onHere?: (members: PresenceMember[]) => void;
      onJoining?: (member: PresenceMember) => void;
      onLeaving?: (member: PresenceMember) => void;
      onMoveMade?: (payload: MoveMadeEventPayload) => void;
      onGameOver?: (payload: GameOverEventPayload) => void;
      onDrawOffered?: (payload: DrawOfferedEventPayload) => void;
      onChatMessage?: (payload: ChatMessageSentEventPayload) => void;
    }
  ): void {
    const echo = this.ensureEcho();
    if (!echo) return;

    echo.join(`game.${gameCode}`)
      .here((members: PresenceMember[]) => {
        this.ngZone.run(() => callbacks.onHere?.(members));
      })
      .joining((member: PresenceMember) => {
        this.ngZone.run(() => callbacks.onJoining?.(member));
      })
      .leaving((member: PresenceMember) => {
        this.ngZone.run(() => callbacks.onLeaving?.(member));
      })
      .listen('.MoveMade', (payload: MoveMadeEventPayload) => {
        this.ngZone.run(() => callbacks.onMoveMade?.(payload));
      })
      .listen('.GameOver', (payload: GameOverEventPayload) => {
        this.ngZone.run(() => callbacks.onGameOver?.(payload));
      })
      .listen('.DrawOffered', (payload: DrawOfferedEventPayload) => {
        this.ngZone.run(() => callbacks.onDrawOffered?.(payload));
      })
      .listen('.ChatMessageSent', (payload: ChatMessageSentEventPayload) => {
        this.ngZone.run(() => callbacks.onChatMessage?.(payload));
      });
  }

  /**
   * Abandonar el canal de la partida al salir de la pantalla.
   */
  leaveGameRoom(gameCode: string): void {
    if (!this.echo || this.wsUnavailable) return;
    try {
      this.echo.leave(`game.${gameCode}`);
    } catch {
      // Ignorar
    }
  }
}
