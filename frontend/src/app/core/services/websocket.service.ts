import { Injectable, inject, NgZone } from '@angular/core';
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

  constructor() {
    this.initEcho();
  }

  private initEcho(): void {
    if (typeof window !== 'undefined') {
      (window as any).Pusher = Pusher;

      this.echo = new Echo({
        broadcaster: 'reverb',
        key: environment.reverb.key,
        wsHost: environment.reverb.host,
        wsPort: environment.reverb.port,
        wssPort: environment.reverb.port,
        forceTLS: environment.reverb.scheme === 'https',
        enabledTransports: ['ws', 'wss'],
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
    }
  }

  /**
   * Conectarse al canal de presencia de una partida específica.
   * Todos los eventos se despachan dentro de NgZone para asegurar renders instantáneos a 60 FPS.
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
    if (!this.echo) return;

    this.echo.join(`game.${gameCode}`)
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
    if (!this.echo) return;
    this.echo.leave(`game.${gameCode}`);
  }
}
