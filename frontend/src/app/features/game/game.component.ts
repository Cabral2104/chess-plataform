import { Component, OnInit, OnDestroy, HostListener, inject, signal, computed, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Chess, Square, PieceSymbol } from 'chess.js';
import { AuthService } from '../../core/services/auth.service';
import { GameService } from '../../core/services/game.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { SoundService } from '../../core/services/sound.service';
import { ChessPieceComponent } from '../../shared/components/chess-piece/chess-piece.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import {
  Game,
  GameMove,
  GameChatMessage,
  PresenceMember,
  MoveMadeEventPayload,
  GameOverEventPayload,
  DrawOfferedEventPayload,
  ChatMessageSentEventPayload,
  getUserRating,
} from '../../core/models';

interface BoardSquare {
  square: Square;
  file: string;
  rank: number;
  isLight: boolean;
  pieceKey: string | null;
  isPiece: boolean;
  pieceColor: 'w' | 'b' | null;
}

interface OpeningInfo {
  eco: string;
  name: string;
}

const ECO_OPENINGS: Array<{ moves: string; eco: string; name: string }> = [
  { moves: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6', eco: 'B90', name: 'Defensa Siciliana: Variante Najdorf' },
  { moves: 'e4 c5 Nf3 Nc6 d4 cxd4 Nxd4', eco: 'B32', name: 'Defensa Siciliana: Abierta' },
  { moves: 'e4 c5 Nf3 d6', eco: 'B50', name: 'Defensa Siciliana: Moderna' },
  { moves: 'e4 c5 Nc3', eco: 'B23', name: 'Defensa Siciliana: Cerrada' },
  { moves: 'e4 c5', eco: 'B20', name: 'Defensa Siciliana' },
  { moves: 'e4 e5 Nf3 Nc6 Bb5 a6', eco: 'C70', name: 'Apertura Española: Defensa Morphy' },
  { moves: 'e4 e5 Nf3 Nc6 Bb5', eco: 'C60', name: 'Apertura Española (Ruy López)' },
  { moves: 'e4 e5 Nf3 Nc6 Bc4 Bc5', eco: 'C50', name: 'Apertura Italiana: Giuoco Piano' },
  { moves: 'e4 e5 Nf3 Nc6 Bc4 Nf6', eco: 'C55', name: 'Defensa de los Dos Caballos' },
  { moves: 'e4 e5 Nf3 Nc6 Bc4', eco: 'C50', name: 'Apertura Italiana' },
  { moves: 'e4 e5 Nf3 Nc6 d4', eco: 'C45', name: 'Apertura Escocesa' },
  { moves: 'e4 e5 Nf3 Nf6', eco: 'C42', name: 'Defensa Petrov (Rusa)' },
  { moves: 'e4 e5 f4', eco: 'C30', name: 'Gambito de Rey' },
  { moves: 'e4 e5', eco: 'C20', name: 'Apertura de Peón de Rey Abierta' },
  { moves: 'e4 e6 d4 d5', eco: 'C00', name: 'Defensa Francesa' },
  { moves: 'e4 e6', eco: 'C00', name: 'Defensa Francesa' },
  { moves: 'e4 c6 d4 d5', eco: 'B12', name: 'Defensa Caro-Kann' },
  { moves: 'e4 c6', eco: 'B10', name: 'Defensa Caro-Kann' },
  { moves: 'e4 d5', eco: 'B01', name: 'Defensa Escandinava' },
  { moves: 'e4 d6 d4 Nf6', eco: 'B07', name: 'Defensa Pirc' },
  { moves: 'd4 d5 c4 e6', eco: 'D30', name: 'Gambito de Dama Declinado' },
  { moves: 'd4 d5 c4 c6', eco: 'D10', name: 'Defensa Eslava' },
  { moves: 'd4 d5 c4 dxc4', eco: 'D20', name: 'Gambito de Dama Aceptado' },
  { moves: 'd4 d5 c4', eco: 'D06', name: 'Gambito de Dama' },
  { moves: 'd4 d5 Bf4', eco: 'D00', name: 'Sistema Londres' },
  { moves: 'd4 Nf6 c4 g6 Nc3 Bg7', eco: 'E60', name: 'Defensa India de Rey' },
  { moves: 'd4 Nf6 c4 e6 Nc3 Bb4', eco: 'E20', name: 'Defensa Nimzo-India' },
  { moves: 'd4 Nf6 c4', eco: 'A50', name: 'Defensa India' },
  { moves: 'd4 d5', eco: 'D00', name: 'Apertura Cerrada de Peón de Dama' },
  { moves: 'c4 e5', eco: 'A20', name: 'Apertura Inglesa: Siciliana Invertida' },
  { moves: 'c4', eco: 'A10', name: 'Apertura Inglesa' },
  { moves: 'Nf3 d5', eco: 'A06', name: 'Apertura Réti' },
  { moves: 'Nf3', eco: 'A04', name: 'Apertura Zukertort' },
  { moves: 'e4', eco: 'B00', name: 'Apertura de Peón de Rey' },
  { moves: 'd4', eco: 'A40', name: 'Apertura de Peón de Dama' },
];

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ChessPieceComponent, IconComponent],
  template: `
    <div class="max-w-[1540px] mx-auto px-2 sm:px-5 xl:px-8 py-2.5 sm:py-5 fade-in">

      <!-- Banner de propuesta de tablas entrante -->
      @if (incomingDrawOffer()) {
        <div class="mb-3 p-3.5 sm:p-4 rounded-2xl bg-[#282215] border border-[#f4b942] flex flex-col sm:flex-row sm:items-center justify-between gap-3 fade-in">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-[#f4b942]/15 text-[#f4b942] flex items-center justify-center shrink-0">
              <app-icon name="handshake" class="w-5 h-5"></app-icon>
            </div>
            <div>
              <p class="text-sm font-bold text-white">Propuesta oficial de tablas recibida</p>
              <p class="text-xs text-amber-200/80">Tu oponente propone acordar el empate reglamentario.</p>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2 sm:flex shrink-0">
            <button (click)="acceptDrawOffer()" class="btn btn-primary !py-2 !px-4 !text-xs">Aceptar tablas</button>
            <button (click)="rejectDrawOffer()" class="btn btn-ghost !py-2 !px-4 !text-xs">Rechazar</button>
          </div>
        </div>
      }

      <!-- Contenedor Principal (Se adapta si Modo Zen está activo) -->
      <div class="grid grid-cols-1 gap-5 items-start"
           [ngClass]="zenMode() ? 'max-w-[760px] mx-auto' : 'xl:grid-cols-[minmax(0,1fr)_410px]'">

        <!-- ================= COLUMNA DEL TABLERO ================= -->
        <section class="min-w-0 flex flex-col items-center">
          <div class="w-full max-w-[min(100%,calc(100dvh-11.5rem))] min-w-[280px] flex flex-col gap-2">

            <!-- Barra Superior de Estado de Sala -->
            <div class="flex items-center justify-between gap-2 px-1">
              <div class="flex items-center gap-1.5 min-w-0">
                <span class="chip !text-[#f4b942] font-bold truncate">
                  <app-icon name="flame" class="w-3.5 h-3.5"></app-icon>
                  {{ game()?.game_mode?.name || 'Partida FIDE' }}
                </span>
                <button type="button" (click)="copyRoomCode()" title="Copiar código de sala"
                        class="chip hidden xs:inline-flex font-mono hover:border-[#45d4be] cursor-pointer">
                  <span>#{{ gameCode() }}</span>
                  @if (copiedCode()) {
                    <app-icon name="check" class="w-3 h-3 text-[#45d4be]"></app-icon>
                  } @else {
                    <app-icon name="copy" class="w-3 h-3 text-slate-400"></app-icon>
                  }
                </button>
                @if (game() && authService.currentUser() && !isWhitePlayer() && !isBlackPlayer()) {
                  <span class="chip !text-red-400 !border-red-500/40">
                    <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                    Modo Espectador
                  </span>
                }
              </div>

              <div class="flex items-center gap-2">
                @if (scrubbedMoveIndex() !== -1) {
                  <button type="button" (click)="scrubLive()"
                          class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#f4b942] text-[#141004] flex items-center gap-1">
                    <app-icon name="chevrons-right" class="w-3.5 h-3.5"></app-icon>
                    <span>Volver a Vivo</span>
                  </button>
                } @else if (game()?.game_status === 'in_progress') {
                  <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold"
                        [class.bg-[#2bb5a0]]="isMyTurn()" [class.text-[#04141a]]="isMyTurn()"
                        [class.bg-[#161e36]]="!isMyTurn()" [class.text-slate-300]="!isMyTurn()">
                    <span class="w-2 h-2 rounded-full"
                          [class.bg-[#04141a]]="isMyTurn()"
                          [class.bg-slate-400]="!isMyTurn()"
                          [class.animate-pulse]="isMyTurn()"></span>
                    {{ isMyTurn() ? 'Tu turno de mover' : 'Pensando rival...' }}
                  </span>
                } @else if (game()?.game_status === 'completed') {
                  <span class="chip !text-[#f4b942]">Partida finalizada</span>
                } @else {
                  <span class="chip">
                    <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                    Esperando oponente
                  </span>
                }

                <button type="button" (click)="toggleZenMode()"
                        [title]="zenMode() ? 'Salir de Modo Zen (Z)' : 'Modo Zen sin distracciones (Z)'"
                        class="hidden sm:inline-flex chip hover:border-[#45d4be] cursor-pointer"
                        [class.!border-[#45d4be]]="zenMode()" [class.!text-[#45d4be]]="zenMode()">
                  <span>{{ zenMode() ? 'Salir Zen' : 'Zen' }}</span>
                </button>
              </div>
            </div>

            <!-- TARJETA JUGADOR RIVAL (SUPERIOR) -->
            <div class="surface-2 px-3 py-2 flex items-center justify-between gap-3"
                 [class.!border-[#45d4be]]="game()?.game_status === 'in_progress' && currentTurn() === opponentColor()">
              <div class="flex items-center gap-3 min-w-0">
                <div class="relative shrink-0">
                  <img [src]="opponent()?.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=rival'" alt=""
                       class="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#0d1221] ring-1 ring-[#2a3660]">
                  <span class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-[#161e36]"
                        [class.bg-[#2bb5a0]]="isOpponentConnected()" [class.bg-slate-600]="!isOpponentConnected()"
                        [title]="isOpponentConnected() ? 'En sala' : 'Desconectado'"></span>
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5">
                    <span class="fide-badge !px-1 !py-0 !text-[9px]">{{ getFideTitle(opponentRating()) }}</span>
                    <span class="text-sm font-bold text-white truncate">{{ opponent()?.username || 'Esperando rival...' }}</span>
                    <span class="font-mono text-xs font-bold text-[#f4b942]">({{ opponentRating() }})</span>
                  </div>
                  <div class="flex items-center gap-1 h-4 mt-1">
                    @if (opponentCaptures().length === 0) {
                      <span class="text-[11px] text-slate-500 font-mono">
                        {{ opponentColor() === 'w' ? 'Piezas Blancas' : 'Piezas Negras' }}
                      </span>
                    } @else {
                      @for (p of opponentCaptures(); track $index) {
                        <app-chess-piece [pieceKey]="p" class="w-4 h-4 -mr-1.5 opacity-95"></app-chess-piece>
                      }
                    }
                    @if (opponentAdvantage() > 0) {
                      <span class="ml-2 px-1.5 py-0.2 rounded bg-[#2bb5a0]/15 text-[#45d4be] font-mono text-[10px] font-extrabold">
                        +{{ opponentAdvantage() }}
                      </span>
                    }
                  </div>
                </div>
              </div>

              <!-- Reloj Digital DGT del Rival con barra de progreso -->
              <div class="flex flex-col items-end shrink-0">
                <div class="chess-clock px-3.5 py-1.5 rounded-xl text-xl sm:text-2xl font-extrabold tracking-tight"
                     [class.chess-clock-active]="game()?.game_status === 'in_progress' && currentTurn() === opponentColor()"
                     [class.chess-clock-low]="isClockLow(opponentTimeMs()) && currentTurn() === opponentColor()"
                     [class.text-slate-500]="currentTurn() !== opponentColor()">
                  {{ formatClock(opponentTimeMs()) }}
                </div>
                <div class="w-full h-1 bg-[#0b1020] rounded-full overflow-hidden mt-1">
                  <div class="h-full transition-all duration-150"
                       [class.bg-[#45d4be]]="!isClockLow(opponentTimeMs())"
                       [class.bg-red-500]="isClockLow(opponentTimeMs())"
                       [style.width.%]="getClockPercent(opponentTimeMs())"></div>
                </div>
              </div>
            </div>

            <!-- ÁREA CENTRAL: BARRA DE EVALUACIÓN + TABLERO 64 CASILLAS -->
            <div class="flex items-stretch gap-1.5 sm:gap-2.5 w-full">

              <!-- Barra de Evaluación Vertical en Vivo (Eval Bar) -->
              @if (showEvalBar()) {
                <div class="w-3.5 sm:w-5 rounded-xl overflow-hidden bg-[#15192b] border border-[#28345c] flex flex-col relative select-none shrink-0"
                     [class.flex-col-reverse]="orientation() === 'white'"
                     title="Barra de evaluación en tiempo real">
                  <!-- Parte Blanca -->
                  <div class="bg-[#eef2ff] transition-all duration-300 w-full"
                       [style.height.%]="evalWhitePercent()"></div>
                  <!-- Línea central 0.0 -->
                  <div class="absolute inset-x-0 top-1/2 h-[1.5px] bg-[#f4b942]/70 pointer-events-none z-10"></div>
                  <!-- Etiqueta numérica -->
                  <span class="hidden sm:block absolute inset-x-0 text-[9px] font-mono font-extrabold text-center leading-none z-20 pointer-events-none"
                        [ngClass]="evalNumber() >= 0 ? (orientation() === 'white' ? 'bottom-1 text-[#141829]' : 'top-1 text-[#141829]') : (orientation() === 'white' ? 'top-1 text-[#eef2ff]' : 'bottom-1 text-[#eef2ff]')">
                    {{ evalDisplay() }}
                  </span>
                </div>
              }

              <!-- TABLERO DE AJEDREZ -->
              <div class="chess-board-frame relative flex-1 aspect-square rounded-2xl p-1.5 sm:p-2.5 select-none"
                   [style.--sq-l]="boardTheme().light" [style.--sq-d]="boardTheme().dark">
                <div class="grid grid-cols-8 grid-rows-8 w-full h-full rounded-lg overflow-hidden">
                  @for (sq of boardSquares(); track sq.square) {
                    <div class="relative flex items-center justify-center cursor-pointer"
                         [style.background-color]="sq.isLight ? 'var(--sq-l)' : 'var(--sq-d)'"
                         (click)="onSquareClick(sq)"
                         (dragover)="onDragOver($event)"
                         (drop)="onDrop($event, sq)">

                      <!-- Última jugada -->
                      @if (lastMove() && (lastMove()?.from === sq.square || lastMove()?.to === sq.square)) {
                        <div class="absolute inset-0 bg-[#f7d154]/55 pointer-events-none"></div>
                      }
                      <!-- Casilla seleccionada -->
                      @if (selectedSquare() === sq.square) {
                        <div class="absolute inset-0 bg-[#f7c948]/65 pointer-events-none"></div>
                      }
                      <!-- Jaque al Rey -->
                      @if (isKingInCheck(sq)) {
                        <div class="absolute inset-0 pointer-events-none"
                             style="background: radial-gradient(circle, rgba(239,68,68,.95) 0%, rgba(239,68,68,.55) 45%, transparent 75%)"></div>
                      }

                      <!-- Coordenadas reglamentarias -->
                      @if (showCoords() && isRankLabelVisible(sq)) {
                        <span class="absolute top-0.5 left-1 text-[9px] sm:text-[11px] font-extrabold font-mono pointer-events-none"
                              [style.color]="sq.isLight ? 'var(--sq-d)' : 'var(--sq-l)'">{{ sq.rank }}</span>
                      }
                      @if (showCoords() && isFileLabelVisible(sq)) {
                        <span class="absolute bottom-0.5 right-1 text-[9px] sm:text-[11px] font-extrabold font-mono pointer-events-none"
                              [style.color]="sq.isLight ? 'var(--sq-d)' : 'var(--sq-l)'">{{ sq.file }}</span>
                      }

                      <!-- Indicadores de destino legal -->
                      @if (isLegalTarget(sq.square)) {
                        @if (sq.isPiece) {
                          <div class="absolute inset-[3px] rounded-full border-[5px] border-black/30 pointer-events-none z-20"></div>
                        } @else {
                          <div class="w-[28%] h-[28%] rounded-full bg-black/28 pointer-events-none z-20"></div>
                        }
                      }

                      <!-- Pieza con soporte Drag & Drop -->
                      @if (sq.pieceKey) {
                        <div class="w-full h-full p-[3%] z-10"
                             [attr.draggable]="canDragPiece(sq)"
                             (dragstart)="onDragStart($event, sq)">
                          <app-chess-piece [pieceKey]="sq.pieceKey" class="w-full h-full"></app-chess-piece>
                        </div>
                      }
                    </div>
                  }
                </div>

                <!-- Modal de Coronación de Peón -->
                @if (promotionPending()) {
                  <div class="absolute inset-0 z-30 bg-black/80 flex items-center justify-center p-4 rounded-2xl fade-in">
                    <div class="surface p-5 text-center max-w-xs w-full">
                      <p class="eyebrow mb-1">Coronación reglamentaria</p>
                      <h4 class="font-display text-lg font-bold text-white mb-3">Elige tu pieza</h4>
                      <div class="grid grid-cols-4 gap-2">
                        @for (p of ['q', 'n', 'r', 'b']; track p) {
                          <button type="button" (click)="completePromotion(p)"
                                  class="opt aspect-square p-1.5 flex items-center justify-center">
                            <app-chess-piece [pieceKey]="myColor() + p.toUpperCase()" class="w-full h-full"></app-chess-piece>
                          </button>
                        }
                      </div>
                      <button type="button" (click)="promotionPending.set(null)"
                              class="mt-3 text-xs text-slate-400 hover:text-white">Cancelar</button>
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- TARJETA JUGADOR LOCAL (INFERIOR) -->
            <div class="surface-2 px-3 py-2 flex items-center justify-between gap-3"
                 [class.!border-[#45d4be]]="game()?.game_status === 'in_progress' && currentTurn() === myColor()">
              <div class="flex items-center gap-3 min-w-0">
                <div class="relative shrink-0">
                  <img [src]="bottomPlayer()?.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=player'" alt=""
                       class="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#0d1221] ring-2 ring-[#2bb5a0]">
                  <span class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#2bb5a0] ring-2 ring-[#161e36]"></span>
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5">
                    <span class="fide-badge !px-1 !py-0 !text-[9px]">{{ getFideTitle(myRating()) }}</span>
                    <span class="text-sm font-bold text-white truncate">{{ bottomPlayer()?.username || 'Jugador' }}</span>
                    <span class="font-mono text-xs font-bold text-[#f4b942]">({{ myRating() }})</span>
                    @if (isWhitePlayer() || isBlackPlayer()) {
                      <span class="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#2bb5a0]/20 text-[#45d4be]">Tú</span>
                    }
                  </div>
                  <div class="flex items-center gap-1 h-4 mt-1">
                    @if (myCaptures().length === 0) {
                      <span class="text-[11px] text-slate-500 font-mono">
                        {{ myColor() === 'w' ? 'Piezas Blancas' : 'Piezas Negras' }}
                      </span>
                    } @else {
                      @for (p of myCaptures(); track $index) {
                        <app-chess-piece [pieceKey]="p" class="w-4 h-4 -mr-1.5 opacity-95"></app-chess-piece>
                      }
                    }
                    @if (myAdvantage() > 0) {
                      <span class="ml-2 px-1.5 py-0.2 rounded bg-[#2bb5a0]/15 text-[#45d4be] font-mono text-[10px] font-extrabold">
                        +{{ myAdvantage() }}
                      </span>
                    }
                  </div>
                </div>
              </div>

              <!-- Reloj Digital DGT Local con barra de progreso -->
              <div class="flex flex-col items-end shrink-0">
                <div class="chess-clock px-3.5 py-1.5 rounded-xl text-xl sm:text-2xl font-extrabold tracking-tight"
                     [class.chess-clock-active]="game()?.game_status === 'in_progress' && currentTurn() === myColor()"
                     [class.chess-clock-low]="isClockLow(myTimeMs()) && currentTurn() === myColor()"
                     [class.text-slate-500]="currentTurn() !== myColor()">
                  {{ formatClock(myTimeMs()) }}
                </div>
                <div class="w-full h-1 bg-[#0b1020] rounded-full overflow-hidden mt-1">
                  <div class="h-full transition-all duration-150"
                       [class.bg-[#45d4be]]="!isClockLow(myTimeMs())"
                       [class.bg-red-500]="isClockLow(myTimeMs())"
                       [style.width.%]="getClockPercent(myTimeMs())"></div>
                </div>
              </div>
            </div>

            <!-- Barra de controles rápidos para móvil (siempre al alcance del pulgar) -->
            <div class="grid grid-cols-4 gap-1.5 xl:hidden mt-0.5">
              <button type="button" (click)="scrubPrev()" title="Jugada anterior" class="btn btn-ghost !py-2.5 !px-2">
                <app-icon name="arrow-left" class="w-4 h-4"></app-icon>
              </button>
              <button type="button" (click)="scrubNext()" title="Jugada siguiente" class="btn btn-ghost !py-2.5 !px-2">
                <app-icon name="arrow-right" class="w-4 h-4"></app-icon>
              </button>
              <button type="button" (click)="toggleOrientation()" title="Girar tablero" class="btn btn-ghost !py-2.5 !px-2">
                <app-icon name="rotate" class="w-4 h-4"></app-icon>
              </button>
              @if (game()?.game_status === 'in_progress' && (isWhitePlayer() || isBlackPlayer())) {
                <button type="button" (click)="confirmResignPrompt()" title="Rendirse"
                        class="btn !py-2.5 !px-2 bg-red-950/60 border border-red-900/70 text-red-300">
                  <app-icon name="flag" class="w-4 h-4"></app-icon>
                </button>
              } @else {
                <a routerLink="/lobby" class="btn btn-primary !py-2.5 !px-2 !text-xs">Lobby</a>
              }
            </div>
          </div>
        </section>

        <!-- ================= PANEL DE CONTROL TÁCTICO (DERECHA) ================= -->
        @if (!zenMode()) {
          <aside class="surface flex flex-col overflow-hidden xl:sticky xl:top-6">

            <!-- Cabecera de pestañas + herramientas rápidas -->
            <div class="flex items-center justify-between px-3.5 py-2.5 border-b border-[#222c4e]">
              <div class="flex items-center gap-1 p-1 rounded-xl bg-[#080b14] border border-[#1d2645]">
                <button type="button" (click)="activeSideTab.set('moves')"
                        class="px-3 py-1.5 rounded-lg text-xs font-bold"
                        [class.bg-[#2bb5a0]]="activeSideTab() === 'moves'" [class.text-[#04141a]]="activeSideTab() === 'moves'"
                        [class.text-slate-400]="activeSideTab() !== 'moves'">
                  Planilla ({{ movesList().length }})
                </button>
                <button type="button" (click)="activeSideTab.set('chat')"
                        class="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5"
                        [class.bg-[#2bb5a0]]="activeSideTab() === 'chat'" [class.text-[#04141a]]="activeSideTab() === 'chat'"
                        [class.text-slate-400]="activeSideTab() !== 'chat'">
                  <span>Chat</span>
                  @if (chatMessages().length > 0) {
                    <span class="text-[10px] font-mono px-1.5 rounded-full bg-black/25">{{ chatMessages().length }}</span>
                  }
                </button>
                <button type="button" (click)="activeSideTab.set('tools')"
                        class="px-3 py-1.5 rounded-lg text-xs font-bold"
                        [class.bg-[#2bb5a0]]="activeSideTab() === 'tools'" [class.text-[#04141a]]="activeSideTab() === 'tools'"
                        [class.text-slate-400]="activeSideTab() !== 'tools'">
                  Ajustes
                </button>
              </div>

              <div class="flex items-center gap-1">
                <button type="button" (click)="toggleOrientation()" title="Girar tablero (Tecla F)"
                        class="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#161e36]">
                  <app-icon name="rotate" class="w-4 h-4"></app-icon>
                </button>
                <button type="button" (click)="toggleSound()" title="Activar / Silenciar sonido"
                        class="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#161e36]">
                  <app-icon [name]="soundService.isSoundEnabled() ? 'volume' : 'volume-x'" class="w-4 h-4"></app-icon>
                </button>
              </div>
            </div>

            <!-- Detector de Apertura FIDE / ECO en Tiempo Real -->
            <div class="px-4 py-2.5 bg-[#0c1122] border-b border-[#222c4e] flex items-center justify-between gap-2">
              <div class="min-w-0">
                <div class="flex items-center gap-1.5">
                  <span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold bg-[#2bb5a0]/15 text-[#45d4be] border border-[#2bb5a0]/30">
                    {{ currentOpening().eco }}
                  </span>
                  <span class="text-xs font-bold text-slate-200 truncate">{{ currentOpening().name }}</span>
                </div>
              </div>
              <span class="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-[#161e36] text-slate-200 shrink-0">
                Eval {{ evalDisplay() }}
              </span>
            </div>

            <!-- ===== PESTAÑA 1: PLANILLA SAN + ANÁLISIS ===== -->
            @if (activeSideTab() === 'moves') {
              <div class="h-64 xl:h-[calc(100dvh-27rem)] xl:min-h-[17rem] overflow-y-auto p-2.5 font-mono text-xs">
                @if (movePairs().length === 0) {
                  <div class="h-full flex flex-col items-center justify-center text-center text-slate-500 gap-2 px-4">
                    <app-icon name="board" class="w-8 h-8 opacity-50"></app-icon>
                    <p class="text-xs font-sans">Haz clic o arrastra una pieza para realizar la primera jugada.</p>
                    <span class="text-[10px] text-slate-600">Atajos: ← → repasar jugadas &middot; F girar</span>
                  </div>
                } @else {
                  @for (pair of movePairs(); track pair.num) {
                    <div class="grid grid-cols-[2.75rem_1fr_1fr] items-center rounded-lg py-0.5"
                         [class.bg-[#0c1122]]="pair.num % 2 === 0">
                      <span class="px-2 py-1 text-slate-500 text-[11px]">{{ pair.num }}.</span>
                      <button type="button" (click)="scrubToMove(pair.whiteIndex)"
                              class="text-left px-2.5 py-1 rounded-md hover:bg-[#1c2644] font-semibold"
                              [class.!bg-[#2bb5a0]]="scrubbedMoveIndex() === pair.whiteIndex"
                              [class.!text-[#04141a]]="scrubbedMoveIndex() === pair.whiteIndex">
                        {{ pair.whiteSan }}
                      </button>
                      <button type="button" (click)="scrubToMove(pair.blackIndex)"
                              class="text-left px-2.5 py-1 rounded-md hover:bg-[#1c2644] font-semibold"
                              [class.!bg-[#2bb5a0]]="scrubbedMoveIndex() === pair.blackIndex"
                              [class.!text-[#04141a]]="scrubbedMoveIndex() === pair.blackIndex">
                        {{ pair.blackSan || '' }}
                      </button>
                    </div>
                  }
                }
              </div>

              <!-- Controles del reproductor de jugadas -->
              <div class="grid grid-cols-4 gap-1.5 p-3 border-t border-[#222c4e] bg-[#0c1122]">
                <button type="button" (click)="scrubStart()" title="Inicio (↑)" class="btn btn-ghost !p-2">
                  <app-icon name="chevrons-left" class="w-4 h-4"></app-icon>
                </button>
                <button type="button" (click)="scrubPrev()" title="Anterior (←)" class="btn btn-ghost !p-2">
                  <app-icon name="arrow-left" class="w-4 h-4"></app-icon>
                </button>
                <button type="button" (click)="scrubNext()" title="Siguiente (→)" class="btn btn-ghost !p-2">
                  <app-icon name="arrow-right" class="w-4 h-4"></app-icon>
                </button>
                <button type="button" (click)="scrubLive()" title="En vivo (↓)" class="btn !p-2 !text-xs"
                        [class.btn-primary]="scrubbedMoveIndex() === -1"
                        [class.btn-ghost]="scrubbedMoveIndex() !== -1">
                  <app-icon name="chevrons-right" class="w-4 h-4"></app-icon>
                  <span>Vivo</span>
                </button>
              </div>
            }

            <!-- ===== PESTAÑA 2: CHAT CON MENSAJES RÁPIDOS ===== -->
            @if (activeSideTab() === 'chat') {
              <div class="h-64 xl:h-[calc(100dvh-27rem)] xl:min-h-[17rem] flex flex-col">
                <div class="flex-1 overflow-y-auto p-3 space-y-2">
                  @if (chatMessages().length === 0) {
                    <div class="h-full flex flex-col items-center justify-center text-center text-slate-500 gap-2">
                      <app-icon name="chat" class="w-8 h-8 opacity-50"></app-icon>
                      <span class="text-xs">Usa los botones rápidos de abajo o escribe un saludo deportivo.</span>
                    </div>
                  } @else {
                    @for (msg of chatMessages(); track msg.id) {
                      <div class="surface-2 !rounded-xl px-3 py-2">
                        <div class="flex items-center justify-between mb-0.5">
                          <span class="font-bold text-[#f4b942] text-[11px]">{{ msg.user?.username || 'Jugador' }}</span>
                          <span class="text-[10px] text-slate-500 font-mono">{{ msg.created_at | date:'HH:mm' }}</span>
                        </div>
                        <p class="text-slate-200 break-words text-xs leading-snug">{{ msg.message }}</p>
                      </div>
                    }
                  }
                </div>

                <!-- Botones de cortesía deportiva 1-Click -->
                <div class="px-3 py-1.5 border-t border-[#222c4e] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  @for (preset of quickChatPresets; track preset) {
                    <button type="button" (click)="sendQuickChat(preset)"
                            class="shrink-0 px-2.5 py-1 rounded-lg bg-[#161e36] hover:bg-[#1c2644] border border-[#253159] text-[11px] font-semibold text-slate-300 hover:text-white">
                      {{ preset }}
                    </button>
                  }
                </div>

                <form (ngSubmit)="sendChatMessage()" class="p-2.5 border-t border-[#222c4e] flex gap-2">
                  <input type="text" [(ngModel)]="chatInput" name="chatInput" placeholder="Escribe un mensaje..." class="field !py-2">
                  <button type="submit" [disabled]="!chatInput.trim()" class="btn btn-primary !px-4 !py-2 !text-xs">Enviar</button>
                </form>
              </div>
            }

            <!-- ===== PESTAÑA 3: AJUSTES VISUALES Y EXPORTACIÓN PGN / FEN ===== -->
            @if (activeSideTab() === 'tools') {
              <div class="h-64 xl:h-[calc(100dvh-24rem)] xl:min-h-[20rem] overflow-y-auto p-4 space-y-5">
                <!-- Temas del tablero -->
                <div>
                  <div class="eyebrow mb-2">Acabado del Tablero</div>
                  <div class="grid grid-cols-5 gap-2">
                    @for (t of boardThemes; track t.id) {
                      <button type="button" (click)="setBoardTheme(t.id)"
                              class="opt p-2 flex flex-col items-center gap-1.5"
                              [class.is-active]="boardThemeId() === t.id">
                        <span class="w-8 h-8 rounded-md overflow-hidden grid grid-cols-2 grid-rows-2 border border-white/15">
                          <span [style.background-color]="t.light"></span><span [style.background-color]="t.dark"></span>
                          <span [style.background-color]="t.dark"></span><span [style.background-color]="t.light"></span>
                        </span>
                        <span class="text-[10px] font-bold text-slate-300">{{ t.name }}</span>
                      </button>
                    }
                  </div>
                </div>

                <!-- Opciones de visualización -->
                <div class="space-y-2">
                  <div class="eyebrow mb-1">Asistentes Visuales</div>
                  <button type="button" (click)="showEvalBar.set(!showEvalBar())"
                          class="opt w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-bold">
                    <span>Barra de evaluación en vivo</span>
                    <span class="chip" [class.!text-[#45d4be]]="showEvalBar()">{{ showEvalBar() ? 'Activa' : 'Oculta' }}</span>
                  </button>
                  <button type="button" (click)="showCoords.set(!showCoords())"
                          class="opt w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-bold">
                    <span>Coordenadas algebraicas (a-h, 1-8)</span>
                    <span class="chip" [class.!text-[#45d4be]]="showCoords()">{{ showCoords() ? 'Visibles' : 'Ocultas' }}</span>
                  </button>
                </div>

                <!-- Exportar partida -->
                <div class="space-y-2">
                  <div class="eyebrow mb-1">Exportar para Análisis</div>
                  <div class="grid grid-cols-2 gap-2">
                    <button type="button" (click)="copyFen()" class="btn btn-ghost !py-2.5 !text-xs">
                      <app-icon [name]="copiedFen() ? 'check' : 'copy'" class="w-3.5 h-3.5 text-[#45d4be]"></app-icon>
                      <span>{{ copiedFen() ? '¡FEN copiado!' : 'Copiar FEN' }}</span>
                    </button>
                    <button type="button" (click)="copyPgn()" class="btn btn-ghost !py-2.5 !text-xs">
                      <app-icon [name]="copiedPgn() ? 'check' : 'copy'" class="w-3.5 h-3.5 text-[#f4b942]"></app-icon>
                      <span>{{ copiedPgn() ? '¡PGN copiado!' : 'Copiar PGN' }}</span>
                    </button>
                  </div>
                </div>
              </div>
            }

            <!-- Pie de acciones de partida -->
            <div class="p-3 border-t border-[#222c4e] space-y-2">
              @if (game()?.game_status === 'in_progress' && (isWhitePlayer() || isBlackPlayer())) {
                <div class="grid grid-cols-2 gap-2">
                  <button type="button" (click)="offerDraw()" [disabled]="isOfferingDraw() || hasOutgoingDrawOffer()" class="btn btn-ghost !py-2.5 !text-xs">
                    <app-icon name="handshake" class="w-4 h-4 text-[#f4b942]"></app-icon>
                    <span>{{ hasOutgoingDrawOffer() ? 'Tablas ofrecidas' : (isOfferingDraw() ? 'Enviando...' : 'Ofrecer tablas') }}</span>
                  </button>
                  <button type="button" (click)="confirmResignPrompt()"
                          class="btn !py-2.5 !text-xs bg-red-950/60 border border-red-900/70 text-red-300 hover:bg-red-900/60">
                    <app-icon name="flag" class="w-4 h-4"></app-icon>
                    <span>Rendirse</span>
                  </button>
                </div>
              } @else {
                <a routerLink="/lobby" class="btn btn-primary w-full !py-2.5">
                  <app-icon name="arrow-left" class="w-4 h-4"></app-icon>
                  <span>Volver al Lobby</span>
                </a>
              }
            </div>
          </aside>
        }
      </div>

      <!-- MODAL DE CONFIRMACIÓN DE ABANDONO -->
      @if (showResignModal()) {
        <div class="fixed inset-0 z-[60] bg-black/80 flex items-end sm:items-center justify-center sm:p-4 fade-in">
          <div class="w-full max-w-sm surface !rounded-b-none sm:!rounded-b-[20px] p-6 text-center pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <div class="w-12 h-12 mx-auto mb-3 rounded-2xl bg-red-950/60 border border-red-800/50 flex items-center justify-center text-red-400">
              <app-icon name="flag" class="w-6 h-6"></app-icon>
            </div>
            <h3 class="font-display text-xl font-bold text-white">¿Confirmar abandono?</h3>
            <p class="text-xs text-slate-400 mt-1 mb-5">La victoria se adjudicará a tu oponente y se recalculará el Elo FIDE.</p>
            <div class="grid grid-cols-2 gap-3">
              <button type="button" (click)="showResignModal.set(false)" class="btn btn-ghost">Continuar</button>
              <button type="button" (click)="executeResign()" class="btn bg-red-600 hover:bg-red-500 text-white">Rendirme</button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL DE FIN DE PARTIDA -->
      @if (showGameOverModal()) {
        <div class="fixed inset-0 z-[60] bg-black/85 flex items-end sm:items-center justify-center sm:p-4 fade-in">
          <div class="w-full max-w-md surface !rounded-b-none sm:!rounded-b-[20px] p-6 sm:p-8 text-center pb-[max(1.5rem,env(safe-area-inset-bottom))] relative overflow-hidden">
            <div class="absolute inset-x-0 top-0 h-1.5"
                 [class.bg-[#f4b942]]="isWinner()"
                 [class.bg-slate-400]="isDraw()"
                 [class.bg-red-500]="!isWinner() && !isDraw()"></div>

            <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#161e36] border border-[#28345c] flex items-center justify-center">
              @if (isWinner()) {
                <app-icon name="trophy" class="w-9 h-9 text-[#f4b942]"></app-icon>
              } @else if (isDraw()) {
                <app-icon name="handshake" class="w-9 h-9 text-slate-300"></app-icon>
              } @else {
                <app-icon name="crosshair" class="w-9 h-9 text-red-400"></app-icon>
              }
            </div>

            <div class="eyebrow mb-1">{{ currentOpening().eco }} &middot; {{ currentOpening().name }}</div>
            <h2 class="font-display text-4xl font-extrabold text-white">
              @if (isWinner()) { ¡Victoria! } @else if (isDraw()) { Tablas } @else { Derrota }
            </h2>
            <p class="text-sm text-slate-400 mt-1">{{ gameOverReasonText() }}</p>

            <div class="my-6 p-4 surface-2 grid grid-cols-3 items-center divide-x divide-[#222c4e]">
              <div>
                <div class="eyebrow !text-[10px]">Tu Elo</div>
                <div class="font-mono text-xl font-bold text-white mt-0.5">{{ myRating() }}</div>
              </div>
              <div>
                <div class="eyebrow !text-[10px]">Variación</div>
                <div class="font-display text-2xl font-extrabold mt-0.5"
                     [class.text-[#45d4be]]="isWinner()"
                     [class.text-slate-300]="isDraw()"
                     [class.text-red-400]="!isWinner() && !isDraw()">
                  {{ ratingChangeText() }}
                </div>
              </div>
              <div>
                <div class="eyebrow !text-[10px]">Jugadas</div>
                <div class="font-mono text-xl font-bold text-white mt-0.5">{{ movePairs().length }}</div>
              </div>
            </div>

            <div class="space-y-2">
              <a routerLink="/lobby" class="btn btn-primary w-full !py-3.5">Jugar nueva partida</a>
              <div class="grid grid-cols-2 gap-2">
                <button type="button" (click)="showGameOverModal.set(false)" class="btn btn-ghost !py-2.5 !text-xs">
                  Revisar tablero
                </button>
                <button type="button" (click)="copyPgn()" class="btn btn-ghost !py-2.5 !text-xs">
                  {{ copiedPgn() ? '¡PGN copiado!' : 'Copiar PGN' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class GameComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  gameService = inject(GameService);
  wsService = inject(WebSocketService);
  soundService = inject(SoundService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private ngZone = inject(NgZone);

  private chess = new Chess();

  gameCode = signal<string>('');
  game = signal<Game | null>(null);
  currentFen = signal<string>(this.chess.fen());
  currentTurn = signal<'w' | 'b'>('w');

  whiteTimeMs = signal<number>(180000);
  blackTimeMs = signal<number>(180000);

  orientation = signal<'white' | 'black'>('white');

  selectedSquare = signal<Square | null>(null);
  legalMoves = signal<string[]>([]);
  lastMove = signal<{ from: string; to: string } | null>(null);
  draggedFromSquare: Square | null = null;

  promotionPending = signal<{ from: Square; to: Square } | null>(null);

  movesList = signal<GameMove[]>([]);
  scrubbedMoveIndex = signal<number>(-1);

  chatMessages = signal<GameChatMessage[]>([]);
  chatInput: string = '';
  quickChatPresets = ['¡Buena suerte!', '¡Buena jugada!', '¡Buena partida!', 'Gracias'];
  presenceMembers = signal<PresenceMember[]>([]);

  incomingDrawOffer = signal<boolean>(false);
  isOfferingDraw = signal<boolean>(false);
  showResignModal = signal<boolean>(false);
  showGameOverModal = signal<boolean>(false);
  gameOverPayload = signal<GameOverEventPayload | null>(null);

  zenMode = signal<boolean>(false);
  showEvalBar = signal<boolean>(true);
  showCoords = signal<boolean>(true);
  copiedCode = signal<boolean>(false);
  copiedFen = signal<boolean>(false);
  copiedPgn = signal<boolean>(false);

  private clockInterval: any;
  private syncInterval: any;
  private isSyncing = false;
  private lastTimeoutSyncAt = 0;

  isWhitePlayer = computed(() => {
    const user = this.authService.currentUser();
    const g = this.game();
    return !!user && !!g && Number(g.white_player_id) === Number(user.id);
  });

  isBlackPlayer = computed(() => {
    const user = this.authService.currentUser();
    const g = this.game();
    return !!user && !!g && Number(g.black_player_id) === Number(user.id);
  });

  myColor = computed<'w' | 'b'>(() => {
    if (this.isBlackPlayer()) return 'b';
    if (this.isWhitePlayer()) return 'w';
    return this.orientation() === 'black' ? 'b' : 'w';
  });
  opponentColor = computed<'w' | 'b'>(() => (this.myColor() === 'w' ? 'b' : 'w'));

  bottomPlayer = computed(() => {
    const g = this.game();
    if (!g) return this.authService.currentUser();
    if (this.isWhitePlayer()) return g.white_player || this.authService.currentUser();
    if (this.isBlackPlayer()) return g.black_player || this.authService.currentUser();
    return this.orientation() === 'white' ? g.white_player : g.black_player;
  });

  opponent = computed(() => {
    const g = this.game();
    if (!g) return null;
    if (this.isWhitePlayer()) return g.black_player;
    if (this.isBlackPlayer()) return g.white_player;
    return this.orientation() === 'white' ? g.black_player : g.white_player;
  });

  hasOutgoingDrawOffer = computed(() => {
    const g = this.game();
    const myId = this.authService.currentUser()?.id;
    return !!g && !!myId && !!g.draw_offered_by && Number(g.draw_offered_by) === Number(myId);
  });

  myRating = computed(() => {
    const player = this.bottomPlayer();
    const mode = this.game()?.game_mode?.type || 'blitz';
    return getUserRating(player, mode);
  });

  opponentRating = computed(() => {
    const opp = this.opponent();
    const mode = this.game()?.game_mode?.type || 'blitz';
    return getUserRating(opp, mode);
  });

  myTimeMs = computed(() => (this.myColor() === 'w' ? this.whiteTimeMs() : this.blackTimeMs()));
  opponentTimeMs = computed(() => (this.opponentColor() === 'w' ? this.whiteTimeMs() : this.blackTimeMs()));

  isOpponentConnected = computed(() => {
    const opp = this.opponent();
    if (!opp) return false;
    return this.presenceMembers().some(m => Number(m.id) === Number(opp.id)) || opp.presence_status === 'in_game' || opp.presence_status === 'online';
  });

  myAdvantage = signal<number>(0);
  opponentAdvantage = signal<number>(0);

  activeSideTab = signal<'moves' | 'chat' | 'tools'>('moves');

  boardThemes = [
    { id: 'esmeralda', name: 'Esmeralda', light: '#e4efe9', dark: '#2bb5a0' },
    { id: 'madera', name: 'Torneo', light: '#f0d9b5', dark: '#b58863' },
    { id: 'pizarra', name: 'Ártico', light: '#dfe5f2', dark: '#5e72a3' },
    { id: 'violeta', name: 'Amatista', light: '#ece6ff', dark: '#7c6ae6' },
    { id: 'noche', name: 'Obsidiana', light: '#b8c2dc', dark: '#434e70' },
  ];
  boardThemeId = signal<string>(
    (typeof localStorage !== 'undefined' && localStorage.getItem('boardTheme')) || 'esmeralda'
  );
  boardTheme = computed(() => this.boardThemes.find(t => t.id === this.boardThemeId()) ?? this.boardThemes[0]);

  setBoardTheme(id: string): void {
    this.boardThemeId.set(id);
    try { localStorage.setItem('boardTheme', id); } catch { /* ignore */ }
  }

  isMyTurn = computed(() => this.game()?.game_status === 'in_progress' && this.currentTurn() === this.myColor());

  /** Evaluación posicional + material en tiempo real a partir del FEN actual */
  evalNumber = computed<number>(() => {
    try {
      const c = new Chess(this.currentFen());
      if (c.isCheckmate()) {
        return c.turn() === 'w' ? -99 : 99;
      }
      if (c.isDraw() || c.isStalemate()) return 0;

      const weights: Record<string, number> = { p: 1, n: 3.1, b: 3.25, r: 5, q: 9, k: 0 };
      const centerBonus = new Set(['d4', 'e4', 'd5', 'e5']);
      let score = 0;

      const board = c.board();
      for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
          const cell = board[r][f];
          if (!cell) continue;
          let v = weights[cell.type] || 0;
          if (centerBonus.has(cell.square)) v += 0.2;
          score += cell.color === 'w' ? v : -v;
        }
      }
      if (c.isCheck()) {
        score += c.turn() === 'w' ? -0.4 : 0.4;
      }
      return Math.round(score * 10) / 10;
    } catch {
      return 0;
    }
  });

  evalDisplay = computed<string>(() => {
    const n = this.evalNumber();
    if (Math.abs(n) >= 90) return 'M';
    return (n > 0 ? '+' : '') + n.toFixed(1);
  });

  evalWhitePercent = computed<number>(() => {
    const n = this.evalNumber();
    if (n >= 90) return 96;
    if (n <= -90) return 4;
    const clamped = Math.max(-8, Math.min(8, n));
    return 50 + (clamped / 8) * 44;
  });

  /** Reconocimiento de apertura FIDE / ECO según las jugadas realizadas */
  currentOpening = computed<OpeningInfo>(() => {
    const sanLine = this.movesList().map(m => m.san).join(' ');
    if (!sanLine) {
      return { eco: 'A00', name: 'Posición Inicial FIDE' };
    }
    for (const op of ECO_OPENINGS) {
      if (sanLine.startsWith(op.moves)) {
        return { eco: op.eco, name: op.name };
      }
    }
    return { eco: 'B00', name: 'Juego Abierto' };
  });

  /** Piezas capturadas calculadas a partir del FEN actual */
  captured = computed(() => {
    const start: Record<string, number> = { P: 8, N: 2, B: 2, R: 2, Q: 1 };
    const have: Record<string, number> = {};
    for (const sq of new Chess(this.currentFen()).board().flat()) {
      if (sq) {
        const k = sq.color + sq.type.toUpperCase();
        have[k] = (have[k] || 0) + 1;
      }
    }
    const lost = (c: 'w' | 'b'): string[] =>
      ['Q', 'R', 'B', 'N', 'P'].flatMap(t => Array(Math.max(0, start[t] - (have[c + t] || 0))).fill(c + t));
    return { w: lost('w'), b: lost('b') };
  });
  myCaptures = computed(() => this.captured()[this.opponentColor()]);
  opponentCaptures = computed(() => this.captured()[this.myColor()]);

  boardSquares = computed<BoardSquare[]>(() => {
    const fen = this.currentFen();
    const tempChess = new Chess(fen);
    const squares: BoardSquare[] = [];

    const files = this.orientation() === 'white'
      ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
      : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'];

    const ranks = this.orientation() === 'white'
      ? [8, 7, 6, 5, 4, 3, 2, 1]
      : [1, 2, 3, 4, 5, 6, 7, 8];

    for (const rank of ranks) {
      for (const file of files) {
        const squareName = `${file}${rank}` as Square;
        const fileIdx = file.charCodeAt(0) - 'a'.charCodeAt(0);
        const isLight = (fileIdx + rank) % 2 === 0;

        const piece = tempChess.get(squareName);
        let pieceKey: string | null = null;
        let isPiece = false;
        let pieceColor: 'w' | 'b' | null = null;

        if (piece) {
          isPiece = true;
          pieceColor = piece.color;
          pieceKey = `${piece.color}${piece.type.toUpperCase()}`;
        }

        squares.push({
          square: squareName,
          file,
          rank,
          isLight,
          pieceKey,
          isPiece,
          pieceColor,
        });
      }
    }

    return squares;
  });

  movePairs = computed(() => {
    const list = this.movesList();
    const pairs: Array<{ num: number; whiteSan: string; blackSan?: string; whiteIndex: number; blackIndex: number }> = [];

    for (let i = 0; i < list.length; i += 2) {
      pairs.push({
        num: Math.floor(i / 2) + 1,
        whiteSan: list[i].san,
        blackSan: list[i + 1]?.san,
        whiteIndex: i,
        blackIndex: i + 1,
      });
    }
    return pairs;
  });

  /** Atajos de teclado de análisis y tablero */
  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const tag = (event.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.scrubPrev();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.scrubNext();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.scrubStart();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.scrubLive();
    } else if (event.key.toLowerCase() === 'f') {
      this.toggleOrientation();
    } else if (event.key.toLowerCase() === 'z') {
      this.toggleZenMode();
    }
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const code = params.get('code');
      if (code) {
        this.gameCode.set(code);
        this.loadGameDetails(code);
        this.subscribeToGameWebSocket(code);
      }
    });

    this.ngZone.runOutsideAngular(() => {
      this.clockInterval = setInterval(() => {
        const g = this.game();
        if (g && g.game_status === 'in_progress') {
          this.ngZone.run(() => {
            this.tickClock();
          });
        }
      }, 100);

      // Sincronización reactiva de respaldo cada 2s (garantiza que jugadas, tablas,
      // abandonos y caídas de bandera se actualicen incluso si Reverb está apagado)
      this.syncInterval = setInterval(() => {
        const g = this.game();
        if (g && g.game_status === 'in_progress') {
          this.ngZone.run(() => {
            this.syncGameStateIfOutdated();
          });
        }
      }, 2000);
    });
  }

  ngOnDestroy(): void {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    const code = this.gameCode();
    if (code) {
      this.wsService.leaveGameRoom(code);
    }
  }

  getFideTitle(rating: number): string {
    if (rating >= 2000) return 'GM';
    if (rating >= 1800) return 'IM';
    if (rating >= 1600) return 'FM';
    if (rating >= 1400) return 'CM';
    return 'CLUB';
  }

  getClockPercent(ms: number): number {
    const initialSec = this.game()?.game_mode?.initial_time_seconds || 180;
    const totalMs = initialSec * 1000;
    return Math.max(0, Math.min(100, (ms / totalMs) * 100));
  }

  toggleZenMode(): void {
    this.zenMode.update(v => !v);
  }

  copyRoomCode(): void {
    navigator.clipboard.writeText(this.gameCode()).then(() => {
      this.copiedCode.set(true);
      setTimeout(() => this.copiedCode.set(false), 1800);
    });
  }

  copyFen(): void {
    navigator.clipboard.writeText(this.currentFen()).then(() => {
      this.copiedFen.set(true);
      setTimeout(() => this.copiedFen.set(false), 1800);
    });
  }

  copyPgn(): void {
    const pgn = this.movePairs()
      .map(p => `${p.num}. ${p.whiteSan}${p.blackSan ? ' ' + p.blackSan : ''}`)
      .join(' ');
    navigator.clipboard.writeText(pgn || this.currentFen()).then(() => {
      this.copiedPgn.set(true);
      setTimeout(() => this.copiedPgn.set(false), 1800);
    });
  }

  canDragPiece(sq: BoardSquare): boolean {
    const g = this.game();
    if (!g || g.game_status !== 'in_progress' || this.scrubbedMoveIndex() !== -1) return false;
    if (this.currentTurn() !== this.myColor()) return false;
    return sq.isPiece && sq.pieceColor === this.myColor();
  }

  onDragStart(event: DragEvent, sq: BoardSquare): void {
    if (!this.canDragPiece(sq)) {
      event.preventDefault();
      return;
    }
    this.draggedFromSquare = sq.square;
    this.selectSquare(sq.square);
    event.dataTransfer?.setData('text/plain', sq.square);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(event: DragEvent, targetSq: BoardSquare): void {
    event.preventDefault();
    const from = this.draggedFromSquare;
    this.draggedFromSquare = null;
    if (!from || from === targetSq.square) return;
    if (this.isLegalTarget(targetSq.square)) {
      const movingPiece = this.chess.get(from);
      if (movingPiece && movingPiece.type === 'p') {
        const isPromotionRank = (movingPiece.color === 'w' && targetSq.rank === 8) || (movingPiece.color === 'b' && targetSq.rank === 1);
        if (isPromotionRank) {
          this.promotionPending.set({ from, to: targetSq.square });
          return;
        }
      }
      this.executeMove(from, targetSq.square);
    }
  }

  loadGameDetails(code: string): void {
    this.gameService.getGame(code).subscribe({
      next: (res) => {
        this.game.set(res.game);
        this.currentFen.set(res.game.fen);
        this.currentTurn.set(res.game.current_turn);
        this.chess.load(res.game.fen);

        this.whiteTimeMs.set(res.dynamic_clocks.white_time_left_ms);
        this.blackTimeMs.set(res.dynamic_clocks.black_time_left_ms);

        if (res.game.moves) {
          this.movesList.set(res.game.moves);
          if (res.game.moves.length > 0) {
            const last = res.game.moves[res.game.moves.length - 1];
            this.lastMove.set({ from: last.from_square, to: last.to_square });
          }
        }

        if (res.game.chat_messages) {
          this.chatMessages.set(res.game.chat_messages);
        }

        const userId = this.authService.currentUser()?.id;
        if (userId && Number(res.game.black_player_id) === Number(userId)) {
          this.orientation.set('black');
        } else {
          this.orientation.set('white');
        }

        if (res.game.draw_offered_by && userId && Number(res.game.draw_offered_by) !== Number(userId)) {
          this.incomingDrawOffer.set(true);
        } else {
          this.incomingDrawOffer.set(false);
        }

        this.calculateMaterialAdvantage();

        if (res.game.game_status !== 'in_progress') {
          this.showGameOverModal.set(true);
        }
      },
      error: () => {
        this.router.navigate(['/lobby']);
      }
    });
  }

  subscribeToGameWebSocket(code: string): void {
    this.wsService.joinGameRoom(code, {
      onHere: (members) => {
        this.presenceMembers.set(members);
      },
      onJoining: (member) => {
        this.presenceMembers.update(list => [...list.filter(m => m.id !== member.id), member]);
      },
      onLeaving: (member) => {
        this.presenceMembers.update(list => list.filter(m => m.id !== member.id));
      },
      onMoveMade: (payload: MoveMadeEventPayload) => {
        this.handleMoveMade(payload);
      },
      onGameOver: (payload: GameOverEventPayload) => {
        this.handleGameOver(payload);
      },
      onDrawOffered: (payload: DrawOfferedEventPayload) => {
        if (payload.offered_by !== this.authService.currentUser()?.id) {
          this.incomingDrawOffer.set(true);
          this.soundService.playCheck();
        }
      },
      onChatMessage: (payload: ChatMessageSentEventPayload) => {
        if (!this.chatMessages().some(m => m.id === payload.message.id)) {
          this.chatMessages.update(msgs => [...msgs, payload.message]);
        }
      }
    });
  }

  handleMoveMade(payload: MoveMadeEventPayload): void {
    this.chess.load(payload.fen);
    this.currentFen.set(payload.fen);
    this.currentTurn.set(payload.current_turn);
    this.whiteTimeMs.set(payload.white_time_left_ms);
    this.blackTimeMs.set(payload.black_time_left_ms);
    this.scrubbedMoveIndex.set(-1);

    this.lastMove.set({ from: payload.move.from_square, to: payload.move.to_square });
    this.movesList.update(list => [...list, payload.move]);

    if (this.chess.isCheck()) {
      this.soundService.playCheck();
    } else if (payload.move.captured_piece) {
      this.soundService.playCapture();
    } else {
      this.soundService.playMove();
    }

    this.calculateMaterialAdvantage();
  }

  handleGameOver(payload: GameOverEventPayload): void {
    this.gameOverPayload.set(payload);
    this.game.update(g => g ? { ...g, game_status: 'completed', winner_id: payload.winner_id, end_reason: payload.end_reason } : null);
    this.soundService.playGameOver();
    this.showGameOverModal.set(true);
  }

  onSquareClick(sq: BoardSquare): void {
    const g = this.game();
    if (!g || g.game_status !== 'in_progress') return;
    if (this.scrubbedMoveIndex() !== -1) {
      this.scrubLive();
      return;
    }

    if (this.currentTurn() !== this.myColor()) return;
    if (!this.isWhitePlayer() && !this.isBlackPlayer()) return;

    const selected = this.selectedSquare();

    if (!selected) {
      if (sq.isPiece && sq.pieceColor === this.myColor()) {
        this.selectSquare(sq.square);
      }
      return;
    }

    if (selected === sq.square) {
      this.clearSelection();
      return;
    }

    if (sq.isPiece && sq.pieceColor === this.myColor()) {
      this.selectSquare(sq.square);
      return;
    }

    if (this.isLegalTarget(sq.square)) {
      const movingPiece = this.chess.get(selected);
      if (movingPiece && movingPiece.type === 'p') {
        const isPromotionRank = (movingPiece.color === 'w' && sq.rank === 8) || (movingPiece.color === 'b' && sq.rank === 1);
        if (isPromotionRank) {
          this.promotionPending.set({ from: selected, to: sq.square });
          return;
        }
      }

      this.executeMove(selected, sq.square);
    } else {
      this.clearSelection();
    }
  }

  selectSquare(square: Square): void {
    this.selectedSquare.set(square);
    const moves = this.chess.moves({ square, verbose: true });
    this.legalMoves.set(moves.map(m => m.to));
  }

  clearSelection(): void {
    this.selectedSquare.set(null);
    this.legalMoves.set([]);
  }

  isLegalTarget(square: Square): boolean {
    return this.legalMoves().includes(square);
  }

  completePromotion(pieceSymbol: string): void {
    const promo = this.promotionPending();
    if (!promo) return;

    this.executeMove(promo.from, promo.to, pieceSymbol);
    this.promotionPending.set(null);
  }

  executeMove(from: Square, to: Square, promotion?: string): void {
    try {
      const pieceBefore = this.chess.get(from);
      const moveResult = this.chess.move({
        from,
        to,
        promotion: (promotion as PieceSymbol) || undefined,
      });

      if (!moveResult) return;

      const fenAfter = this.chess.fen();
      this.currentFen.set(fenAfter);
      this.currentTurn.set(this.chess.turn());
      this.lastMove.set({ from, to });
      this.clearSelection();

      if (this.chess.isCheck()) {
        this.soundService.playCheck();
      } else if (moveResult.captured) {
        this.soundService.playCapture();
      } else {
        this.soundService.playMove();
      }

      this.calculateMaterialAdvantage();

      this.gameService.makeMove(this.gameCode(), {
        from,
        to,
        piece: pieceBefore?.type || 'p',
        captured_piece: moveResult.captured || null,
        promotion: promotion || null,
        san: moveResult.san,
        fen: fenAfter,
        is_checkmate: this.chess.isCheckmate(),
        is_stalemate: this.chess.isStalemate(),
        is_draw: this.chess.isDraw(),
      }).subscribe({
        next: (res) => {
          this.game.set(res.game);
          this.whiteTimeMs.set(res.game.white_time_left_ms);
          this.blackTimeMs.set(res.game.black_time_left_ms);
          if (!this.movesList().some(m => m.id === res.move.id)) {
            this.movesList.update(list => [...list, res.move]);
          }
          if (res.game.game_status !== 'in_progress') {
            this.soundService.playGameOver();
            this.showGameOverModal.set(true);
            this.authService.checkAuth();
          }
        },
        error: () => {
          this.loadGameDetails(this.gameCode());
        }
      });
    } catch {
      this.clearSelection();
    }
  }

  private tickClock(): void {
    const g = this.game();
    if (!g || g.game_status !== 'in_progress') return;

    if (this.currentTurn() === 'w') {
      const next = Math.max(0, this.whiteTimeMs() - 100);
      this.whiteTimeMs.set(next);
      if (next === 0 && Date.now() - this.lastTimeoutSyncAt > 1500) {
        this.lastTimeoutSyncAt = Date.now();
        this.syncGameStateIfOutdated();
      }
    } else {
      const next = Math.max(0, this.blackTimeMs() - 100);
      this.blackTimeMs.set(next);
      if (next === 0 && Date.now() - this.lastTimeoutSyncAt > 1500) {
        this.lastTimeoutSyncAt = Date.now();
        this.syncGameStateIfOutdated();
      }
    }
  }

  formatClock(ms: number): string {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    const formattedSecs = secs < 10 ? `0${secs}` : `${secs}`;

    if (totalSeconds < 10) {
      const tenths = Math.floor((ms % 1000) / 100);
      return `00:0${secs}.${tenths}`;
    }

    return `${mins < 10 ? '0' : ''}${mins}:${formattedSecs}`;
  }

  isClockLow(ms: number): boolean {
    return ms < 30000;
  }

  isKingInCheck(sq: BoardSquare): boolean {
    if (!this.chess.isCheck()) return false;
    const turn = this.chess.turn();
    return sq.pieceKey === `${turn}K`;
  }

  isRankLabelVisible(sq: BoardSquare): boolean {
    return this.orientation() === 'white' ? sq.file === 'a' : sq.file === 'h';
  }

  isFileLabelVisible(sq: BoardSquare): boolean {
    return this.orientation() === 'white' ? sq.rank === 1 : sq.rank === 8;
  }

  toggleOrientation(): void {
    this.orientation.update(o => o === 'white' ? 'black' : 'white');
  }

  toggleSound(): void {
    this.soundService.toggleSound();
  }

  calculateMaterialAdvantage(): void {
    const values: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 };
    let whiteScore = 0;
    let blackScore = 0;

    for (let r = 1; r <= 8; r++) {
      for (const f of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
        const piece = this.chess.get(`${f}${r}` as Square);
        if (piece && piece.type !== 'k') {
          const val = values[piece.type] || 0;
          if (piece.color === 'w') whiteScore += val;
          else blackScore += val;
        }
      }
    }

    const diff = whiteScore - blackScore;
    if (this.myColor() === 'w') {
      this.myAdvantage.set(Math.max(0, diff));
      this.opponentAdvantage.set(Math.max(0, -diff));
    } else {
      this.myAdvantage.set(Math.max(0, -diff));
      this.opponentAdvantage.set(Math.max(0, diff));
    }
  }

  scrubToMove(index: number): void {
    const list = this.movesList();
    if (index >= 0 && index < list.length) {
      this.scrubbedMoveIndex.set(index);
      this.currentFen.set(list[index].fen_after);
    }
  }

  scrubStart(): void {
    this.currentFen.set('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    this.scrubbedMoveIndex.set(-2);
  }

  scrubPrev(): void {
    const curr = this.scrubbedMoveIndex();
    if (curr === -1) {
      this.scrubToMove(this.movesList().length - 2);
    } else if (curr > 0) {
      this.scrubToMove(curr - 1);
    } else if (curr === 0) {
      this.scrubStart();
    }
  }

  scrubNext(): void {
    const curr = this.scrubbedMoveIndex();
    const list = this.movesList();
    if (curr === -2) {
      if (list.length > 0) this.scrubToMove(0);
    } else if (curr >= 0 && curr < list.length - 1) {
      this.scrubToMove(curr + 1);
    } else {
      this.scrubLive();
    }
  }

  scrubLive(): void {
    this.scrubbedMoveIndex.set(-1);
    this.currentFen.set(this.chess.fen());
  }

  confirmResignPrompt(): void {
    this.showResignModal.set(true);
  }

  executeResign(): void {
    this.showResignModal.set(false);
    this.gameService.resign(this.gameCode()).subscribe({
      next: (res) => {
        if (res.game) {
          this.game.set(res.game);
        }
        if (res.rating_changes && res.game) {
          this.gameOverPayload.set({
            game_status: 'completed',
            winner_id: res.game.winner_id,
            end_reason: res.game.end_reason || 'resignation',
            white_rating_change: res.rating_changes.white_change,
            black_rating_change: res.rating_changes.black_change,
          });
        }
        this.soundService.playGameOver();
        this.showGameOverModal.set(true);
        this.authService.checkAuth();
      },
      error: () => {
        this.loadGameDetails(this.gameCode());
      }
    });
  }

  offerDraw(): void {
    this.isOfferingDraw.set(true);
    this.gameService.offerDraw(this.gameCode()).subscribe({
      next: (res) => {
        this.isOfferingDraw.set(false);
        if (res.game) {
          this.game.set(res.game);
          if (res.game.game_status !== 'in_progress') {
            this.incomingDrawOffer.set(false);
            this.soundService.playGameOver();
            this.showGameOverModal.set(true);
            this.authService.checkAuth();
          }
        }
      },
      error: () => {
        this.isOfferingDraw.set(false);
      }
    });
  }

  acceptDrawOffer(): void {
    this.incomingDrawOffer.set(false);
    this.gameService.offerDraw(this.gameCode()).subscribe({
      next: (res) => {
        if (res.game) {
          this.game.set(res.game);
          if (res.game.game_status !== 'in_progress') {
            this.soundService.playGameOver();
            this.showGameOverModal.set(true);
            this.authService.checkAuth();
          }
        }
      },
      error: () => {
        this.loadGameDetails(this.gameCode());
      }
    });
  }

  rejectDrawOffer(): void {
    this.incomingDrawOffer.set(false);
    this.gameService.offerDraw(this.gameCode(), { reject: true }).subscribe({
      next: (res) => {
        if (res.game) {
          this.game.set(res.game);
        }
      }
    });
  }

  sendQuickChat(text: string): void {
    this.chatInput = text;
    this.sendChatMessage();
  }

  sendChatMessage(): void {
    const msg = this.chatInput.trim();
    if (!msg) return;

    this.chatInput = '';
    this.gameService.sendChatMessage(this.gameCode(), msg).subscribe({
      next: (res) => {
        if (!this.chatMessages().some(m => m.id === res.chat.id)) {
          this.chatMessages.update(msgs => [...msgs, res.chat]);
        }
      }
    });
  }

  syncGameStateIfOutdated(): void {
    const g = this.game();
    if (!g || g.game_status !== 'in_progress' || this.isSyncing) return;
    const code = this.gameCode();
    if (!code) return;

    this.isSyncing = true;
    this.gameService.getGame(code).subscribe({
      next: (res) => {
        this.isSyncing = false;
        const myId = this.authService.currentUser()?.id;

        // Sincronizar ofertas de tablas entrantes
        if (res.game.draw_offered_by && myId && Number(res.game.draw_offered_by) !== Number(myId)) {
          if (!this.incomingDrawOffer()) {
            this.incomingDrawOffer.set(true);
            this.soundService.playCheck();
          }
        } else {
          this.incomingDrawOffer.set(false);
        }

        // Sincronizar mensajes de chat
        if (res.game.chat_messages && res.game.chat_messages.length !== this.chatMessages().length) {
          this.chatMessages.set(res.game.chat_messages);
        }

        const hasNewMoves = res.game.move_count > this.movesList().length;
        const statusChanged = res.game.game_status !== g.game_status;

        if (hasNewMoves || statusChanged || res.game.draw_offered_by !== g.draw_offered_by) {
          this.game.set(res.game);
        }

        if (hasNewMoves) {
          this.chess.load(res.game.fen);
          this.currentFen.set(res.game.fen);
          this.currentTurn.set(res.game.current_turn);
          this.whiteTimeMs.set(res.dynamic_clocks.white_time_left_ms);
          this.blackTimeMs.set(res.dynamic_clocks.black_time_left_ms);
          this.scrubbedMoveIndex.set(-1);

          if (res.game.moves) {
            this.movesList.set(res.game.moves);
            if (res.game.moves.length > 0) {
              const last = res.game.moves[res.game.moves.length - 1];
              this.lastMove.set({ from: last.from_square, to: last.to_square });
            }
          }

          if (this.chess.isCheck()) {
            this.soundService.playCheck();
          } else {
            this.soundService.playMove();
          }

          this.calculateMaterialAdvantage();
        } else {
          // Mantener relojes sincronizados con el servidor si hay deriva (> 1.5s)
          if (Math.abs(this.whiteTimeMs() - res.dynamic_clocks.white_time_left_ms) > 1500) {
            this.whiteTimeMs.set(res.dynamic_clocks.white_time_left_ms);
          }
          if (Math.abs(this.blackTimeMs() - res.dynamic_clocks.black_time_left_ms) > 1500) {
            this.blackTimeMs.set(res.dynamic_clocks.black_time_left_ms);
          }
        }

        if (statusChanged && res.game.game_status !== 'in_progress') {
          this.whiteTimeMs.set(res.dynamic_clocks.white_time_left_ms);
          this.blackTimeMs.set(res.dynamic_clocks.black_time_left_ms);
          this.soundService.playGameOver();
          this.showGameOverModal.set(true);
          this.authService.checkAuth();
        }
      },
      error: () => {
        this.isSyncing = false;
      }
    });
  }

  isWinner(): boolean {
    const g = this.game();
    const myId = this.authService.currentUser()?.id;
    return !!g && !!myId && Number(g.winner_id) === Number(myId);
  }

  isDraw(): boolean {
    const g = this.game();
    return !!g && g.game_status !== 'in_progress' && g.winner_id === null;
  }

  gameOverReasonText(): string {
    const g = this.game();
    const reason = g?.end_reason || 'Conclusión reglamentaria';
    switch (reason) {
      case 'checkmate': return 'Por Jaque Mate inapelable';
      case 'resignation': return 'Por Abandono de partida';
      case 'timeout': return 'Por Agotamiento del tiempo de reloj';
      case 'draw_agreed':
      case 'draw_agreement': return 'Por Mutuo acuerdo de tablas';
      case 'draw_rule': return 'Por Regla de Tablas FIDE';
      case 'stalemate': return 'Por Rey Ahogado (Tablas)';
      case 'insufficient_material': return 'Por Material insuficiente (Tablas)';
      case 'aborted': return 'Partida anulada / abortada';
      default: return reason;
    }
  }

  ratingChangeText(): string {
    const g = this.game();
    const payload = this.gameOverPayload();
    if (this.isWhitePlayer()) {
      const val = payload?.white_rating_change ?? g?.white_rating_change;
      if (val !== undefined && val !== null) {
        return `${val >= 0 ? '+' : ''}${val} Elo`;
      }
    } else if (this.isBlackPlayer()) {
      const val = payload?.black_rating_change ?? g?.black_rating_change;
      if (val !== undefined && val !== null) {
        return `${val >= 0 ? '+' : ''}${val} Elo`;
      }
    }
    if (this.isWinner()) return '+16 Elo';
    if (this.isDraw()) return '0 Elo';
    return '-16 Elo';
  }
}
