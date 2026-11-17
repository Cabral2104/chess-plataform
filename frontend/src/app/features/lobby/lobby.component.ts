import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { GameService } from '../../core/services/game.service';
import { GameMode, GameChallenge } from '../../core/models';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 fade-in">
      
      <!-- Bienvenida y Perfil Rápido -->
      <div class="chess-card  p-5 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 border border-chess-border ">
        <div class="flex items-center gap-4 text-center sm:text-left">
          <img [src]="authService.currentUser()?.avatar_url" 
               [alt]="authService.currentUser()?.username" 
               class="w-14 h-14 rounded-full bg-[#2A2622] border-2 border-chess-gold/60 ">
          <div>
            <div class="flex items-center gap-2 justify-center sm:justify-start">
              <h2 class="g-title text-3xl text-slate-100">
                Hola, {{ authService.currentUser()?.name }}
              </h2>
              <span class="inline-flex items-center px-2 py-0.5  text-[11px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                En Línea
              </span>
            </div>
            <p class="text-sm text-slate-400">
              &#64;{{ authService.currentUser()?.username }} &bull; Puntuación Inicial: 
              <span class="text-chess-gold font-mono font-semibold">1200 Elo</span>
            </p>
          </div>
        </div>

        <div class="flex items-center gap-6 text-center sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-chess-border w-full sm:w-auto justify-around sm:justify-end">
          <div>
            <span class="text-xs text-slate-400 block  ">Partidas</span>
            <span class="text-base font-bold text-slate-200 font-mono">
              {{ authService.currentUser()?.total_games || 0 }}
            </span>
          </div>
          <div>
            <span class="text-xs text-slate-400 block  ">Victorias</span>
            <span class="text-base font-bold text-emerald-400 font-mono">
              {{ authService.currentUser()?.total_wins || 0 }}
            </span>
          </div>
          <div>
            <span class="text-xs text-slate-400 block  ">Derrotas</span>
            <span class="text-base font-bold text-red-400 font-mono">
              {{ authService.currentUser()?.total_losses || 0 }}
            </span>
          </div>
        </div>
      </div>

      <!-- Contenedor Principal: Modos de Juego y Retos Abiertos -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <!-- Columna Izquierda: Crear Partida (8 columnas) -->
        <div class="lg:col-span-7 xl:col-span-8 space-y-6">
          
          <div class="chess-panel  p-6 border border-chess-border ">
            <div class="flex items-center justify-between mb-5">
              <div>
                <h3 class="g-title text-slate-100 flex items-center gap-2">
                  <svg class="w-5 h-5 text-chess-gold" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 22H5v-2h14v2M17.15 7.62c-.32-.23-.74-.3-1.12-.17l-.87.3c-.34.12-.72.04-.98-.21L13 6.4V4c0-1.1-.9-2-2-2h-.5c-.28 0-.5.22-.5.5v1.65l-2.07 2.08c-.46.46-.77 1.05-.88 1.69l-.65 3.86c-.05.28.04.56.24.75.2.19.48.27.75.22l2.11-.35v3.1c0 .83.67 1.5 1.5 1.5h4c.83 0 1.5-.67 1.5-1.5v-2.38l1.45-1.45c.42-.42.66-.99.66-1.58v-4.5c0-.62-.26-1.22-.76-1.63z"/>
                  </svg>
                  1. Elige el ritmo
                </h3>
                <p class="text-xs text-slate-400 mt-0.5">Tiempos reglamentarios con incremento oficial FIDE</p>
              </div>

              <span class="text-xs font-mono text-chess-gold bg-amber-950/40 px-2.5 py-1  border border-amber-800/60">
                FIDE Standard
              </span>
            </div>

            <!-- Grilla de Modos de Juego -->
            @if (isLoadingModes()) {
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                @for (i of [1,2,3,4,5,6]; track i) {
                  <div class="h-24 bg-chess-bg  animate-pulse border border-chess-border"></div>
                }
              </div>
            } @else {
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                @for (mode of gameModes(); track mode.id) {
                  <button type="button" 
                          (click)="selectMode(mode)"
                          [class.border-chess-gold]="selectedMode()?.id === mode.id"
                          [class.bg-[#2A2622]]="selectedMode()?.id === mode.id"
                          class="p-3.5  bg-chess-card border border-chess-border hover:border-chess-border hover:bg-[#2A2622] transition-all text-left flex flex-col justify-between group relative overflow-hidden">
                    
                    @if (mode.slug === 'blitz-3-2') {
                      <span class="absolute top-1.5 right-1.5 text-[9px] bg-chess-gold/20 text-chess-gold px-1.5 py-0.5  font-semibold  ">
                        Popular
                      </span>
                    }

                    <div class="flex items-center gap-2 mb-2">
                      @if (mode.type === 'bullet') {
                        <span class="g-glyph text-chess-gold text-2xl" aria-hidden="true">&#9822;&#xFE0E;</span>
                      } @else if (mode.type === 'blitz') {
                        <span class="g-glyph text-chess-gold text-2xl" aria-hidden="true">&#9821;&#xFE0E;</span>
                      } @else {
                        <span class="g-glyph text-chess-gold text-2xl" aria-hidden="true">&#9820;&#xFE0E;</span>
                      }
                      <span class="font-bold text-sm text-slate-100 group-hover:text-white">
                        {{ mode.name }}
                      </span>
                    </div>

                    <div class="text-[11px] text-slate-400 font-mono">
                      {{ (mode.initial_time_seconds / 60) }} min + {{ mode.increment_seconds }}s
                    </div>
                  </button>
                }
              </div>
            }

            <!-- Selector de Piezas y Modo Rankeado -->
            <div class="mt-6 pt-5 border-t border-chess-border grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <!-- Preferencia de Color -->
              <div>
                <label class="block text-xs font-medium text-slate-300   mb-2">
                  2. Color de tus piezas
                </label>
                <div class="grid grid-cols-3 gap-2">
                  <button type="button" 
                          (click)="colorPreference.set('white')"
                          [class.border-chess-gold]="colorPreference() === 'white'"
                          [class.bg-[#2A2622]]="colorPreference() === 'white'"
                          class="py-2 px-3  bg-chess-card border border-chess-border text-xs font-medium text-slate-200 flex flex-col items-center gap-1 hover:bg-[#2A2622] transition-all">
                    <span class="w-4 h-4 rounded-full bg-[#f0d9b5] border border-white/50 "></span>
                    <span>Blancas</span>
                  </button>

                  <button type="button" 
                          (click)="colorPreference.set('random')"
                          [class.border-chess-gold]="colorPreference() === 'random'"
                          [class.bg-[#2A2622]]="colorPreference() === 'random'"
                          class="py-2 px-3  bg-chess-card border border-chess-border text-xs font-medium text-slate-200 flex flex-col items-center gap-1 hover:bg-[#2A2622] transition-all">
                    <span class="w-4 h-4 rounded-full bg-gradient-to-r from-[#f0d9b5] to-[#262421] border border-white/30"></span>
                    <span>Aleatorio</span>
                  </button>

                  <button type="button" 
                          (click)="colorPreference.set('black')"
                          [class.border-chess-gold]="colorPreference() === 'black'"
                          [class.bg-[#2A2622]]="colorPreference() === 'black'"
                          class="py-2 px-3  bg-chess-card border border-chess-border text-xs font-medium text-slate-200 flex flex-col items-center gap-1 hover:bg-[#2A2622] transition-all">
                    <span class="w-4 h-4 rounded-full bg-chess-card border border-chess-border"></span>
                    <span>Negras</span>
                  </button>
                </div>
              </div>

              <!-- Tipo de Partida (Rankeada vs Amistosa) -->
              <div>
                <label class="block text-xs font-medium text-slate-300   mb-2">
                  3. Tipo de partida
                </label>
                <div class="grid grid-cols-2 gap-2">
                  <button type="button" 
                          (click)="isRated.set(true)"
                          [class.border-chess-gold]="isRated()"
                          [class.bg-[#2A2622]]="isRated()"
                          class="py-2 px-3  bg-chess-card border border-chess-border text-xs font-medium text-slate-200 flex items-center justify-center gap-1.5 hover:bg-[#2A2622] transition-all">
                                        <span>Rankeada</span>
                  </button>

                  <button type="button" 
                          (click)="isRated.set(false)"
                          [class.border-chess-gold]="!isRated()"
                          [class.bg-[#2A2622]]="!isRated()"
                          class="py-2 px-3  bg-chess-card border border-chess-border text-xs font-medium text-slate-200 flex items-center justify-center gap-1.5 hover:bg-[#2A2622] transition-all">
                                        <span>Amistosa</span>
                  </button>
                </div>
              </div>

            </div>

            <!-- Botón Crear Reto -->
            <div class="mt-6">
              <button type="button" 
                      (click)="onCreateChallenge()"
                      [disabled]="!selectedMode() || isCreating()"
                      class="w-full py-3.5 px-6  bg-chess-primary hover:bg-chess-primaryHover disabled:opacity-50 disabled:cursor-not-allowed text-chess-bg font-bold text-base  transition-all flex items-center justify-center gap-2 transform active:scale-98">
                @if (isCreating()) {
                  <svg class="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Creando sala de partida...</span>
                } @else {
                  <span>Crear Sala de Partida ({{ selectedMode()?.name || 'Selecciona un ritmo' }})</span>
                }
              </button>
            </div>

          </div>

        </div>

        <!-- Columna Derecha: Retos Públicos Abiertos (4 columnas) -->
        <div class="lg:col-span-5 xl:col-span-4 space-y-6">
          
          <div class="chess-panel  p-5 border border-chess-border ">
            <div class="flex items-center justify-between mb-4">
              <h3 class="g-title text-slate-100 flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Retos en vivo
              </h3>
              <button (click)="loadOpenChallenges()" class="text-xs text-slate-400 hover:text-white p-1">
                Refrescar
              </button>
            </div>

            @if (openChallenges().length === 0) {
              <div class="py-10 text-center text-slate-400 text-sm">
                <span class="g-glyph text-6xl block mb-3 text-slate-500" aria-hidden="true">&#9823;&#xFE0E;</span>
                No hay retos abiertos en este momento.
                <p class="text-xs text-slate-500 mt-1">Crea uno y aparecerá aquí para los demás.</p>
              </div>
            } @else {
              <div class="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                @for (chal of openChallenges(); track chal.id) {
                  <div class="p-3  bg-chess-card border border-chess-border hover:border-chess-border transition-colors flex items-center justify-between gap-3">
                    
                    <div class="flex items-center gap-2.5">
                      <img [src]="chal.challenger?.avatar_url" class="w-8 h-8 rounded-full bg-[#2A2622] border border-chess-border">
                      <div>
                        <span class="text-xs font-semibold text-slate-200 block leading-tight">
                          {{ chal.challenger?.username }}
                        </span>
                        <span class="text-[10px] text-chess-gold font-mono">
                          {{ chal.game_mode?.name }} &bull; {{ chal.is_rated ? 'Rankeada' : 'Casual' }}
                        </span>
                      </div>
                    </div>

                    @if (chal.challenger_id === authService.currentUser()?.id) {
                      <span class="text-xs text-slate-500 font-mono italic">Tu reto</span>
                    } @else {
                      <button (click)="acceptChallenge(chal.code)" 
                              class="px-3 py-1.5  bg-chess-primary hover:bg-chess-primaryHover text-chess-bg text-xs font-semibold  transition-all active:scale-95">
                        Jugar
                      </button>
                    }

                  </div>
                }
              </div>
            }

          </div>

        </div>

      </div>

      <!-- MODAL DE SALA DE ESPERA (Reto propio creado) -->
      @if (activeChallenge()) {
        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 fade-in">
          <div class="w-full max-w-md bg-chess-card border border-chess-border   p-6 sm:p-7 text-center">
            
            <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-[#2A2622] border border-chess-border flex items-center justify-center text-chess-gold">
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2a10 10 0 1010 10A10 10 0 0012 2zm1 14.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm0-4a1 1 0 01-2 0V7a1 1 0 012 0z"/>
              </svg>
            </div>

            <h3 class="g-title text-3xl text-slate-100">Sala de espera creada</h3>
            <p class="text-xs text-slate-400 mt-1">
              Ritmo: <strong class="text-slate-200">{{ activeChallenge()?.game_mode?.name }}</strong> &bull; 
              Piezas: <strong class="text-slate-200 capitalize">{{ activeChallenge()?.color_preference }}</strong>
            </p>

            <!-- Código de Sala -->
            <div class="my-5 p-3.5  bg-chess-bg border border-chess-border">
              <span class="text-[11px] text-slate-400   block mb-1">Código de Invitación</span>
              <span class="text-2xl font-mono font-bold  text-chess-gold">
                {{ activeChallenge()?.code }}
              </span>
            </div>

            <!-- Botón Copiar Enlace -->
            <div class="space-y-3">
              <button (click)="copyChallengeLink()" 
                      class="w-full py-2.5 px-4  bg-[#2A2622] hover:bg-[#2A2622] border border-chess-border text-slate-100 text-xs font-semibold flex items-center justify-center gap-2 transition-colors">
                @if (copiedLink()) {
                  <span class="text-emerald-400">¡Enlace copiado al portapapeles! ✓</span>
                } @else {
                  <span>Copiar Enlace de Invitación</span>
                }
              </button>

              <div class="flex items-center justify-center gap-2 text-xs text-slate-400 pt-1">
                <span class="w-2 h-2 rounded-full bg-chess-gold animate-ping"></span>
                <span>Esperando a que tu rival ingrese a la sala...</span>
              </div>

              <button (click)="cancelActiveChallenge()" 
                      class="w-full py-2 text-xs text-slate-400 hover:text-red-400 transition-colors">
                Cancelar y Salir de la Sala
              </button>
            </div>

          </div>
        </div>
      }

    </div>
  `
})
export class LobbyComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  private gameService = inject(GameService);
  private router = inject(Router);

  gameModes = signal<GameMode[]>([]);
  selectedMode = signal<GameMode | null>(null);
  colorPreference = signal<'white' | 'black' | 'random'>('random');
  isRated = signal<boolean>(true);
  openChallenges = signal<GameChallenge[]>([]);
  activeChallenge = signal<GameChallenge | null>(null);

  isLoadingModes = signal<boolean>(true);
  isCreating = signal<boolean>(false);
  copiedLink = signal<boolean>(false);

  private pollInterval: any;

  ngOnInit(): void {
    this.loadGameModes();
    this.loadOpenChallenges();

    // Sondeo periódico cada 3.5 segundos para detectar nuevos retos y si aceptan el tuyo
    this.pollInterval = setInterval(() => {
      this.loadOpenChallenges();
      if (this.activeChallenge()) {
        this.checkIfActiveChallengeAccepted();
      }
    }, 3500);
  }

  ngOnDestroy(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  loadGameModes(): void {
    this.isLoadingModes.set(true);
    this.gameService.getGameModes().subscribe({
      next: (res) => {
        this.gameModes.set(res.game_modes);
        // Seleccionar Blitz 3+2 por defecto
        const defaultMode = res.game_modes.find(m => m.slug === 'blitz-3-2') || res.game_modes[0];
        this.selectedMode.set(defaultMode);
        this.isLoadingModes.set(false);
      },
      error: () => {
        this.isLoadingModes.set(false);
      }
    });
  }

  loadOpenChallenges(): void {
    this.gameService.getOpenChallenges().subscribe({
      next: (res) => {
        this.openChallenges.set(res.challenges);
      }
    });
  }

  selectMode(mode: GameMode): void {
    this.selectedMode.set(mode);
  }

  onCreateChallenge(): void {
    const mode = this.selectedMode();
    if (!mode) return;

    this.isCreating.set(true);
    this.gameService.createChallenge({
      game_mode_id: mode.id,
      color_preference: this.colorPreference(),
      is_rated: this.isRated(),
    }).subscribe({
      next: (res) => {
        this.isCreating.set(false);
        this.activeChallenge.set(res.challenge);
      },
      error: (err) => {
        this.isCreating.set(false);
        if (err.error?.challenge) {
          // Ya tenía un reto activo
          this.activeChallenge.set(err.error.challenge);
        }
      }
    });
  }

  acceptChallenge(code: string): void {
    this.gameService.acceptChallenge(code).subscribe({
      next: (res) => {
        // Redirigir a la partida generada
        this.router.navigate(['/game', res.game.code]);
      },
      error: (err) => {
        alert(err.error?.message || 'No se pudo aceptar el reto.');
        this.loadOpenChallenges();
      }
    });
  }

  copyChallengeLink(): void {
    const code = this.activeChallenge()?.code;
    if (!code) return;

    const url = `${window.location.origin}/challenges/${code}`;
    navigator.clipboard.writeText(url).then(() => {
      this.copiedLink.set(true);
      setTimeout(() => this.copiedLink.set(false), 2500);
    });
  }

  checkIfActiveChallengeAccepted(): void {
    const active = this.activeChallenge();
    if (!active) return;

    this.gameService.getChallenge(active.code).subscribe({
      next: (res) => {
        if (res.challenge.challenge_status === 'accepted' && res.challenge.game) {
          // ¡El oponente aceptó! Redirigir al tablero
          this.activeChallenge.set(null);
          this.router.navigate(['/game', res.challenge.game.code]);
        }
      }
    });
  }

  cancelActiveChallenge(): void {
    const code = this.activeChallenge()?.code;
    if (!code) return;

    this.gameService.cancelChallenge(code).subscribe({
      next: () => {
        this.activeChallenge.set(null);
        this.loadOpenChallenges();
      }
    });
  }
}
