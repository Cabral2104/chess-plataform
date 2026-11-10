import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Chess } from 'chess.js';
import { GameService } from '../../core/services/game.service';
import { AuthService } from '../../core/services/auth.service';
import { GameChallenge, Game, getUserRating } from '../../core/models';
import { IconComponent, IconName } from '../../shared/components/icon/icon.component';
import { ChessPieceComponent } from '../../shared/components/chess-piece/chess-piece.component';

interface MiniSquare {
  isLight: boolean;
  pieceKey: string | null;
}

@Component({
  selector: 'app-challenges',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, IconComponent, ChessPieceComponent],
  template: `
    <div class="page fade-in">

      <!-- Cabecera -->
      <header class="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-5">
        <div>
          <div class="eyebrow mb-1.5">Comunidad en Tiempo Real</div>
          <h1 class="font-display text-3xl sm:text-5xl font-extrabold text-white leading-[1.05] flex items-center gap-3">
            <span>Salas y Chess TV</span>
            <span class="w-2.5 h-2.5 rounded-full bg-[#2bb5a0] animate-pulse"></span>
          </h1>
          <p class="text-sm text-slate-400 mt-1.5 max-w-xl">
            Desafía a jugadores esperando en sala, ingresa con código de invitación o sintoniza tableros en directo.
          </p>
        </div>
        <div class="grid grid-cols-2 gap-2 md:flex shrink-0">
          <button (click)="refreshAll()" class="btn btn-ghost !py-2.5 !text-xs">
            <app-icon name="refresh" class="w-4 h-4"></app-icon>
            <span>Actualizar</span>
          </button>
          <a routerLink="/lobby" class="btn btn-primary !py-2.5 !text-xs">
            <app-icon name="plus" class="w-4 h-4"></app-icon>
            <span>Crear Sala</span>
          </a>
        </div>
      </header>

      <!-- Barra de Pestañas + Buscador -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-6 border-b border-[#222c4e]">
        <div class="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-3.5 px-3.5 sm:mx-0 sm:px-0">
          <button type="button" (click)="activeTab.set('public')"
                  class="opt shrink-0 px-4 py-2.5 text-xs font-bold flex items-center gap-2"
                  [class.is-active]="activeTab() === 'public'">
            <app-icon name="swords" class="w-4 h-4 text-[#45d4be]"></app-icon>
            <span>Retos Abiertos</span>
            <span class="px-1.5 py-0.2 rounded-md text-[10px] font-mono bg-[#0b1020]">{{ filteredChallenges().length }}</span>
          </button>

          <button type="button" (click)="activeTab.set('live')"
                  class="opt shrink-0 px-4 py-2.5 text-xs font-bold flex items-center gap-2"
                  [class.is-active]="activeTab() === 'live'">
            <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span>Chess TV en Vivo</span>
            <span class="px-1.5 py-0.2 rounded-md text-[10px] font-mono bg-[#0b1020]">{{ activeGames().length }}</span>
          </button>

          <button type="button" (click)="activeTab.set('private')"
                  class="opt shrink-0 px-4 py-2.5 text-xs font-bold flex items-center gap-2"
                  [class.is-active-gold]="activeTab() === 'private'">
            <svg class="w-4 h-4 text-[#f4b942]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
            <span>Código Privado</span>
          </button>
        </div>

        @if (activeTab() === 'public') {
          <div class="w-full sm:w-64">
            <input type="text"
                   [(ngModel)]="searchQuery"
                   placeholder="Buscar jugador o ritmo..."
                   class="field !py-2 !text-xs">
          </div>
        }
      </div>

      <!-- ===== PESTAÑA 1: RETOS ABIERTOS ===== -->
      @if (activeTab() === 'public') {
        <div class="flex items-center gap-2 mb-5 overflow-x-auto no-scrollbar -mx-3.5 px-3.5 sm:mx-0 sm:px-0">
          @for (filter of ['all', 'blitz', 'rapid', 'bullet']; track filter) {
            <button type="button" (click)="selectedModeFilter.set(filter)"
                    class="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold capitalize border"
                    [class.bg-[#2bb5a0]]="selectedModeFilter() === filter"
                    [class.text-[#04141a]]="selectedModeFilter() === filter"
                    [class.border-[#2bb5a0]]="selectedModeFilter() === filter"
                    [class.border-[#222c4e]]="selectedModeFilter() !== filter"
                    [class.text-slate-300]="selectedModeFilter() !== filter">
              {{ filter === 'all' ? 'Todos los ritmos' : filter }}
            </button>
          }
        </div>

        @if (isLoadingChallenges()) {
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            @for (i of [1,2,3,4,5,6]; track i) {
              <div class="h-44 surface animate-pulse"></div>
            }
          </div>
        } @else if (filteredChallenges().length === 0) {
          <div class="surface p-10 sm:p-14 text-center">
            <app-icon name="swords" class="w-10 h-10 mx-auto text-slate-500 mb-3"></app-icon>
            <h3 class="font-display text-xl font-bold text-white">No hay retos abiertos con este filtro</h3>
            <p class="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
              Sé el primero en abrir una sala pública para que cualquier jugador conectado acepte tu desafío.
            </p>
            <a routerLink="/lobby" class="btn btn-primary mt-6">
              <app-icon name="plus" class="w-4 h-4"></app-icon>
              <span>Crear reto abierto</span>
            </a>
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            @for (chal of filteredChallenges(); track chal.id) {
              <article class="surface p-5 flex flex-col justify-between gap-4 hover:border-[#334272]">
                <div class="flex items-start justify-between gap-3">
                  <div class="flex items-center gap-3 min-w-0">
                    <img [src]="chal.challenger?.avatar_url"
                         [alt]="chal.challenger?.username"
                         class="w-11 h-11 rounded-xl bg-[#161e36] ring-1 ring-[#2a3660] shrink-0">
                    <div class="min-w-0">
                      <div class="flex items-center gap-1.5">
                        <span class="fide-badge !px-1 !py-0 !text-[9px]">{{ getFideTitle(getPlayerElo(chal)) }}</span>
                        <span class="text-sm font-bold text-white truncate">{{ chal.challenger?.username }}</span>
                      </div>
                      <div class="flex items-center gap-2 mt-0.5">
                        <span class="text-xs text-[#f4b942] font-mono font-bold">{{ getPlayerElo(chal) }} Elo</span>
                        <span class="text-[10px] font-mono text-slate-400">({{ getEloDiffLabel(chal) }})</span>
                      </div>
                    </div>
                  </div>
                  <span class="chip shrink-0" [class.!text-[#f4b942]]="chal.is_rated">
                    {{ chal.is_rated ? 'Rankeada' : 'Amistosa' }}
                  </span>
                </div>

                <!-- Especificación técnica del reto -->
                <div class="surface-2 p-3.5 flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl bg-[#0d1221] border border-[#222c4e] flex items-center justify-center text-[#45d4be]">
                      <app-icon [name]="getModeIcon(chal.game_mode?.type)" class="w-5 h-5"></app-icon>
                    </div>
                    <div>
                      <div class="font-display text-2xl font-extrabold text-white leading-none">
                        {{ (chal.game_mode?.initial_time_seconds || 180) / 60 }}<span class="text-[#45d4be]">+{{ chal.game_mode?.increment_seconds || 0 }}</span>
                      </div>
                      <div class="text-[11px] text-slate-400 mt-1 font-semibold">{{ chal.game_mode?.name }}</div>
                    </div>
                  </div>

                  <div class="text-right">
                    <span class="eyebrow !text-[9px] block">Rival juega</span>
                    <div class="inline-flex items-center gap-1.5 text-xs font-bold text-white mt-0.5">
                      @if (chal.color_preference === 'white') {
                        <span class="w-3.5 h-3.5 rounded-full bg-white border border-slate-300"></span>Blancas
                      } @else if (chal.color_preference === 'black') {
                        <span class="w-3.5 h-3.5 rounded-full bg-[#0d1221] border border-[#4a5a8f]"></span>Negras
                      } @else {
                        <span class="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-white to-[#0d1221]"></span>Azar
                      }
                    </div>
                  </div>
                </div>

                @if (chal.challenger_id === authService.currentUser()?.id) {
                  <div class="flex items-center justify-between gap-2 pt-1">
                    <span class="text-xs text-[#f4b942] flex items-center gap-1.5 font-semibold">
                      <app-icon name="hourglass" class="w-4 h-4 animate-spin"></app-icon>
                      <span>Tu reto (#{{ chal.code }})</span>
                    </span>
                    <button (click)="cancelMyChallenge(chal.code)" class="btn btn-ghost !py-2 !px-3.5 !text-xs hover:!text-red-400">
                      Cancelar
                    </button>
                  </div>
                } @else {
                  <button (click)="acceptChallenge(chal.code)"
                          [disabled]="isAcceptingCode() === chal.code"
                          class="btn btn-primary w-full !py-2.5">
                    @if (isAcceptingCode() === chal.code) {
                      <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                      </svg>
                      <span>Entrando a la arena...</span>
                    } @else {
                      <app-icon name="swords" class="w-4 h-4"></app-icon>
                      <span>Aceptar Desafío</span>
                    }
                  </button>
                }
              </article>
            }
          </div>
        }
      }

      <!-- ===== PESTAÑA 2: CHESS TV CON MINI-TABLEROS EN VIVO ===== -->
      @if (activeTab() === 'live') {
        @if (isLoadingGames()) {
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            @for (i of [1,2,3]; track i) {
              <div class="h-72 surface animate-pulse"></div>
            }
          </div>
        } @else if (activeGames().length === 0) {
          <div class="surface p-10 sm:p-14 text-center">
            <app-icon name="board" class="w-10 h-10 mx-auto text-slate-500 mb-3"></app-icon>
            <h3 class="font-display text-xl font-bold text-white">No hay emisiones en directo ahora mismo</h3>
            <p class="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
              En cuanto dos jugadores inicien una partida, verás su tablero en tiempo real aquí.
            </p>
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            @for (game of activeGames(); track game.id) {
              <article class="surface p-4 flex flex-col gap-3.5 hover:border-[#334272]">
                <div class="flex items-center justify-between">
                  <span class="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-red-400 font-mono">
                    <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    <span>En Directo &middot; Jugada #{{ game.move_count }}</span>
                  </span>
                  <span class="chip !text-[#f4b942]">{{ game.game_mode?.name }}</span>
                </div>

                <!-- Jugador Negras (arriba del mini-tablero) -->
                <div class="flex items-center justify-between px-1 text-xs">
                  <div class="flex items-center gap-2 min-w-0">
                    <span class="w-3 h-3 rounded-full bg-[#0d1221] border border-[#4a5a8f] shrink-0"></span>
                    <span class="font-bold text-slate-200 truncate">{{ game.black_player?.username }}</span>
                  </div>
                  <span class="font-mono text-[#f4b942] font-bold">{{ getPlayerEloDirect(game.black_player, game.game_mode?.type) }}</span>
                </div>

                <!-- MINI-TABLERO EN TIEMPO REAL RENDERIZADO DESDE EL FEN -->
                <a [routerLink]="['/game', game.code]"
                   class="block w-48 h-48 sm:w-52 sm:h-52 mx-auto rounded-xl overflow-hidden border-2 border-[#28345c] shadow-lg group relative">
                  <div class="grid grid-cols-8 grid-rows-8 w-full h-full">
                    @for (sq of getMiniBoard(game.fen); track $index) {
                      <div class="flex items-center justify-center"
                           [class.bg-[#e4efe9]]="sq.isLight"
                           [class.bg-[#2bb5a0]]="!sq.isLight">
                        @if (sq.pieceKey) {
                          <app-chess-piece [pieceKey]="sq.pieceKey" class="w-full h-full p-[4%]"></app-chess-piece>
                        }
                      </div>
                    }
                  </div>
                  <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span class="btn btn-primary !py-2 !px-4 !text-xs">Entrar a Chess TV</span>
                  </div>
                </a>

                <!-- Jugador Blancas (abajo del mini-tablero) -->
                <div class="flex items-center justify-between px-1 text-xs">
                  <div class="flex items-center gap-2 min-w-0">
                    <span class="w-3 h-3 rounded-full bg-white border border-slate-300 shrink-0"></span>
                    <span class="font-bold text-slate-200 truncate">{{ game.white_player?.username }}</span>
                  </div>
                  <span class="font-mono text-[#f4b942] font-bold">{{ getPlayerEloDirect(game.white_player, game.game_mode?.type) }}</span>
                </div>

                <a [routerLink]="['/game', game.code]" class="btn btn-ghost w-full !py-2.5 !text-xs">
                  <span>Observar partida en vivo</span>
                </a>
              </article>
            }
          </div>
        }
      }

      <!-- ===== PESTAÑA 3: UNIRSE CON CÓDIGO PRIVADO ===== -->
      @if (activeTab() === 'private') {
        <div class="max-w-xl mx-auto py-4">
          <div class="surface p-6 sm:p-9 text-center">
            <div class="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#f4b942]/15 border border-[#f4b942]/30 flex items-center justify-center text-[#f4b942]">
              <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </div>
            <h2 class="font-display text-2xl font-bold text-white">Ingresar con Código de Invitación</h2>
            <p class="text-sm text-slate-400 mt-1">Introduce el código de 8 caracteres que te envió tu oponente.</p>

            <form (ngSubmit)="joinPrivateRoom()" class="mt-7 space-y-4">
              <input id="privateCode" type="text" [(ngModel)]="privateCodeInput" name="privateCode" maxlength="12"
                     placeholder="CH8A29FZ" autocomplete="off"
                     class="field !text-center !text-2xl font-mono font-bold tracking-[0.3em] uppercase !text-[#f4b942] !py-4">
              @if (privateError()) {
                <div class="p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs">{{ privateError() }}</div>
              }
              <button type="submit" [disabled]="!privateCodeInput.trim() || isJoiningPrivate()" class="btn btn-primary w-full !py-3.5">
                @if (isJoiningPrivate()) {
                  <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Verificando sala...</span>
                } @else {
                  <app-icon name="swords" class="w-4 h-4"></app-icon>
                  <span>Entrar a la Partida</span>
                }
              </button>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class ChallengesComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  private gameService = inject(GameService);
  private router = inject(Router);

  activeTab = signal<'public' | 'private' | 'live'>('public');
  selectedModeFilter = signal<string>('all');
  searchQuery = '';

  challenges = signal<GameChallenge[]>([]);
  activeGames = signal<Game[]>([]);

  isLoadingChallenges = signal<boolean>(true);
  isLoadingGames = signal<boolean>(false);
  isAcceptingCode = signal<string | null>(null);

  privateCodeInput = '';
  isJoiningPrivate = signal<boolean>(false);
  privateError = signal<string | null>(null);

  private pollInterval: any;
  private isFetchingChallenges = false;
  private isFetchingGames = false;

  filteredChallenges = computed(() => {
    const list = this.challenges();
    const filter = this.selectedModeFilter();
    const q = this.searchQuery.trim().toLowerCase();
    return list.filter(c => {
      const modeOk = filter === 'all' || c.game_mode?.type === filter;
      const queryOk =
        !q ||
        (c.challenger?.username || '').toLowerCase().includes(q) ||
        (c.game_mode?.name || '').toLowerCase().includes(q) ||
        (c.code || '').toLowerCase().includes(q);
      return modeOk && queryOk;
    });
  });

  ngOnInit(): void {
    this.loadChallenges();
    this.loadActiveGames();

    this.pollInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      if (this.activeTab() === 'public') {
        this.loadChallenges();
      } else if (this.activeTab() === 'live') {
        this.loadActiveGames();
      }
    }, 5000);
  }

  ngOnDestroy(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  refreshAll(): void {
    this.loadChallenges();
    this.loadActiveGames();
  }

  loadChallenges(): void {
    if (this.isFetchingChallenges) return;
    this.isFetchingChallenges = true;

    this.gameService.getOpenChallenges().subscribe({
      next: (res) => {
        this.challenges.set(res.challenges);
        this.isLoadingChallenges.set(false);
        this.isFetchingChallenges = false;
      },
      error: () => {
        this.isLoadingChallenges.set(false);
        this.isFetchingChallenges = false;
      }
    });
  }

  loadActiveGames(): void {
    if (this.isFetchingGames) return;
    this.isFetchingGames = true;

    this.gameService.getActiveGames().subscribe({
      next: (res) => {
        this.activeGames.set(res.games);
        this.isLoadingGames.set(false);
        this.isFetchingGames = false;
      },
      error: () => {
        this.isLoadingGames.set(false);
        this.isFetchingGames = false;
      }
    });
  }

  getFideTitle(rating: number): string {
    if (rating >= 2000) return 'GM';
    if (rating >= 1800) return 'IM';
    if (rating >= 1600) return 'FM';
    if (rating >= 1400) return 'CM';
    return 'CLUB';
  }

  getPlayerElo(challenge: GameChallenge): number {
    return getUserRating(challenge.challenger, challenge.game_mode?.type || 'blitz');
  }

  getEloDiffLabel(challenge: GameChallenge): string {
    const mode = challenge.game_mode?.type || 'blitz';
    const myElo = getUserRating(this.authService.currentUser(), mode);
    const oppElo = this.getPlayerElo(challenge);
    const diff = oppElo - myElo;
    if (Math.abs(diff) <= 25) return 'Parejo';
    return diff > 0 ? `+${diff}` : `${diff}`;
  }

  getPlayerEloDirect(user: any, modeType?: string): number {
    return getUserRating(user, modeType || 'blitz');
  }

  getMiniBoard(fen?: string): MiniSquare[] {
    try {
      const c = new Chess(fen || undefined);
      const b = c.board();
      const out: MiniSquare[] = [];
      for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
          const cell = b[r][f];
          out.push({
            isLight: (r + f) % 2 === 0,
            pieceKey: cell ? `${cell.color}${cell.type.toUpperCase()}` : null,
          });
        }
      }
      return out;
    } catch {
      return Array.from({ length: 64 }, (_, i) => ({
        isLight: (Math.floor(i / 8) + i) % 2 === 0,
        pieceKey: null,
      }));
    }
  }

  getModeIcon(type?: string): IconName {
    switch (type) {
      case 'bullet': return 'lightning';
      case 'blitz': return 'flame';
      case 'rapid': return 'timer';
      case 'classical': return 'hourglass';
      default: return 'timer';
    }
  }

  acceptChallenge(code: string): void {
    this.isAcceptingCode.set(code);
    this.gameService.acceptChallenge(code).subscribe({
      next: (res) => {
        this.isAcceptingCode.set(null);
        this.router.navigate(['/game', res.game.code]);
      },
      error: (err) => {
        this.isAcceptingCode.set(null);
        alert(err.error?.message || 'No se pudo aceptar el reto.');
        this.loadChallenges();
      }
    });
  }

  cancelMyChallenge(code: string): void {
    this.gameService.cancelChallenge(code).subscribe({
      next: () => {
        this.loadChallenges();
      }
    });
  }

  joinPrivateRoom(): void {
    const code = this.privateCodeInput.trim().toUpperCase();
    if (!code) return;

    this.isJoiningPrivate.set(true);
    this.privateError.set(null);

    this.gameService.acceptChallenge(code).subscribe({
      next: (res) => {
        this.isJoiningPrivate.set(false);
        this.router.navigate(['/game', res.game.code]);
      },
      error: (err) => {
        this.isJoiningPrivate.set(false);
        this.privateError.set(err.error?.message || 'Código de sala no válido o la partida ya no está disponible.');
      }
    });
  }
}
