import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { GameService } from '../../core/services/game.service';
import { GameMode, GameChallenge, getUserRating } from '../../core/models';
import { IconComponent, IconName } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 fade-in">
      
      <!-- Banner de Perfil de Jugador con Elo Real y Estadísticas FIDE -->
      <div class="bg-[#1b1a17] border border-[#2b2925] rounded-2xl p-5 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div class="flex items-center gap-4 text-center md:text-left">
          <div class="relative">
            <img [src]="authService.currentUser()?.avatar_url" 
                 [alt]="authService.currentUser()?.username" 
                 class="w-14 h-14 rounded-full bg-[#252320] border-2 border-[#c5a059] shadow-md">
            <span class="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#779952] ring-2 ring-[#1b1a17]"></span>
          </div>
          <div>
            <div class="flex items-center gap-2 justify-center md:justify-start">
              <h2 class="text-xl font-bold text-slate-100 tracking-tight">
                {{ authService.currentUser()?.name }}
              </h2>
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#22271d] text-[#86aa5d] border border-[#37452d]">
                <span class="w-1.5 h-1.5 rounded-full bg-[#779952]"></span>
                En Línea
              </span>
            </div>
            
            <!-- Ratings Elo Reales por Modalidad -->
            <div class="flex flex-wrap items-center gap-2 mt-1.5 justify-center md:justify-start">
              <span class="text-xs text-slate-400">&#64;{{ authService.currentUser()?.username }}</span>
              <span class="text-slate-600">&bull;</span>
              
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#151412] border border-[#2a2824] text-[11px] font-mono text-[#c5a059] font-semibold">
                <app-icon name="flame" class="w-3 h-3 text-[#c5a059]"></app-icon>
                <span>Blitz {{ blitzRating() }}</span>
              </span>

              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#151412] border border-[#2a2824] text-[11px] font-mono text-[#779952] font-semibold">
                <app-icon name="timer" class="w-3 h-3 text-[#779952]"></app-icon>
                <span>Rapid {{ rapidRating() }}</span>
              </span>

              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#151412] border border-[#2a2824] text-[11px] font-mono text-amber-300 font-semibold">
                <app-icon name="lightning" class="w-3 h-3 text-amber-300"></app-icon>
                <span>Bullet {{ bulletRating() }}</span>
              </span>
            </div>
          </div>
        </div>

        <!-- Métricas de Desempeño Competitivo -->
        <div class="flex items-center gap-4 text-center md:text-right border-t md:border-t-0 pt-3 md:pt-0 border-[#292723] w-full md:w-auto justify-around md:justify-end">
          <div class="bg-[#151412] px-3.5 py-2 rounded-xl border border-[#262420] min-w-[75px]">
            <span class="text-[10px] text-slate-400 block uppercase tracking-wider">Partidas</span>
            <span class="text-base font-bold text-slate-200 font-mono">
              {{ authService.currentUser()?.total_games || 0 }}
            </span>
          </div>
          <div class="bg-[#151412] px-3.5 py-2 rounded-xl border border-[#262420] min-w-[75px]">
            <span class="text-[10px] text-slate-400 block uppercase tracking-wider">Victorias</span>
            <span class="text-base font-bold text-[#86aa5d] font-mono">
              {{ authService.currentUser()?.total_wins || 0 }}
            </span>
          </div>
          <div class="bg-[#151412] px-3.5 py-2 rounded-xl border border-[#262420] min-w-[75px]">
            <span class="text-[10px] text-slate-400 block uppercase tracking-wider">Derrotas</span>
            <span class="text-base font-bold text-red-400 font-mono">
              {{ authService.currentUser()?.total_losses || 0 }}
            </span>
          </div>
        </div>
      </div>

      <!-- Contenedor Principal de la Pestaña "Jugar" -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <!-- Columna Principal: Creador Personalizado de Partidas (8 columnas) -->
        <div class="lg:col-span-8 space-y-6">
          
          <div class="bg-[#1b1a17] rounded-2xl p-6 border border-[#2b2925] shadow-2xl">
            <div class="flex items-center justify-between mb-5">
              <div>
                <h3 class="text-base font-bold text-slate-100 tracking-tight flex items-center gap-2">
                  <app-icon name="swords" class="w-5 h-5 text-[#c5a059]"></app-icon>
                  <span>1. Selecciona el Ritmo de Juego</span>
                </h3>
                <p class="text-xs text-slate-400 mt-0.5">Tiempos oficiales FIDE con incremento por movimiento</p>
              </div>

              <span class="text-[10px] font-mono text-[#c5a059] bg-[#29251e] px-2.5 py-1 rounded-md border border-[#443d2f] font-semibold uppercase tracking-wider">
                FIDE Standard
              </span>
            </div>

            <!-- Grilla de Modos de Juego Vectoriales -->
            @if (isLoadingModes()) {
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                @for (i of [1,2,3,4,5,6]; track i) {
                  <div class="h-24 bg-[#151412] rounded-xl animate-pulse border border-[#24221f]"></div>
                }
              </div>
            } @else {
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                @for (mode of gameModes(); track mode.id) {
                  <button type="button" 
                          (click)="selectMode(mode)"
                          [class.border-[#c5a059]]="selectedMode()?.id === mode.id"
                          [class.bg-[#262420]]="selectedMode()?.id === mode.id"
                          [class.shadow-md]="selectedMode()?.id === mode.id"
                          class="p-4 rounded-xl bg-[#161512] border border-[#292723] hover:border-[#423f38] hover:bg-[#201f1c] transition-all text-left flex flex-col justify-between group relative overflow-hidden">
                    
                    @if (mode.slug === 'blitz-3-2') {
                      <span class="absolute top-2 right-2 text-[8px] bg-[#c5a059]/15 text-[#c5a059] border border-[#c5a059]/30 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                        Estándar
                      </span>
                    }

                    <div class="flex items-center gap-2.5 mb-2.5">
                      <div class="w-7 h-7 rounded-lg bg-[#22201c] border border-[#33302a] flex items-center justify-center text-slate-300 group-hover:text-white transition-colors">
                        <app-icon [name]="getModeIcon(mode.type)" class="w-4 h-4"></app-icon>
                      </div>
                      <span class="font-bold text-sm text-slate-100 group-hover:text-white">
                        {{ mode.name }}
                      </span>
                    </div>

                    <div class="text-[11px] text-slate-400 font-mono flex items-center justify-between">
                      <span>{{ (mode.initial_time_seconds / 60) }} min</span>
                      <span class="text-slate-500">+{{ mode.increment_seconds }}s</span>
                    </div>
                  </button>
                }
              </div>
            }

            <!-- Selector de Opciones: Color, Modalidad y Privacidad -->
            <div class="mt-6 pt-5 border-t border-[#292724] space-y-5">
              
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <!-- 2. Preferencia de Color -->
                <div>
                  <label class="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    2. Color de Piezas
                  </label>
                  <div class="grid grid-cols-3 gap-2">
                    <button type="button" 
                            (click)="colorPreference.set('white')"
                            [class.border-[#c5a059]]="colorPreference() === 'white'"
                            [class.bg-[#262420]]="colorPreference() === 'white'"
                            class="py-2.5 px-3 rounded-xl bg-[#161512] border border-[#292723] text-xs font-semibold text-slate-200 flex flex-col items-center gap-1.5 hover:bg-[#201f1c] transition-all">
                      <span class="w-4 h-4 rounded-full bg-[#f0d9b5] border border-white/60 shadow-sm"></span>
                      <span>Blancas</span>
                    </button>

                    <button type="button" 
                            (click)="colorPreference.set('random')"
                            [class.border-[#c5a059]]="colorPreference() === 'random'"
                            [class.bg-[#262420]]="colorPreference() === 'random'"
                            class="py-2.5 px-3 rounded-xl bg-[#161512] border border-[#292723] text-xs font-semibold text-slate-200 flex flex-col items-center gap-1.5 hover:bg-[#201f1c] transition-all">
                      <span class="w-4 h-4 rounded-full bg-gradient-to-r from-[#f0d9b5] to-[#201e1b] border border-white/30"></span>
                      <span>Aleatorio</span>
                    </button>

                    <button type="button" 
                            (click)="colorPreference.set('black')"
                            [class.border-[#c5a059]]="colorPreference() === 'black'"
                            [class.bg-[#262420]]="colorPreference() === 'black'"
                            class="py-2.5 px-3 rounded-xl bg-[#161512] border border-[#292723] text-xs font-semibold text-slate-200 flex flex-col items-center gap-1.5 hover:bg-[#201f1c] transition-all">
                      <span class="w-4 h-4 rounded-full bg-[#201e1b] border border-[#3e3b35]"></span>
                      <span>Negras</span>
                    </button>
                  </div>
                </div>

                <!-- 3. Tipo de Partida (Rankeada vs Amistosa) -->
                <div>
                  <label class="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    3. Modalidad
                  </label>
                  <div class="grid grid-cols-2 gap-2">
                    <button type="button" 
                            (click)="isRated.set(true)"
                            [class.border-[#c5a059]]="isRated()"
                            [class.bg-[#262420]]="isRated()"
                            class="py-2.5 px-3 rounded-xl bg-[#161512] border border-[#292723] text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 hover:bg-[#201f1c] transition-all">
                      <app-icon name="trophy" class="w-3.5 h-3.5 text-[#c5a059]"></app-icon>
                      <span>Rankeada</span>
                    </button>

                    <button type="button" 
                            (click)="isRated.set(false)"
                            [class.border-[#c5a059]]="!isRated()"
                            [class.bg-[#262420]]="!isRated()"
                            class="py-2.5 px-3 rounded-xl bg-[#161512] border border-[#292723] text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 hover:bg-[#201f1c] transition-all">
                      <app-icon name="handshake" class="w-3.5 h-3.5 text-slate-400"></app-icon>
                      <span>Casual</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- 4. Privacidad de la Partida (Pública vs Privada con Código) -->
              <div>
                <label class="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  4. Tipo de Sala
                </label>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button type="button" 
                          (click)="isPrivate.set(false)"
                          [class.border-[#779952]]="!isPrivate()"
                          [class.bg-[#21271d]]="!isPrivate()"
                          class="p-3.5 rounded-xl bg-[#161512] border border-[#292723] text-left hover:bg-[#1f221a] transition-all flex items-start gap-3">
                    <div class="p-2 rounded-lg bg-[#283222] text-[#86aa5d] shrink-0 mt-0.5">
                      <app-icon name="board" class="w-4 h-4"></app-icon>
                    </div>
                    <div>
                      <span class="block text-xs font-bold text-slate-100">Sala Pública Abierta</span>
                      <span class="text-[11px] text-slate-400 mt-0.5 block">Visible para toda la comunidad en "Salas y Retos".</span>
                    </div>
                  </button>

                  <button type="button" 
                          (click)="isPrivate.set(true)"
                          [class.border-[#c5a059]]="isPrivate()"
                          [class.bg-[#26241e]]="isPrivate()"
                          class="p-3.5 rounded-xl bg-[#161512] border border-[#292723] text-left hover:bg-[#24211a] transition-all flex items-start gap-3">
                    <div class="p-2 rounded-lg bg-[#332a1b] text-[#c5a059] shrink-0 mt-0.5">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                      </svg>
                    </div>
                    <div>
                      <span class="block text-xs font-bold text-slate-100">Sala Privada con Invitación</span>
                      <span class="text-[11px] text-slate-400 mt-0.5 block">Solo ingresan mediante código o enlace directo.</span>
                    </div>
                  </button>
                </div>
              </div>

            </div>

            <!-- Botón Principal: Crear Sala de Partida -->
            <div class="mt-6">
              <button type="submit" 
                      (click)="onCreateChallenge()"
                      [disabled]="!selectedMode() || isCreating()"
                      class="w-full py-4 px-6 rounded-xl bg-[#779952] hover:bg-[#86aa5d] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm shadow-xl transition-all flex items-center justify-center gap-2 transform active:scale-98">
                @if (isCreating()) {
                  <svg class="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Generando sala de juego...</span>
                } @else {
                  <app-icon name="plus" class="w-4 h-4"></app-icon>
                  <span>
                    Crear Sala {{ isPrivate() ? 'Privada' : 'Pública' }} ({{ selectedMode()?.name || 'Selecciona un ritmo' }})
                  </span>
                }
              </button>
            </div>

          </div>

        </div>

        <!-- Columna Derecha: Emparejamiento Rápido y Acceso a la Comunidad (4 columnas) -->
        <div class="lg:col-span-4 space-y-6">
          
          <!-- Tarjeta de Emparejamiento Rápido (1-Click Matchmaking) -->
          <div class="bg-[#1b1a17] rounded-2xl p-5 border border-[#2b2925] shadow-2xl">
            <div class="flex items-center gap-2 mb-3 pb-3 border-b border-[#292723]">
              <app-icon name="lightning" class="w-4 h-4 text-[#c5a059]"></app-icon>
              <h3 class="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Partida Rápida (1-Click)
              </h3>
            </div>
            <p class="text-xs text-slate-400 mb-4">
              Comienza a jugar al instante en las modalidades más populares sin configuración previa.
            </p>

            <div class="space-y-2.5">
              <button type="button" 
                      (click)="quickMatch('blitz-3-2')" 
                      class="w-full p-3 rounded-xl bg-[#161512] border border-[#2b2925] hover:border-[#c5a059] hover:bg-[#201f1c] text-left transition-all flex items-center justify-between group">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-[#27231c] border border-[#3d362a] flex items-center justify-center text-[#c5a059]">
                    <app-icon name="flame" class="w-4 h-4"></app-icon>
                  </div>
                  <div>
                    <span class="text-xs font-bold text-slate-200 group-hover:text-white block">Blitz 3+2 min</span>
                    <span class="text-[10px] text-slate-400 font-mono">FIDE Standard &bull; Rankeada</span>
                  </div>
                </div>
                <app-icon name="swords" class="w-4 h-4 text-slate-500 group-hover:text-[#c5a059] transition-colors"></app-icon>
              </button>

              <button type="button" 
                      (click)="quickMatch('rapid-10-0')" 
                      class="w-full p-3 rounded-xl bg-[#161512] border border-[#2b2925] hover:border-[#779952] hover:bg-[#201f1c] text-left transition-all flex items-center justify-between group">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-[#20271c] border border-[#2f3d27] flex items-center justify-center text-[#779952]">
                    <app-icon name="timer" class="w-4 h-4"></app-icon>
                  </div>
                  <div>
                    <span class="text-xs font-bold text-slate-200 group-hover:text-white block">Rapid 10 min</span>
                    <span class="text-[10px] text-slate-400 font-mono">Reflexión Estratégica &bull; Rankeada</span>
                  </div>
                </div>
                <app-icon name="swords" class="w-4 h-4 text-slate-500 group-hover:text-[#779952] transition-colors"></app-icon>
              </button>

              <button type="button" 
                      (click)="quickMatch('bullet-1-0')" 
                      class="w-full p-3 rounded-xl bg-[#161512] border border-[#2b2925] hover:border-amber-400 hover:bg-[#201f1c] text-left transition-all flex items-center justify-between group">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-[#27231c] border border-[#443825] flex items-center justify-center text-amber-400">
                    <app-icon name="lightning" class="w-4 h-4"></app-icon>
                  </div>
                  <div>
                    <span class="text-xs font-bold text-slate-200 group-hover:text-white block">Bullet 1 min</span>
                    <span class="text-[10px] text-slate-400 font-mono">Velocidad Extrema &bull; Rankeada</span>
                  </div>
                </div>
                <app-icon name="swords" class="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors"></app-icon>
              </button>
            </div>
          </div>

          <!-- Acceso Directo a Salas y Retos de la Comunidad -->
          <div class="bg-gradient-to-br from-[#1b1a17] to-[#141311] rounded-2xl p-5 border border-[#35322b] shadow-2xl relative overflow-hidden">
            <div class="flex items-center gap-3 mb-2.5">
              <div class="w-8 h-8 rounded-lg bg-[#292621] border border-[#3e3931] flex items-center justify-center text-[#c5a059]">
                <app-icon name="board" class="w-4 h-4"></app-icon>
              </div>
              <h3 class="text-sm font-bold text-slate-100">
                Hub de Salas y Retos
              </h3>
            </div>
            
            <p class="text-xs text-slate-400 mb-4 leading-relaxed">
              Explora las salas públicas creadas por otros jugadores, únete con un código de sala privada o mira partidas en directo.
            </p>

            <a routerLink="/challenges" 
               class="w-full py-2.5 px-4 rounded-xl bg-[#252320] hover:bg-[#302d28] border border-[#3e3a32] text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-center gap-2 transition-all">
              <span>Explorar Salas y Espectador</span>
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>

        </div>

      </div>

      <!-- MODAL DE SALA DE ESPERA (Reto propio creado: Pública o Privada) -->
      @if (activeChallenge()) {
        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 fade-in">
          <div class="w-full max-w-md bg-[#1b1a17] border border-[#3f3b33] rounded-2xl shadow-2xl p-6 sm:p-7 text-center">
            
            <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-[#262420] border border-[#3d3a33] flex items-center justify-center text-[#c5a059] animate-pulse">
              <app-icon name="hourglass" class="w-6 h-6 text-[#c5a059]"></app-icon>
            </div>

            <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider mb-2"
                 [class.bg-[#22271d]]="!activeChallenge()?.is_private"
                 [class.text-[#86aa5d]]="!activeChallenge()?.is_private"
                 [class.border-[#37452d]]="!activeChallenge()?.is_private"
                 [class.bg-[#2b251a]]="activeChallenge()?.is_private"
                 [class.text-[#c5a059]]="activeChallenge()?.is_private"
                 [class.border-[#483c27]]="activeChallenge()?.is_private">
              <span class="w-1.5 h-1.5 rounded-full" [class.bg-[#779952]]="!activeChallenge()?.is_private" [class.bg-[#c5a059]]="activeChallenge()?.is_private"></span>
              <span>{{ activeChallenge()?.is_private ? 'Sala Privada' : 'Sala Pública Abierta' }}</span>
            </div>

            <h3 class="text-xl font-bold text-slate-100">Sala de Espera de Partida</h3>
            <p class="text-xs text-slate-400 mt-1">
              Ritmo: <strong class="text-slate-200">{{ activeChallenge()?.game_mode?.name }}</strong> &bull; 
              Piezas: <strong class="text-slate-200 capitalize">{{ activeChallenge()?.color_preference }}</strong>
            </p>

            <!-- Código de Sala -->
            <div class="my-5 p-3.5 rounded-xl bg-[#131210] border border-[#2d2a26]">
              <span class="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">
                {{ activeChallenge()?.is_private ? 'Código de Invitación Privado' : 'Código de Sala Oficial' }}
              </span>
              <span class="text-2xl font-mono font-bold tracking-widest text-[#c5a059]">
                {{ activeChallenge()?.code }}
              </span>
            </div>

            <!-- Botón Copiar Enlace -->
            <div class="space-y-3">
              <button (click)="copyChallengeLink()" 
                      class="w-full py-2.5 px-4 rounded-xl bg-[#252320] hover:bg-[#2f2c27] border border-[#3d3a33] text-slate-100 text-xs font-semibold flex items-center justify-center gap-2 transition-colors">
                @if (copiedLink()) {
                  <app-icon name="check" class="w-4 h-4 text-[#86aa5d]"></app-icon>
                  <span class="text-[#86aa5d]">¡Enlace copiado al portapapeles!</span>
                } @else {
                  <app-icon name="copy" class="w-4 h-4 text-slate-300"></app-icon>
                  <span>Copiar Enlace de Invitación</span>
                }
              </button>

              <div class="flex items-center justify-center gap-2 text-xs text-slate-400 pt-1">
                <span class="w-2 h-2 rounded-full bg-[#c5a059] animate-ping"></span>
                <span>
                  {{ activeChallenge()?.is_private ? 'Esperando a que tu amigo ingrese con el código...' : 'Esperando oponente en la comunidad...' }}
                </span>
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
  isPrivate = signal<boolean>(false);
  activeChallenge = signal<GameChallenge | null>(null);

  isLoadingModes = signal<boolean>(true);
  isCreating = signal<boolean>(false);
  copiedLink = signal<boolean>(false);

  // Ratings Elo Reales extraídos de la base de datos
  blitzRating = computed(() => getUserRating(this.authService.currentUser(), 'blitz'));
  rapidRating = computed(() => getUserRating(this.authService.currentUser(), 'rapid'));
  bulletRating = computed(() => getUserRating(this.authService.currentUser(), 'bullet'));

  private pollInterval: any;
  private isCheckingChallenge = false;

  ngOnInit(): void {
    this.loadGameModes();

    // Verificación periódica si el reto activo fue aceptado por un oponente (cada 4s)
    this.pollInterval = setInterval(() => {
      if (this.activeChallenge()) {
        this.checkIfActiveChallengeAccepted();
      }
    }, 4000);
  }

  ngOnDestroy(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  getModeIcon(type: string): IconName {
    switch (type) {
      case 'bullet': return 'lightning';
      case 'blitz': return 'flame';
      case 'rapid': return 'timer';
      case 'classical': return 'hourglass';
      default: return 'timer';
    }
  }

  loadGameModes(): void {
    this.isLoadingModes.set(true);
    this.gameService.getGameModes().subscribe({
      next: (res) => {
        this.gameModes.set(res.game_modes);
        const defaultMode = res.game_modes.find(m => m.slug === 'blitz-3-2') || res.game_modes[0];
        this.selectedMode.set(defaultMode);
        this.isLoadingModes.set(false);
      },
      error: () => {
        this.isLoadingModes.set(false);
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
      is_private: this.isPrivate(),
    }).subscribe({
      next: (res) => {
        this.isCreating.set(false);
        this.activeChallenge.set(res.challenge);
      },
      error: (err) => {
        this.isCreating.set(false);
        if (err.error?.challenge) {
          this.activeChallenge.set(err.error.challenge);
        }
      }
    });
  }

  quickMatch(modeSlug: string): void {
    const mode = this.gameModes().find(m => m.slug === modeSlug);
    if (!mode) return;

    this.selectedMode.set(mode);
    this.colorPreference.set('random');
    this.isRated.set(true);
    this.isPrivate.set(false);
    this.onCreateChallenge();
  }

  copyChallengeLink(): void {
    const code = this.activeChallenge()?.code;
    if (!code) return;

    const url = `${window.location.origin}/game/${code}`;
    navigator.clipboard.writeText(url).then(() => {
      this.copiedLink.set(true);
      setTimeout(() => this.copiedLink.set(false), 2500);
    });
  }

  checkIfActiveChallengeAccepted(): void {
    const active = this.activeChallenge();
    if (!active || this.isCheckingChallenge) return;

    this.isCheckingChallenge = true;
    this.gameService.getChallenge(active.code).subscribe({
      next: (res) => {
        this.isCheckingChallenge = false;
        if (res.challenge.challenge_status === 'accepted' && res.challenge.game) {
          this.activeChallenge.set(null);
          this.router.navigate(['/game', res.challenge.game.code]);
        }
      },
      error: () => {
        this.isCheckingChallenge = false;
      }
    });
  }

  cancelActiveChallenge(): void {
    const code = this.activeChallenge()?.code;
    if (!code) return;

    this.gameService.cancelChallenge(code).subscribe({
      next: () => {
        this.activeChallenge.set(null);
      }
    });
  }
}
