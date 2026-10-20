import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Chess, Square, PieceSymbol, Color } from 'chess.js';
import { AuthService } from '../../core/services/auth.service';
import { GameService } from '../../core/services/game.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { SoundService } from '../../core/services/sound.service';
import { ChessPieceComponent } from '../../shared/components/chess-piece/chess-piece.component';
import {
  Game,
  GameMove,
  GameChatMessage,
  PresenceMember,
  MoveMadeEventPayload,
  GameOverEventPayload,
  DrawOfferedEventPayload,
  ChatMessageSentEventPayload,
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

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ChessPieceComponent],
  template: `
    <div class="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-6 fade-in">
      
      <!-- Banner de Oferta de Tablas Entrante -->
      @if (incomingDrawOffer()) {
        <div class="mb-4 p-3.5 rounded-xl bg-[#2a261c] border border-chess-gold/80 text-amber-200 shadow-xl flex items-center justify-between gap-4 fade-in">
          <div class="flex items-center gap-3">
            <span class="text-xl">🤝</span>
            <div>
              <p class="text-sm font-semibold text-slate-100">Tu rival te ha propuesto tablas</p>
              <p class="text-xs text-amber-300/80">Puedes aceptar para finalizar la partida en empate</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button (click)="acceptDrawOffer()" 
                    class="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow">
              Aceptar Tablas
            </button>
            <button (click)="rejectDrawOffer()" 
                    class="px-3.5 py-1.5 rounded-lg bg-[#38342e] hover:bg-[#454038] text-slate-300 text-xs font-semibold transition-all">
              Rechazar
            </button>
          </div>
        </div>
      }

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <!-- COLUMNA IZQUIERDA: TABLERO DE AJEDREZ & RELOJES (8 columnas en lg) -->
        <div class="lg:col-span-8 flex flex-col items-center">
          
          <div class="w-full max-w-[620px] flex flex-col gap-2">
            
            <!-- TARJETA RIVAL (SUPERIOR) -->
            <div class="chess-card rounded-lg p-2.5 sm:p-3 flex items-center justify-between border border-[#33302c] shadow">
              <div class="flex items-center gap-2.5">
                <div class="relative">
                  <img [src]="opponent()?.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=rival'" 
                       class="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#2a2825] border border-[#44403a]">
                  @if (isOpponentConnected()) {
                    <span class="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#21201d]" title="Conectado"></span>
                  } @else {
                    <span class="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-slate-500 ring-2 ring-[#21201d]" title="Desconectado"></span>
                  }
                </div>
                <div>
                  <div class="flex items-center gap-1.5">
                    <span class="text-sm font-bold text-slate-100">
                      {{ opponent()?.username || 'Esperando rival...' }}
                    </span>
                    <span class="text-[10px] text-chess-gold font-mono font-semibold">
                      {{ opponentRating() }}
                    </span>
                  </div>
                  <!-- Piezas capturadas por el rival -->
                  <div class="flex items-center gap-1 mt-0.5 text-xs text-slate-400">
                    <span class="text-[11px] font-mono tracking-tight">{{ opponentColor() === 'w' ? '⚪ Blancas' : '⚫ Negras' }}</span>
                    @if (opponentAdvantage() > 0) {
                      <span class="text-[10px] font-mono font-bold text-emerald-400 ml-1">+{{ opponentAdvantage() }}</span>
                    }
                  </div>
                </div>
              </div>

              <!-- Reloj del Rival -->
              <div class="px-3.5 py-1.5 rounded-md font-mono text-base sm:text-lg font-bold tracking-wider border transition-all"
                   [class.bg-[#2f2c27]]="currentTurn() === opponentColor()"
                   [class.border-chess-gold]="currentTurn() === opponentColor()"
                   [class.text-slate-100]="currentTurn() === opponentColor()"
                   [class.bg-[#181715]]="currentTurn() !== opponentColor()"
                   [class.border-[#302e2b]]="currentTurn() !== opponentColor()"
                   [class.text-slate-400]="currentTurn() !== opponentColor()"
                   [class.animate-pulse]="isClockLow(opponentTimeMs()) && currentTurn() === opponentColor()">
                {{ formatClock(opponentTimeMs()) }}
              </div>
            </div>

            <!-- TABLERO PRINCIPAL (64 CASILLAS VECTORIALES CON COORDENADAS) -->
            <div class="relative w-full aspect-square rounded-lg shadow-2xl border-4 border-[#2b2824] bg-[#22201d] overflow-hidden select-none">
              
              <div class="grid grid-cols-8 grid-rows-8 w-full h-full">
                @for (sq of boardSquares(); track sq.square) {
                  <div class="relative flex items-center justify-center cursor-pointer transition-colors"
                       [class.bg-[#edeed1]]="sq.isLight"
                       [class.bg-[#779952]]="!sq.isLight"
                       [class.ring-inset]="selectedSquare() === sq.square"
                       [class.ring-4]="selectedSquare() === sq.square"
                       [class.ring-[#baca44]]="selectedSquare() === sq.square"
                       (click)="onSquareClick(sq)">
                    
                    <!-- Resaltado de Último Movimiento -->
                    @if (lastMove() && (lastMove()?.from === sq.square || lastMove()?.to === sq.square)) {
                      <div class="absolute inset-0 bg-[#cdd26a]/50 pointer-events-none"></div>
                    }

                    <!-- Resaltado de Rey en Jaque -->
                    @if (isKingInCheck(sq)) {
                      <div class="absolute inset-0 bg-red-600/60 animate-pulse pointer-events-none rounded-full"></div>
                    }

                    <!-- Coordenadas sutiles en los bordes (FIDE standard) -->
                    @if (isRankLabelVisible(sq)) {
                      <span class="absolute top-0.5 left-1 text-[9px] sm:text-[10px] font-bold font-mono pointer-events-none select-none"
                            [class.text-[#779952]]="sq.isLight"
                            [class.text-[#edeed1]]="!sq.isLight">
                        {{ sq.rank }}
                      </span>
                    }
                    @if (isFileLabelVisible(sq)) {
                      <span class="absolute bottom-0.5 right-1 text-[9px] sm:text-[10px] font-bold font-mono pointer-events-none select-none"
                            [class.text-[#779952]]="sq.isLight"
                            [class.text-[#edeed1]]="!sq.isLight">
                        {{ sq.file }}
                      </span>
                    }

                    <!-- Puntos de sugerencia de movimientos legales -->
                    @if (isLegalTarget(sq.square)) {
                      @if (sq.isPiece) {
                        <!-- Anillo de Captura -->
                        <div class="absolute inset-1 rounded-full border-4 border-[#333333]/30 pointer-events-none"></div>
                      } @else {
                        <!-- Punto de Movimiento silencioso -->
                        <div class="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#202020]/25 pointer-events-none"></div>
                      }
                    }

                    <!-- Pieza de Ajedrez -->
                    @if (sq.pieceKey) {
                      <app-chess-piece [pieceKey]="sq.pieceKey" class="w-full h-full p-0.5 z-10"></app-chess-piece>
                    }

                  </div>
                }
              </div>

              <!-- MODAL DE CORONACIÓN DE PEÓN -->
              @if (promotionPending()) {
                <div class="absolute inset-0 z-30 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 fade-in">
                  <div class="bg-[#24221f] border border-chess-gold rounded-xl p-4 shadow-2xl text-center">
                    <p class="text-xs font-bold text-slate-200 mb-3 uppercase tracking-wider">
                      Elige pieza de coronación
                    </p>
                    <div class="grid grid-cols-4 gap-2">
                      @for (p of ['q', 'n', 'r', 'b']; track p) {
                        <button type="button" 
                                (click)="completePromotion(p)"
                                class="w-14 h-14 bg-[#1b1a18] hover:bg-[#33302b] border border-[#3e3b37] rounded-lg p-1 transition-all transform active:scale-90 flex items-center justify-center shadow">
                          <app-chess-piece [pieceKey]="myColor() + p.toUpperCase()" class="w-full h-full"></app-chess-piece>
                        </button>
                      }
                    </div>
                  </div>
                </div>
              }

            </div>

            <!-- TARJETA JUGADOR LOCAL (INFERIOR) -->
            <div class="chess-card rounded-lg p-2.5 sm:p-3 flex items-center justify-between border border-[#33302c] shadow">
              <div class="flex items-center gap-2.5">
                <div class="relative">
                  <img [src]="authService.currentUser()?.avatar_url" 
                       class="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#2a2825] border border-chess-gold/60 shadow">
                  <span class="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#21201d]"></span>
                </div>
                <div>
                  <div class="flex items-center gap-1.5">
                    <span class="text-sm font-bold text-slate-100">
                      {{ authService.currentUser()?.username }}
                    </span>
                    <span class="text-[10px] text-chess-gold font-mono font-semibold">
                      {{ myRating() }}
                    </span>
                    <span class="text-[9px] bg-chess-gold/15 text-chess-gold px-1 rounded uppercase font-semibold">Tú</span>
                  </div>
                  <div class="flex items-center gap-1 mt-0.5 text-xs text-slate-400">
                    <span class="text-[11px] font-mono tracking-tight">{{ myColor() === 'w' ? '⚪ Blancas' : '⚫ Negras' }}</span>
                    @if (myAdvantage() > 0) {
                      <span class="text-[10px] font-mono font-bold text-emerald-400 ml-1">+{{ myAdvantage() }}</span>
                    }
                  </div>
                </div>
              </div>

              <!-- Reloj del Jugador Local -->
              <div class="px-3.5 py-1.5 rounded-md font-mono text-base sm:text-lg font-bold tracking-wider border transition-all"
                   [class.bg-[#2f2c27]]="currentTurn() === myColor()"
                   [class.border-chess-gold]="currentTurn() === myColor()"
                   [class.text-slate-100]="currentTurn() === myColor()"
                   [class.bg-[#181715]]="currentTurn() !== myColor()"
                   [class.border-[#302e2b]]="currentTurn() !== myColor()"
                   [class.text-slate-400]="currentTurn() !== myColor()"
                   [class.animate-pulse]="isClockLow(myTimeMs()) && currentTurn() === myColor()">
                {{ formatClock(myTimeMs()) }}
              </div>
            </div>

          </div>

        </div>

        <!-- COLUMNA DERECHA: NOTACIÓN, CONTROL & CHAT (4 columnas en lg) -->
        <div class="lg:col-span-4 space-y-4">
          
          <!-- PANEL PRINCIPAL DE PARTIDA -->
          <div class="chess-panel rounded-xl border border-[#363431] p-4 shadow-xl">
            
            <!-- Encabezado con Modo de Juego & Estado -->
            <div class="flex items-center justify-between pb-3 border-b border-[#302e2b]">
              <div>
                <span class="text-xs font-mono text-chess-gold uppercase tracking-wider block">
                  {{ game()?.game_mode?.name || 'Ajedrez Online' }}
                </span>
                <span class="text-sm font-bold text-slate-100">
                  @if (game()?.game_status === 'in_progress') {
                    <span class="text-emerald-400">&bull; Partida en curso</span>
                  } @else if (game()?.game_status === 'completed') {
                    <span class="text-chess-gold">&bull; Partida Concluida</span>
                  } @else {
                    <span class="text-slate-400">&bull; Esperando inicio</span>
                  }
                </span>
              </div>

              <!-- Botones de Utilidad -->
              <div class="flex items-center gap-1.5">
                <button type="button" 
                        (click)="toggleOrientation()" 
                        title="Invertir Tablero"
                        class="p-1.5 rounded bg-[#262421] hover:bg-[#33302c] border border-[#3e3b37] text-slate-300 transition-colors">
                  🔄
                </button>
                <button type="button" 
                        (click)="toggleSound()" 
                        title="Activar / Silenciar Sonido"
                        class="p-1.5 rounded bg-[#262421] hover:bg-[#33302c] border border-[#3e3b37] text-slate-300 transition-colors">
                  {{ soundService.isSoundEnabled() ? '🔊' : '🔇' }}
                </button>
              </div>
            </div>

            <!-- REGISTRO DE MOVIMIENTOS (SAN NOTATION) -->
            <div class="mt-3">
              <div class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Jugadas Realizadas ({{ movesList().length }})</span>
                <span class="font-mono text-slate-500">SAN FIDE</span>
              </div>

              <div class="h-44 overflow-y-auto bg-[#181715] rounded-lg p-2 border border-[#302e2b] text-xs font-mono space-y-1">
                @if (movePairs().length === 0) {
                  <div class="text-slate-500 text-center py-8 italic">
                    Aún no se han efectuado movimientos
                  </div>
                } @else {
                  <div class="grid grid-cols-12 gap-1 py-0.5 text-slate-400 font-semibold border-b border-[#2a2825] pb-1 mb-1">
                    <span class="col-span-2">#</span>
                    <span class="col-span-5">Blancas</span>
                    <span class="col-span-5">Negras</span>
                  </div>
                  @for (pair of movePairs(); track pair.num) {
                    <div class="grid grid-cols-12 gap-1 py-0.5 text-slate-300 hover:bg-[#22201d] rounded px-1">
                      <span class="col-span-2 text-slate-500">{{ pair.num }}.</span>
                      <span class="col-span-5 cursor-pointer hover:text-chess-gold transition-colors"
                            [class.text-chess-gold]="scrubbedMoveIndex() === pair.whiteIndex"
                            (click)="scrubToMove(pair.whiteIndex)">
                        {{ pair.whiteSan }}
                      </span>
                      <span class="col-span-5 cursor-pointer hover:text-chess-gold transition-colors"
                            [class.text-chess-gold]="scrubbedMoveIndex() === pair.blackIndex"
                            (click)="scrubToMove(pair.blackIndex)">
                        {{ pair.blackSan || '' }}
                      </span>
                    </div>
                  }
                }
              </div>

              <!-- Botones de Navegación del Historial (Scrubber) -->
              <div class="flex items-center justify-center gap-1.5 mt-2">
                <button type="button" (click)="scrubStart()" class="px-2 py-1 bg-[#24221f] hover:bg-[#2e2c28] border border-[#383531] rounded text-xs text-slate-300">
                  |&lt;&lt;
                </button>
                <button type="button" (click)="scrubPrev()" class="px-3 py-1 bg-[#24221f] hover:bg-[#2e2c28] border border-[#383531] rounded text-xs text-slate-300">
                  &lt;
                </button>
                <button type="button" (click)="scrubNext()" class="px-3 py-1 bg-[#24221f] hover:bg-[#2e2c28] border border-[#383531] rounded text-xs text-slate-300">
                  &gt;
                </button>
                <button type="button" (click)="scrubLive()" class="px-2 py-1 bg-[#24221f] hover:bg-[#2e2c28] border border-[#383531] rounded text-xs text-slate-300"
                        [class.border-chess-gold]="scrubbedMoveIndex() === -1">
                  &gt;&gt;| En vivo
                </button>
              </div>
            </div>

            <!-- BOTONES DE ACCIÓN (TABLAS / ABANDONAR) -->
            @if (game()?.game_status === 'in_progress') {
              <div class="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[#302e2b]">
                <button type="button" 
                        (click)="offerDraw()"
                        [disabled]="isOfferingDraw()"
                        class="py-2 px-3 rounded-lg bg-[#272522] hover:bg-[#302e2a] border border-[#3d3a35] text-slate-300 hover:text-white text-xs font-semibold transition-all">
                  🤝 Ofrecer Tablas
                </button>
                <button type="button" 
                        (click)="confirmResignPrompt()"
                        class="py-2 px-3 rounded-lg bg-[#2f2222] hover:bg-[#3a2828] border border-red-900/60 text-red-300 hover:text-red-200 text-xs font-semibold transition-all">
                  🏳️ Rendirse
                </button>
              </div>
            } @else {
              <div class="mt-4 pt-3 border-t border-[#302e2b]">
                <a routerLink="/lobby" 
                   class="w-full py-2.5 px-4 rounded-lg bg-chess-primary hover:bg-chess-primaryHover text-white text-xs font-bold transition-all shadow flex items-center justify-center gap-2">
                  <span>← Volver al Lobby de Salas</span>
                </a>
              </div>
            }

          </div>

          <!-- CHAT EN TIEMPO REAL DENTRO DE LA PARTIDA -->
          <div class="chess-panel rounded-xl border border-[#363431] p-4 shadow-xl flex flex-col h-64">
            <div class="flex items-center justify-between pb-2 border-b border-[#302e2b] mb-2">
              <span class="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <span>💬 Chat de la Sala</span>
              </span>
              <span class="text-[10px] text-slate-500 font-mono">
                {{ chatMessages().length }} mensajes
              </span>
            </div>

            <!-- Lista de Mensajes -->
            <div class="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
              @if (chatMessages().length === 0) {
                <div class="text-slate-500 text-center py-10 italic text-[11px]">
                  Envía un saludo a tu oponente
                </div>
              } @else {
                @for (msg of chatMessages(); track msg.id) {
                  <div class="p-2 rounded-lg bg-[#1c1b18] border border-[#2e2c28]">
                    <div class="flex items-center justify-between mb-0.5">
                      <span class="font-bold text-chess-gold text-[11px]">
                        {{ msg.user?.username || 'Jugador' }}
                      </span>
                      <span class="text-[9px] text-slate-500 font-mono">
                        {{ msg.created_at | date:'HH:mm' }}
                      </span>
                    </div>
                    <p class="text-slate-200 break-words leading-tight text-xs">
                      {{ msg.message }}
                    </p>
                  </div>
                }
              }
            </div>

            <!-- Input de Envío -->
            <form (ngSubmit)="sendChatMessage()" class="mt-2 flex gap-1.5">
              <input type="text" 
                     [(ngModel)]="chatInput" 
                     name="chatInput"
                     placeholder="Escribe un mensaje..."
                     class="flex-1 bg-[#181715] border border-[#383531] rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-chess-gold/80 transition-colors">
              <button type="submit" 
                      [disabled]="!chatInput.trim()"
                      class="px-3 py-1.5 rounded-lg bg-chess-primary hover:bg-chess-primaryHover disabled:opacity-40 text-white text-xs font-bold transition-all shadow">
                Enviar
              </button>
            </form>
          </div>

        </div>

      </div>

      <!-- MODAL DE CONFIRMACIÓN DE ABANDONO -->
      @if (showResignModal()) {
        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 fade-in">
          <div class="w-full max-w-sm bg-[#21201d] border border-red-900/80 rounded-xl shadow-2xl p-6 text-center">
            <span class="text-4xl block mb-2">🏳️</span>
            <h3 class="text-lg font-bold text-slate-100">¿Deseas rendirte?</h3>
            <p class="text-xs text-slate-400 mt-1 mb-5">
              La victoria será otorgada inmediatamente a tu rival y se ajustará la puntuación Elo correspondiente.
            </p>
            <div class="grid grid-cols-2 gap-3">
              <button type="button" 
                      (click)="showResignModal.set(false)"
                      class="py-2 rounded-lg bg-[#2e2b27] hover:bg-[#38342f] text-slate-200 text-xs font-semibold">
                Cancelar
              </button>
              <button type="button" 
                      (click)="executeResign()"
                      class="py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white text-xs font-bold shadow">
                Sí, Rendirse
              </button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL DE FINAL DE PARTIDA -->
      @if (showGameOverModal()) {
        <div class="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 fade-in">
          <div class="w-full max-w-md bg-[#21201d] border border-chess-gold/80 rounded-2xl shadow-2xl p-6 sm:p-7 text-center">
            
            <div class="w-16 h-16 mx-auto mb-3 rounded-full bg-[#2a2824] border-2 border-chess-gold flex items-center justify-center text-3xl shadow-inner">
              @if (isWinner()) {
                🏆
              } @else if (isDraw()) {
                🤝
              } @else {
                ♟️
              }
            </div>

            <h2 class="text-2xl font-bold text-slate-100 tracking-tight">
              @if (isWinner()) {
                ¡Victoria Magistral!
              } @else if (isDraw()) {
                Partida en Tablas
              } @else {
                Derrota
              }
            </h2>

            <p class="text-sm text-slate-300 mt-1">
              {{ gameOverReasonText() }}
            </p>

            <!-- Variación de Elo -->
            <div class="my-5 p-3 rounded-xl bg-[#181715] border border-[#363431] flex items-center justify-around">
              <div>
                <span class="text-[10px] text-slate-400 uppercase tracking-widest block">Tu Elo</span>
                <span class="text-base font-bold font-mono text-slate-200">
                  {{ myRating() }}
                </span>
              </div>
              <div class="text-2xl font-bold font-mono"
                   [class.text-emerald-400]="isWinner()"
                   [class.text-slate-400]="isDraw()"
                   [class.text-red-400]="!isWinner() && !isDraw()">
                {{ ratingChangeText() }}
              </div>
            </div>

            <!-- Botones Finales -->
            <div class="space-y-2">
              <a routerLink="/lobby" 
                 class="w-full py-3 rounded-xl bg-chess-primary hover:bg-chess-primaryHover text-white font-bold text-sm shadow transition-all block">
                Regresar a la Sala Principal
              </a>
              <button type="button" 
                      (click)="showGameOverModal.set(false)"
                      class="w-full py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors">
                Examinar el tablero final
              </button>
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

  // Instancia autoritativa de ajedrez chess.js
  private chess = new Chess();

  gameCode = signal<string>('');
  game = signal<Game | null>(null);
  currentFen = signal<string>(this.chess.fen());
  currentTurn = signal<'w' | 'b'>('w');

  // Relojes en milisegundos
  whiteTimeMs = signal<number>(180000);
  blackTimeMs = signal<number>(180000);

  // Orientación del tablero ('white' abajo o 'black' abajo)
  orientation = signal<'white' | 'black'>('white');

  // Interacción de casillas
  selectedSquare = signal<Square | null>(null);
  legalMoves = signal<string[]>([]);
  lastMove = signal<{ from: string; to: string } | null>(null);

  // Coronación de peón pendiente
  promotionPending = signal<{ from: Square; to: Square } | null>(null);

  // Notación de movimientos
  movesList = signal<GameMove[]>([]);
  scrubbedMoveIndex = signal<number>(-1);

  // Chat y presencia
  chatMessages = signal<GameChatMessage[]>([]);
  chatInput: string = '';
  presenceMembers = signal<PresenceMember[]>([]);

  // Estados de modales
  incomingDrawOffer = signal<boolean>(false);
  isOfferingDraw = signal<boolean>(false);
  showResignModal = signal<boolean>(false);
  showGameOverModal = signal<boolean>(false);
  gameOverPayload = signal<GameOverEventPayload | null>(null);

  private clockInterval: any;

  // Determinar rol del jugador actual
  isWhitePlayer = computed(() => {
    const user = this.authService.currentUser();
    const g = this.game();
    return user && g && g.white_player_id === user.id;
  });

  isBlackPlayer = computed(() => {
    const user = this.authService.currentUser();
    const g = this.game();
    return user && g && g.black_player_id === user.id;
  });

  myColor = computed<'w' | 'b'>(() => {
    return this.isBlackPlayer() ? 'b' : 'w';
  });

  opponentColor = computed<'w' | 'b'>(() => {
    return this.myColor() === 'w' ? 'b' : 'w';
  });

  opponent = computed(() => {
    const g = this.game();
    if (!g) return null;
    return this.isWhitePlayer() ? g.black_player : g.white_player;
  });

  myRating = computed(() => {
    return 1200; // Elo base por defecto
  });

  opponentRating = computed(() => {
    return 1200;
  });

  myTimeMs = computed(() => {
    return this.myColor() === 'w' ? this.whiteTimeMs() : this.blackTimeMs();
  });

  opponentTimeMs = computed(() => {
    return this.opponentColor() === 'w' ? this.whiteTimeMs() : this.blackTimeMs();
  });

  isOpponentConnected = computed(() => {
    const opp = this.opponent();
    if (!opp) return false;
    return this.presenceMembers().some(m => m.id === opp.id);
  });

  // Ventaja material (+1, +3, etc.)
  myAdvantage = signal<number>(0);
  opponentAdvantage = signal<number>(0);

  // Cuadrícula 8x8 calculada según la orientación activa
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
          pieceColor
        });
      }
    }

    return squares;
  });

  // Lista de jugadas agrupadas en pares (1. e4 e5)
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

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const code = params.get('code');
      if (code) {
        this.gameCode.set(code);
        this.loadGameDetails(code);
        this.subscribeToGameWebSocket(code);
      }
    });

    // Reloj local de 100ms para decrementar el tiempo del turno activo fluidamente
    this.clockInterval = setInterval(() => {
      this.tickClock();
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
    const code = this.gameCode();
    if (code) {
      this.wsService.leaveGameRoom(code);
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

        // Orientar tablero automáticamente según el bando del usuario
        const userId = this.authService.currentUser()?.id;
        if (userId && res.game.black_player_id === userId) {
          this.orientation.set('black');
        } else {
          this.orientation.set('white');
        }

        this.calculateMaterialAdvantage();

        // Si la partida ya estaba completada al ingresar
        if (res.game.game_status === 'completed') {
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
        this.chatMessages.update(msgs => [...msgs, payload.message]);
      }
    });
  }

  handleMoveMade(payload: MoveMadeEventPayload): void {
    this.chess.load(payload.fen);
    this.currentFen.set(payload.fen);
    this.currentTurn.set(payload.current_turn);
    this.whiteTimeMs.set(payload.white_time_left_ms);
    this.blackTimeMs.set(payload.black_time_left_ms);

    this.lastMove.set({ from: payload.move.from_square, to: payload.move.to_square });
    this.movesList.update(list => [...list, payload.move]);

    // Sonidos acústicos según el resultado de la jugada
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

  // Lógica de casillas e interacción del usuario
  onSquareClick(sq: BoardSquare): void {
    const g = this.game();
    if (!g || g.game_status !== 'in_progress') return;

    // Solo mover si es el turno del jugador y este es participante activo
    if (this.currentTurn() !== this.myColor()) return;
    if (!this.isWhitePlayer() && !this.isBlackPlayer()) return;

    const selected = this.selectedSquare();

    // 1. Si no hay casilla seleccionada: seleccionar solo pieza propia
    if (!selected) {
      if (sq.isPiece && sq.pieceColor === this.myColor()) {
        this.selectSquare(sq.square);
      }
      return;
    }

    // 2. Si se hace click en la misma casilla: deseleccionar
    if (selected === sq.square) {
      this.clearSelection();
      return;
    }

    // 3. Si se hace click en otra pieza propia: cambiar selección
    if (sq.isPiece && sq.pieceColor === this.myColor()) {
      this.selectSquare(sq.square);
      return;
    }

    // 4. Si se hace click en una casilla destino válida
    if (this.isLegalTarget(sq.square)) {
      // Verificar si es coronación de peón
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

      // Sonido inmediato optimista
      if (this.chess.isCheck()) {
        this.soundService.playCheck();
      } else if (moveResult.captured) {
        this.soundService.playCapture();
      } else {
        this.soundService.playMove();
      }

      // Enviar jugada al servidor con validación autoritativa
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
          this.whiteTimeMs.set(res.game.white_time_left_ms);
          this.blackTimeMs.set(res.game.black_time_left_ms);
          this.movesList.update(list => [...list, res.move]);
        },
        error: (err) => {
          // Revertir en caso de desincronización
          this.loadGameDetails(this.gameCode());
        }
      });
    } catch (e) {
      this.clearSelection();
    }
  }

  // Tictac del reloj en milisegundos
  private tickClock(): void {
    const g = this.game();
    if (!g || g.game_status !== 'in_progress') return;

    if (this.currentTurn() === 'w') {
      this.whiteTimeMs.update(t => Math.max(0, t - 100));
    } else {
      this.blackTimeMs.update(t => Math.max(0, t - 100));
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

  // Resaltado de rey bajo jaque
  isKingInCheck(sq: BoardSquare): boolean {
    if (!this.chess.isCheck()) return false;
    const turn = this.chess.turn();
    return sq.pieceKey === `${turn}K`;
  }

  // Etiquetas de coordenadas en casillas limítrofes
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

  // Ventaja de material
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

  // Navegación de jugadas (Scrubber)
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

  // Acciones de partida
  confirmResignPrompt(): void {
    this.showResignModal.set(true);
  }

  executeResign(): void {
    this.showResignModal.set(false);
    this.gameService.resign(this.gameCode()).subscribe();
  }

  offerDraw(): void {
    this.isOfferingDraw.set(true);
    this.gameService.offerDraw(this.gameCode()).subscribe({
      next: () => {
        this.isOfferingDraw.set(false);
      },
      error: () => {
        this.isOfferingDraw.set(false);
      }
    });
  }

  acceptDrawOffer(): void {
    this.incomingDrawOffer.set(false);
    this.gameService.offerDraw(this.gameCode()).subscribe();
  }

  rejectDrawOffer(): void {
    this.incomingDrawOffer.set(false);
  }

  sendChatMessage(): void {
    const msg = this.chatInput.trim();
    if (!msg) return;

    this.chatInput = '';
    this.gameService.sendChatMessage(this.gameCode(), msg).subscribe();
  }

  // Modales y textos de fin de partida
  isWinner(): boolean {
    const g = this.game();
    const myId = this.authService.currentUser()?.id;
    return !!g && !!myId && g.winner_id === myId;
  }

  isDraw(): boolean {
    const g = this.game();
    return !!g && g.game_status === 'completed' && g.winner_id === null;
  }

  gameOverReasonText(): string {
    const g = this.game();
    const reason = g?.end_reason || 'Conclusión reglamentaria';
    switch (reason) {
      case 'checkmate': return 'Por Jaque Mate inapelable';
      case 'resignation': return 'Por Abandono del rival';
      case 'timeout': return 'Por Agotamiento del tiempo de reloj';
      case 'draw_agreement': return 'Por Mutuo acuerdo de tablas';
      case 'stalemate': return 'Por Rey Ahogado (Tablas)';
      case 'insufficient_material': return 'Por Material insuficiente (Tablas)';
      default: return reason;
    }
  }

  ratingChangeText(): string {
    if (this.isWinner()) return '+16';
    if (this.isDraw()) return '+0';
    return '-16';
  }
}
