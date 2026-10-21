import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GameService } from '../../core/services/game.service';
import { AuthService } from '../../core/services/auth.service';
import { GameChallenge, Game, getUserRating } from '../../core/models';
import { IconComponent, IconName } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-challenges',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, IconComponent],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 fade-in">
      
      <!-- Cabecera de la Sección Salas y Retos -->
      <div class="bg-[#1b1a17] border border-[#2b2925] rounded-2xl p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-[#27241e] to-[#171613] border border-[#3e392f] flex items-center justify-center text-[#c5a059] shadow-inner">
            <app-icon name="board" class="w-6 h-6"></app-icon>
          </div>
          <div>
            <h1 class="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
              <span>Salas de Partida y Retos de la Comunidad</span>
              <span class="w-2 h-2 rounded-full bg-[#779952] animate-pulse"></span>
            </h1>
            <p class="text-xs text-slate-400 mt-0.5">
              Acepta retos públicos abiertos, únete a una sala privada con código o sintoniza partidas en directo.
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button (click)="refreshAll()" 
                  title="Actualizar datos en tiempo real"
                  class="px-3.5 py-2 rounded-xl bg-[#161512] hover:bg-[#22201c] border border-[#2e2c27] text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center gap-2">
            <app-icon name="refresh" class="w-3.5 h-3.5"></app-icon>
            <span>Refrescar</span>
          </button>

          <a routerLink="/lobby" 
             class="px-4 py-2 rounded-xl bg-[#779952] hover:bg-[#86aa5d] text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 active:scale-95">
            <app-icon name="plus" class="w-3.5 h-3.5"></app-icon>
            <span>Crear Mi Propia Sala</span>
          </a>
        </div>
      </div>

      <!-- Navegación por Pestañas Especializadas -->
      <div class="flex items-center gap-2 border-b border-[#292723] pb-3 mb-6">
        <button type="button"
                (click)="activeTab.set('public')"
                [class.text-white]="activeTab() === 'public'"
                [class.bg-[#262420]]="activeTab() === 'public'"
                [class.border-[#c5a059]]="activeTab() === 'public'"
                class="px-4 py-2.5 rounded-xl border border-transparent text-xs font-bold tracking-wide text-slate-400 hover:text-slate-200 transition-all flex items-center gap-2">
          <app-icon name="swords" class="w-4 h-4 text-[#779952]"></app-icon>
          <span>Retos Públicos en Vivo</span>
          <span class="px-1.5 py-0.5 rounded-md text-[10px] font-mono bg-[#161512] text-slate-300 border border-[#2b2925]">
            {{ filteredChallenges().length }}
          </span>
        </button>

        <button type="button"
                (click)="activeTab.set('private')"
                [class.text-white]="activeTab() === 'private'"
                [class.bg-[#262420]]="activeTab() === 'private'"
                [class.border-[#c5a059]]="activeTab() === 'private'"
                class="px-4 py-2.5 rounded-xl border border-transparent text-xs font-bold tracking-wide text-slate-400 hover:text-slate-200 transition-all flex items-center gap-2">
          <svg class="w-4 h-4 text-[#c5a059]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
          <span>Unirse por Código Privado</span>
        </button>

        <button type="button"
                (click)="activeTab.set('live')"
                [class.text-white]="activeTab() === 'live'"
                [class.bg-[#262420]]="activeTab() === 'live'"
                [class.border-[#c5a059]]="activeTab() === 'live'"
                class="px-4 py-2.5 rounded-xl border border-transparent text-xs font-bold tracking-wide text-slate-400 hover:text-slate-200 transition-all flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
          <span>En Directo / TV Espectador</span>
          <span class="px-1.5 py-0.5 rounded-md text-[10px] font-mono bg-[#161512] text-slate-300 border border-[#2b2925]">
            {{ activeGames().length }}
          </span>
        </button>
      </div>

      <!-- PESTAÑA 1: RETOS PÚBLICOS ABIERTOS -->
      @if (activeTab() === 'public') {
        
        <!-- Filtros por Modalidad de Juego -->
        <div class="flex items-center gap-2 mb-6">
          <span class="text-xs text-slate-400 font-semibold mr-2">Filtrar por:</span>
          @for (filter of ['all', 'blitz', 'rapid', 'bullet']; track filter) {
            <button type="button"
                    (click)="selectedModeFilter.set(filter)"
                    [class.bg-[#292621]]="selectedModeFilter() === filter"
                    [class.text-[#c5a059]]="selectedModeFilter() === filter"
                    [class.border-[#463c2c]]="selectedModeFilter() === filter"
                    class="px-3 py-1.5 rounded-lg border border-[#2a2824] bg-[#161512] text-xs font-medium text-slate-300 hover:text-white capitalize transition-all">
              {{ filter === 'all' ? 'Todos los Ritmos' : filter }}
            </button>
          }
        </div>

        @if (isLoadingChallenges()) {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (i of [1,2,3,4,5,6]; track i) {
              <div class="h-36 bg-[#181714] rounded-2xl animate-pulse border border-[#262420]"></div>
            }
          </div>
        } @else if (filteredChallenges().length === 0) {
          <div class="bg-[#1b1a17] border border-[#2b2925] rounded-2xl p-12 text-center">
            <div class="w-14 h-14 mx-auto mb-3 rounded-2xl bg-[#22201c] border border-[#33302a] flex items-center justify-center text-slate-500">
              <app-icon name="swords" class="w-7 h-7"></app-icon>
            </div>
            <h3 class="text-base font-bold text-slate-200">No hay retos abiertos en esta modalidad</h3>
            <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Crea tu propia sala pública para que cualquier jugador en línea pueda desafiarte de inmediato.
            </p>
            <a routerLink="/lobby" 
               class="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#779952] hover:bg-[#86aa5d] text-white text-xs font-bold transition-all shadow-md">
              <app-icon name="plus" class="w-4 h-4"></app-icon>
              <span>Crear Reto Abierto</span>
            </a>
          </div>
        } @else {
          <!-- Grilla de Tarjetas de Retos Públicos -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (chal of filteredChallenges(); track chal.id) {
              <div class="bg-[#1b1a17] rounded-2xl p-5 border border-[#2b2925] hover:border-[#3e3b33] transition-all flex flex-col justify-between gap-4 shadow-lg group">
                
                <!-- Encabezado de la Tarjeta: Jugador y Elo Real -->
                <div class="flex items-start justify-between gap-3">
                  <div class="flex items-center gap-3">
                    <img [src]="chal.challenger?.avatar_url" 
                         [alt]="chal.challenger?.username"
                         class="w-10 h-10 rounded-full bg-[#24221e] border border-[#3e3b35]">
                    <div>
                      <div class="flex items-center gap-1.5">
                        <span class="text-sm font-bold text-slate-100 group-hover:text-white">
                          {{ chal.challenger?.username }}
                        </span>
                        <span class="w-1.5 h-1.5 rounded-full bg-[#779952]"></span>
                      </div>
                      
                      <!-- Elo Real FIDE obtenido dinámicamente -->
                      <span class="text-xs text-[#c5a059] font-mono font-semibold flex items-center gap-1 mt-0.5">
                        <app-icon name="trophy" class="w-3 h-3 text-[#c5a059]"></app-icon>
                        {{ getPlayerElo(chal) }} Elo ({{ chal.game_mode?.type || 'Blitz' }})
                      </span>
                    </div>
                  </div>

                  <!-- Badge Modalidad -->
                  <span class="px-2 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-wider font-semibold"
                        [class.bg-[#242b1d]]="chal.is_rated"
                        [class.text-[#86aa5d]]="chal.is_rated"
                        [class.border-[#344026]]="chal.is_rated"
                        [class.bg-[#252320]]="!chal.is_rated"
                        [class.text-slate-400]="!chal.is_rated"
                        [class.border-[#383530]]="!chal.is_rated"
                        class="border">
                    {{ chal.is_rated ? 'Rankeada' : 'Casual' }}
                  </span>
                </div>

                <!-- Detalles de la Partida: Ritmo y Color -->
                <div class="bg-[#141311] p-3 rounded-xl border border-[#24221f] flex items-center justify-between text-xs">
                  <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded-md bg-[#22201c] flex items-center justify-center text-slate-300">
                      <app-icon [name]="getModeIcon(chal.game_mode?.type)" class="w-3.5 h-3.5"></app-icon>
                    </div>
                    <div>
                      <span class="font-bold text-slate-200 block leading-tight">{{ chal.game_mode?.name }}</span>
                      <span class="text-[10px] text-slate-400 font-mono">
                        {{ ((chal.game_mode?.initial_time_seconds || 180) / 60) }}m + {{ chal.game_mode?.increment_seconds || 0 }}s
                      </span>
                    </div>
                  </div>

                  <div class="flex items-center gap-1.5 text-[11px] text-slate-300 font-medium">
                    <span class="text-slate-500">Juega:</span>
                    @if (chal.color_preference === 'white') {
                      <span class="inline-flex items-center gap-1">
                        <span class="w-3 h-3 rounded-full bg-[#f0d9b5] border border-white/40"></span>
                        Blancas
                      </span>
                    } @else if (chal.color_preference === 'black') {
                      <span class="inline-flex items-center gap-1">
                        <span class="w-3 h-3 rounded-full bg-[#201e1b] border border-[#444]"></span>
                        Negras
                      </span>
                    } @else {
                      <span class="inline-flex items-center gap-1">
                        <span class="w-3 h-3 rounded-full bg-gradient-to-r from-[#f0d9b5] to-[#201e1b]"></span>
                        Aleatorio
                      </span>
                    }
                  </div>
                </div>

                <!-- Botón de Acción -->
                <div>
                  @if (chal.challenger_id === authService.currentUser()?.id) {
                    <div class="flex items-center justify-between gap-2">
                      <span class="text-xs text-[#c5a059] italic flex items-center gap-1 font-mono">
                        <app-icon name="hourglass" class="w-3.5 h-3.5"></app-icon>
                        Tu sala en espera...
                      </span>
                      <button (click)="cancelMyChallenge(chal.code)" 
                              class="px-3 py-1.5 rounded-lg bg-[#252320] hover:bg-red-950/40 text-slate-300 hover:text-red-400 text-xs border border-[#383530] transition-colors">
                        Cancelar
                      </button>
                    </div>
                  } @else {
                    <button (click)="acceptChallenge(chal.code)"
                            [disabled]="isAcceptingCode() === chal.code"
                            class="w-full py-2.5 px-4 rounded-xl bg-[#779952] hover:bg-[#86aa5d] disabled:opacity-50 text-white font-bold text-xs shadow transition-all flex items-center justify-center gap-2 active:scale-98">
                      @if (isAcceptingCode() === chal.code) {
                        <svg class="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                        </svg>
                        <span>Conectando...</span>
                      } @else {
                        <app-icon name="swords" class="w-3.5 h-3.5"></app-icon>
                        <span>Aceptar Reto</span>
                      }
                    </button>
                  }
                </div>

              </div>
            }
          </div>
        }

      }

      <!-- PESTAÑA 2: UNIRSE A SALA PRIVADA CON CÓDIGO -->
      @if (activeTab() === 'private') {
        <div class="max-w-xl mx-auto py-6">
          <div class="bg-[#1b1a17] border border-[#2b2925] rounded-2xl p-8 shadow-2xl text-center">
            
            <div class="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#27241e] to-[#181714] border border-[#3e392f] flex items-center justify-center text-[#c5a059] shadow-inner">
              <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </div>

            <h2 class="text-xl font-bold text-slate-100">Unirse a Partida Privada</h2>
            <p class="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Ingresa el código alfanumérico que te compartió tu rival para entrar a la sala de juego exclusiva.
            </p>

            <form (ngSubmit)="joinPrivateRoom()" class="mt-8 space-y-4">
              <div>
                <label for="privateCode" class="block text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2">
                  Código de Sala (8 Caracteres)
                </label>
                <input id="privateCode"
                       type="text" 
                       [(ngModel)]="privateCodeInput" 
                       name="privateCode"
                       maxlength="12"
                       placeholder="EJ: CH8A29FZ"
                       class="w-full max-w-xs mx-auto text-center px-4 py-3.5 rounded-xl bg-[#131210] border border-[#383530] text-xl font-mono font-bold tracking-widest text-[#c5a059] uppercase focus:outline-none focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059] transition-all placeholder:text-slate-600">
              </div>

              @if (privateError()) {
                <div class="p-3 rounded-xl bg-red-950/30 border border-red-800/40 text-red-300 text-xs max-w-xs mx-auto">
                  {{ privateError() }}
                </div>
              }

              <button type="submit" 
                      [disabled]="!privateCodeInput.trim() || isJoiningPrivate()"
                      class="w-full max-w-xs mx-auto py-3.5 px-6 rounded-xl bg-[#779952] hover:bg-[#86aa5d] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm shadow-xl transition-all flex items-center justify-center gap-2 transform active:scale-98">
                @if (isJoiningPrivate()) {
                  <svg class="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Verificando sala privada...</span>
                } @else {
                  <app-icon name="swords" class="w-4 h-4"></app-icon>
                  <span>Entrar a la Partida</span>
                }
              </button>
            </form>

            <div class="mt-8 pt-6 border-t border-[#292723] text-[11px] text-slate-500 text-left space-y-1">
              <p class="font-semibold text-slate-400">Instrucciones de Salas Privadas:</p>
              <p>&bull; Las partidas privadas no aparecen en la lista pública de retos.</p>
              <p>&bull; Solo tú y la persona que tiene el código pueden disputar la partida.</p>
              <p>&bull; ¿Quieres crear una? Ve a <a routerLink="/lobby" class="text-[#c5a059] underline">Jugar</a> y selecciona "Sala Privada con Invitación".</p>
            </div>

          </div>
        </div>
      }

      <!-- PESTAÑA 3: EN DIRECTO / CHESS TV (ESPECTADOR) -->
      @if (activeTab() === 'live') {
        @if (isLoadingGames()) {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (i of [1,2,3]; track i) {
              <div class="h-44 bg-[#181714] rounded-2xl animate-pulse border border-[#262420]"></div>
            }
          </div>
        } @else if (activeGames().length === 0) {
          <div class="bg-[#1b1a17] border border-[#2b2925] rounded-2xl p-12 text-center">
            <div class="w-14 h-14 mx-auto mb-3 rounded-2xl bg-[#22201c] border border-[#33302a] flex items-center justify-center text-slate-500">
              <app-icon name="board" class="w-7 h-7"></app-icon>
            </div>
            <h3 class="text-base font-bold text-slate-200">No hay partidas activas en curso en este instante</h3>
            <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Cuando los jugadores inicien sus partidas, aparecerán aquí para que puedas observarlas como espectador en directo.
            </p>
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            @for (game of activeGames(); track game.id) {
              <div class="bg-[#1b1a17] rounded-2xl p-5 border border-[#2b2925] hover:border-[#3e3b33] transition-all flex flex-col justify-between gap-4 shadow-lg group">
                
                <!-- Encabezado de la Partida en Vivo -->
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                    <span class="text-xs font-bold text-red-400 uppercase tracking-wider font-mono">En Vivo</span>
                  </div>
                  <span class="text-[11px] font-mono text-[#c5a059] bg-[#221f18] px-2 py-0.5 rounded border border-[#3d3627]">
                    {{ game.game_mode?.name }}
                  </span>
                </div>

                <!-- Enfrentamiento Blancas vs Negras con Elo Real -->
                <div class="space-y-2 bg-[#141311] p-3.5 rounded-xl border border-[#24221f]">
                  <!-- Blancas -->
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2.5">
                      <span class="w-3.5 h-3.5 rounded-full bg-[#f0d9b5] border border-white/50 shrink-0"></span>
                      <span class="text-xs font-bold text-slate-200">{{ game.white_player?.username }}</span>
                    </div>
                    <span class="text-xs font-mono text-[#c5a059] font-semibold">
                      {{ getPlayerEloDirect(game.white_player, game.game_mode?.type) }}
                    </span>
                  </div>

                  <div class="border-t border-[#22201c] my-1"></div>

                  <!-- Negras -->
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2.5">
                      <span class="w-3.5 h-3.5 rounded-full bg-[#201e1b] border border-[#3e3b35] shrink-0"></span>
                      <span class="text-xs font-bold text-slate-200">{{ game.black_player?.username }}</span>
                    </div>
                    <span class="text-xs font-mono text-[#c5a059] font-semibold">
                      {{ getPlayerEloDirect(game.black_player, game.game_mode?.type) }}
                    </span>
                  </div>
                </div>

                <!-- Información de Movimientos y Botón Espectador -->
                <div class="flex items-center justify-between gap-3 pt-1">
                  <span class="text-[11px] text-slate-400 font-mono">
                    Jugada #{{ game.move_count }}
                  </span>

                  <a [routerLink]="['/game', game.code]" 
                     class="px-4 py-1.5 rounded-lg bg-[#272420] hover:bg-[#343029] border border-[#3d382f] text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors">
                    <svg class="w-3.5 h-3.5 text-[#c5a059]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                    <span>Observar</span>
                  </a>
                </div>

              </div>
            }
          </div>
        }
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

  challenges = signal<GameChallenge[]>([]);
  activeGames = signal<Game[]>([]);

  isLoadingChallenges = signal<boolean>(true);
  isLoadingGames = signal<boolean>(false);
  isAcceptingCode = signal<string | null>(null);

  // Formulario de sala privada
  privateCodeInput = '';
  isJoiningPrivate = signal<boolean>(false);
  privateError = signal<string | null>(null);

  private pollInterval: any;

  filteredChallenges = computed(() => {
    const list = this.challenges();
    const filter = this.selectedModeFilter();
    if (filter === 'all') return list;
    return list.filter(c => c.game_mode?.type === filter);
  });

  private isFetchingChallenges = false;
  private isFetchingGames = false;

  ngOnInit(): void {
    this.refreshAll();

    // Sondeo inteligente cada 5 segundos respetando visibilidad de pestaña y evitando solicitudes en vuelo
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
    if (this.activeTab() === 'public') {
      this.loadChallenges();
    } else {
      this.loadActiveGames();
    }
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

  getPlayerElo(challenge: GameChallenge): number {
    return getUserRating(challenge.challenger, challenge.game_mode?.type || 'blitz');
  }

  getPlayerEloDirect(user: any, modeType?: string): number {
    return getUserRating(user, modeType || 'blitz');
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
