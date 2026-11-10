import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { GameService } from '../../core/services/game.service';
import { GameMode, GameChallenge, Game, getUserRating } from '../../core/models';
import { IconComponent, IconName } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent],
  template: `
    <div class="page fade-in">

      <!-- ===== CABECERA DE PERFIL COMPETITIVO ===== -->
      <header class="surface p-5 sm:p-6 mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div class="flex items-center gap-4 min-w-0">
          <div class="relative shrink-0">
            <img [src]="authService.currentUser()?.avatar_url"
                 [alt]="authService.currentUser()?.username"
                 class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#161e36] ring-2 ring-[#f4b942]">
            <span class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#2bb5a0] ring-2 ring-[#0f1526]"></span>
          </div>
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <span class="fide-badge">{{ fideTitle() }}</span>
              <h1 class="font-display text-2xl sm:text-3xl font-extrabold text-white truncate">
                {{ authService.currentUser()?.name }}
              </h1>
              <span class="text-xs font-mono text-slate-400">&#64;{{ authService.currentUser()?.username }}</span>
            </div>

            <!-- Barra de efectividad (Victorias / Tablas / Derrotas) -->
            <div class="mt-2.5 max-w-md">
              <div class="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1 gap-3">
                <span>
                  <strong class="text-white">{{ totalGames() }}</strong> partidas &middot;
                  <strong class="text-[#45d4be]">{{ effectiveness() }}%</strong> efectividad
                </span>
                <span>
                  <span class="text-[#45d4be] font-bold" title="Victorias">{{ wins() }}V</span> /
                  <span class="text-[#f4b942] font-bold" title="Empates (Tablas)">{{ draws() }}E</span> /
                  <span class="text-red-400 font-bold" title="Derrotas">{{ losses() }}D</span>
                </span>
              </div>
              <div class="h-1.5 w-full rounded-full bg-[#0b1020] overflow-hidden flex">
                <div class="bg-[#2bb5a0] h-full" [style.width.%]="winRate()"></div>
                <div class="bg-[#f4b942] h-full" [style.width.%]="drawRate()"></div>
                <div class="bg-red-500/80 h-full" [style.width.%]="lossRate()"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tarjetas de Elo por Ritmo -->
        <div class="grid grid-cols-3 gap-2 sm:gap-3 shrink-0">
          <div class="surface-2 px-3.5 py-2.5 min-w-[92px]">
            <div class="flex items-center justify-between text-[10px] font-mono uppercase text-slate-400">
              <span>Blitz</span>
              <app-icon name="flame" class="w-3.5 h-3.5 text-[#f4b942]"></app-icon>
            </div>
            <div class="font-mono text-xl sm:text-2xl font-extrabold text-white mt-0.5">{{ blitzRating() }}</div>
            <div class="text-[10px] font-mono text-[#f4b942]">3+2 &middot; 5+3</div>
          </div>

          <div class="surface-2 px-3.5 py-2.5 min-w-[92px]">
            <div class="flex items-center justify-between text-[10px] font-mono uppercase text-slate-400">
              <span>Rapid</span>
              <app-icon name="timer" class="w-3.5 h-3.5 text-[#45d4be]"></app-icon>
            </div>
            <div class="font-mono text-xl sm:text-2xl font-extrabold text-white mt-0.5">{{ rapidRating() }}</div>
            <div class="text-[10px] font-mono text-[#45d4be]">10+0 &middot; 15+10</div>
          </div>

          <div class="surface-2 px-3.5 py-2.5 min-w-[92px]">
            <div class="flex items-center justify-between text-[10px] font-mono uppercase text-slate-400">
              <span>Bullet</span>
              <app-icon name="lightning" class="w-3.5 h-3.5 text-[#8b7cf6]"></app-icon>
            </div>
            <div class="font-mono text-xl sm:text-2xl font-extrabold text-white mt-0.5">{{ bulletRating() }}</div>
            <div class="text-[10px] font-mono text-[#8b7cf6]">1+0 &middot; 2+1</div>
          </div>
        </div>
      </header>

      <!-- ===== CUERPO PRINCIPAL DEL LOBBY ===== -->
      <div class="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

        <!-- COLUMNA IZQUIERDA (8 cols): CONSTRUCTOR DE PARTIDA OFICIAL -->
        <section class="xl:col-span-8 surface p-5 sm:p-7">
          <div class="flex flex-wrap items-center justify-between gap-2 pb-4 mb-5 border-b border-[#222c4e]">
            <div>
              <div class="eyebrow">Configurador FIDE</div>
              <h2 class="font-display text-2xl font-extrabold text-white mt-0.5">Crear nueva sala de juego</h2>
            </div>
            <span class="chip !text-[#45d4be]">
              <span class="w-2 h-2 rounded-full bg-[#2bb5a0]"></span>
              Respuesta instantánea
            </span>
          </div>

          <!-- PASO 1: RITMO DE JUEGO -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <label class="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span class="w-5 h-5 rounded-md bg-[#2bb5a0]/20 text-[#45d4be] font-mono text-[11px] flex items-center justify-center">1</span>
                <span>Cadencia de Reloj (Minutos + Incremento)</span>
              </label>
              <span class="text-[11px] font-mono text-slate-400">Reloj Fischer FIDE</span>
            </div>

            @if (isLoadingModes()) {
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                @for (i of [1,2,3,4,5,6]; track i) {
                  <div class="h-24 surface-2 animate-pulse"></div>
                }
              </div>
            } @else {
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                @for (mode of gameModes(); track mode.id) {
                  <button type="button"
                          (click)="selectMode(mode)"
                          class="opt p-3.5 sm:p-4 flex flex-col justify-between gap-2.5 relative"
                          [class.is-active]="selectedMode()?.id === mode.id">
                    <div class="flex items-center justify-between">
                      <span class="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider"
                            [class.text-[#45d4be]]="selectedMode()?.id === mode.id"
                            [class.text-slate-400]="selectedMode()?.id !== mode.id">
                        <app-icon [name]="getModeIcon(mode.type)" class="w-4 h-4"></app-icon>
                        {{ mode.type }}
                      </span>
                      @if (mode.slug === 'blitz-3-2') {
                        <span class="px-1.5 py-0.5 rounded text-[9px] font-mono font-extrabold uppercase bg-[#f4b942]/20 text-[#f4b942]">
                          Torneo
                        </span>
                      }
                    </div>

                    <div class="flex items-baseline justify-between">
                      <div class="font-display text-3xl sm:text-4xl font-extrabold text-white leading-none">
                        {{ mode.initial_time_seconds / 60 }}<span class="text-[#45d4be]">+{{ mode.increment_seconds }}</span>
                      </div>
                      <span class="text-[11px] font-semibold text-slate-400">{{ mode.name }}</span>
                    </div>
                  </button>
                }
              </div>
            }
          </div>

          <!-- PASO 2 y 3: COLOR Y MODALIDAD -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6 pt-6 border-t border-[#222c4e]">
            <!-- Color de piezas -->
            <div>
              <label class="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2 mb-3">
                <span class="w-5 h-5 rounded-md bg-[#2bb5a0]/20 text-[#45d4be] font-mono text-[11px] flex items-center justify-center">2</span>
                <span>Asignación de Color</span>
              </label>
              <div class="grid grid-cols-3 gap-2">
                <button type="button" (click)="colorPreference.set('white')"
                        class="opt py-3 px-2 flex flex-col items-center gap-2 text-xs font-bold"
                        [class.is-active]="colorPreference() === 'white'">
                  <span class="w-6 h-6 rounded-full bg-white border-2 border-slate-300 shadow-sm"></span>
                  <span>Blancas</span>
                </button>
                <button type="button" (click)="colorPreference.set('random')"
                        class="opt py-3 px-2 flex flex-col items-center gap-2 text-xs font-bold"
                        [class.is-active]="colorPreference() === 'random'">
                  <span class="w-6 h-6 rounded-full bg-gradient-to-br from-white via-slate-400 to-[#0d1221] border border-white/40"></span>
                  <span>Aleatorio</span>
                </button>
                <button type="button" (click)="colorPreference.set('black')"
                        class="opt py-3 px-2 flex flex-col items-center gap-2 text-xs font-bold"
                        [class.is-active]="colorPreference() === 'black'">
                  <span class="w-6 h-6 rounded-full bg-[#0d1221] border-2 border-[#4a5a8f]"></span>
                  <span>Negras</span>
                </button>
              </div>
            </div>

            <!-- Rankeada vs Casual -->
            <div>
              <label class="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2 mb-3">
                <span class="w-5 h-5 rounded-md bg-[#2bb5a0]/20 text-[#45d4be] font-mono text-[11px] flex items-center justify-center">3</span>
                <span>Impacto de Elo FIDE</span>
              </label>
              <div class="grid grid-cols-2 gap-2">
                <button type="button" (click)="isRated.set(true)"
                        class="opt py-3 px-3 flex flex-col items-center gap-1.5 text-xs font-bold"
                        [class.is-active-gold]="isRated()">
                  <div class="flex items-center gap-1.5 text-[#f4b942]">
                    <app-icon name="trophy" class="w-4 h-4"></app-icon>
                    <span>Rankeada</span>
                  </div>
                  <span class="text-[10px] font-mono text-slate-400">+16 / 0 / -16 Elo</span>
                </button>
                <button type="button" (click)="isRated.set(false)"
                        class="opt py-3 px-3 flex flex-col items-center gap-1.5 text-xs font-bold"
                        [class.is-active]="!isRated()">
                  <div class="flex items-center gap-1.5 text-slate-200">
                    <app-icon name="handshake" class="w-4 h-4 text-[#45d4be]"></app-icon>
                    <span>Amistosa</span>
                  </div>
                  <span class="text-[10px] font-mono text-slate-400">Sin variación Elo</span>
                </button>
              </div>
            </div>
          </div>

          <!-- PASO 4: VISIBILIDAD DE SALA -->
          <div class="mt-6 pt-6 border-t border-[#222c4e]">
            <label class="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2 mb-3">
              <span class="w-5 h-5 rounded-md bg-[#2bb5a0]/20 text-[#45d4be] font-mono text-[11px] flex items-center justify-center">4</span>
              <span>Acceso a la Sala</span>
            </label>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button type="button" (click)="isPrivate.set(false)"
                      class="opt p-3.5 flex items-start gap-3"
                      [class.is-active]="!isPrivate()">
                <div class="w-9 h-9 rounded-xl bg-[#2bb5a0]/15 text-[#45d4be] flex items-center justify-center shrink-0">
                  <app-icon name="board" class="w-5 h-5"></app-icon>
                </div>
                <div>
                  <div class="text-sm font-bold text-white">Abierta a la Comunidad</div>
                  <div class="text-xs text-slate-400 mt-0.5">Aparece al instante en el radar público para que cualquier jugador acepte.</div>
                </div>
              </button>

              <button type="button" (click)="isPrivate.set(true)"
                      class="opt p-3.5 flex items-start gap-3"
                      [class.is-active-gold]="isPrivate()">
                <div class="w-9 h-9 rounded-xl bg-[#f4b942]/15 text-[#f4b942] flex items-center justify-center shrink-0">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                </div>
                <div>
                  <div class="text-sm font-bold text-white">Privada con Código / Enlace</div>
                  <div class="text-xs text-slate-400 mt-0.5">Genera un código único de 8 caracteres para invitar a un amigo.</div>
                </div>
              </button>
            </div>
          </div>

          <!-- RESUMEN EN VIVO DEL TICKET + BOTÓN DE LANZAMIENTO -->
          <div class="mt-6 pt-5 border-t border-[#222c4e] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="flex flex-wrap items-center gap-2 text-xs">
              <span class="chip !text-white font-bold">
                {{ selectedMode()?.name || 'Elige ritmo' }}
              </span>
              <span class="chip">
                Color: <strong class="text-white capitalize">{{ colorPreference() === 'random' ? 'Azar' : (colorPreference() === 'white' ? 'Blancas' : 'Negras') }}</strong>
              </span>
              <span class="chip" [class.!text-[#f4b942]]="isRated()">
                {{ isRated() ? 'Rankeada (K=32)' : 'Amistosa' }}
              </span>
            </div>

            <button type="button"
                    (click)="onCreateChallenge()"
                    [disabled]="!selectedMode() || isCreating()"
                    class="btn btn-primary !py-3.5 !px-7 !text-sm shrink-0">
              @if (isCreating()) {
                <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>Abriendo sala...</span>
              } @else {
                <app-icon name="swords" class="w-4 h-4"></app-icon>
                <span>Lanzar Sala {{ isPrivate() ? 'Privada' : 'Pública' }}</span>
              }
            </button>
          </div>
        </section>

        <!-- COLUMNA DERECHA (4 cols): 1-CLICK + UNIRSE CON CÓDIGO + RADAR EN VIVO -->
        <aside class="xl:col-span-4 space-y-5">

          <!-- Emparejamiento Rápido 1-Click -->
          <section class="surface p-5">
            <div class="flex items-center justify-between mb-3">
              <div>
                <div class="eyebrow">1-Click Match</div>
                <h3 class="font-display text-lg font-bold text-white">Jugar al instante</h3>
              </div>
              <app-icon name="lightning" class="w-5 h-5 text-[#f4b942]"></app-icon>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <button type="button" (click)="quickMatch('blitz-3-2')"
                      class="opt p-3 text-center flex flex-col items-center gap-1">
                <app-icon name="flame" class="w-4 h-4 text-[#f4b942]"></app-icon>
                <span class="font-display text-xl font-extrabold text-white leading-none">3+2</span>
                <span class="text-[10px] text-slate-400 font-semibold">Blitz</span>
              </button>
              <button type="button" (click)="quickMatch('rapid-10-0')"
                      class="opt p-3 text-center flex flex-col items-center gap-1">
                <app-icon name="timer" class="w-4 h-4 text-[#45d4be]"></app-icon>
                <span class="font-display text-xl font-extrabold text-white leading-none">10+0</span>
                <span class="text-[10px] text-slate-400 font-semibold">Rapid</span>
              </button>
              <button type="button" (click)="quickMatch('bullet-1-0')"
                      class="opt p-3 text-center flex flex-col items-center gap-1">
                <app-icon name="lightning" class="w-4 h-4 text-[#8b7cf6]"></app-icon>
                <span class="font-display text-xl font-extrabold text-white leading-none">1+0</span>
                <span class="text-[10px] text-slate-400 font-semibold">Bullet</span>
              </button>
            </div>
          </section>

          <!-- Entrar con Código de Sala Privada directo desde el Lobby -->
          <section class="surface p-5">
            <div class="eyebrow mb-1">Invitación directa</div>
            <h3 class="font-display text-lg font-bold text-white mb-2.5">¿Tienes un código de sala?</h3>
            <form (ngSubmit)="joinByCode()" class="flex gap-2">
              <input type="text"
                     [(ngModel)]="quickJoinCode"
                     name="quickJoinCode"
                     maxlength="12"
                     placeholder="CÓDIGO (EJ: CH8A29FZ)"
                     class="field !py-2.5 font-mono font-bold uppercase tracking-widest text-xs !text-[#f4b942]">
              <button type="submit"
                      [disabled]="!quickJoinCode.trim() || isJoiningCode()"
                      class="btn btn-gold !py-2.5 !px-4 !text-xs shrink-0">
                {{ isJoiningCode() ? '...' : 'Entrar' }}
              </button>
            </form>
            @if (joinError()) {
              <p class="text-[11px] text-red-400 mt-2">{{ joinError() }}</p>
            }
          </section>

          <!-- Radar en Vivo: Retos Abiertos de la Comunidad -->
          <section class="surface p-5">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-[#2bb5a0] animate-pulse"></span>
                <h3 class="font-display text-base font-bold text-white">Retos abiertos ({{ openChallenges().length }})</h3>
              </div>
              <a routerLink="/challenges" class="text-xs font-bold text-[#45d4be] hover:underline">Ver todos →</a>
            </div>

            @if (openChallenges().length === 0) {
              <div class="surface-2 p-4 text-center text-xs text-slate-400">
                No hay retos esperando en este segundo. ¡Lanza el tuyo a la izquierda!
              </div>
            } @else {
              <div class="space-y-2">
                @for (chal of openChallenges().slice(0, 3); track chal.id) {
                  <div class="surface-2 p-3 flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2.5 min-w-0">
                      <img [src]="chal.challenger?.avatar_url" class="w-8 h-8 rounded-lg bg-[#0d1221] shrink-0" alt="">
                      <div class="min-w-0">
                        <div class="text-xs font-bold text-white truncate">{{ chal.challenger?.username }}</div>
                        <div class="text-[10px] font-mono text-slate-400">
                          {{ chal.game_mode?.name }} &middot; <span class="text-[#f4b942]">{{ getChallengeElo(chal) }} Elo</span>
                        </div>
                      </div>
                    </div>
                    @if (chal.challenger_id !== authService.currentUser()?.id) {
                      <button type="button" (click)="acceptOpenChallenge(chal.code)"
                              class="btn btn-primary !py-1.5 !px-3 !text-xs shrink-0">
                        Aceptar
                      </button>
                    } @else {
                      <span class="chip !text-[#f4b942]">Tu reto</span>
                    }
                  </div>
                }
              </div>
            }

            @if (liveGames().length > 0) {
              <div class="mt-4 pt-3 border-t border-[#222c4e] flex items-center justify-between text-xs">
                <span class="flex items-center gap-2 text-slate-300">
                  <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  <strong>{{ liveGames().length }}</strong> {{ liveGames().length === 1 ? 'partida en vivo' : 'partidas en vivo' }}
                </span>
                <a routerLink="/challenges" class="font-bold text-[#f4b942] hover:underline">Mirar en Chess TV →</a>
              </div>
            }
          </section>

          <!-- Historial Reciente de Partidas (Victorias / Empates-Tablas / Derrotas) -->
          <section class="surface p-5">
            <div class="flex items-center justify-between mb-3">
              <div>
                <div class="eyebrow">Registro FIDE</div>
                <h3 class="font-display text-base font-bold text-white">Tus últimas partidas</h3>
              </div>
              <a routerLink="/leaderboard" class="text-xs font-bold text-[#f4b942] hover:underline">Ranking →</a>
            </div>

            @if (recentGames().length === 0) {
              <div class="surface-2 p-4 text-center text-xs text-slate-400">
                Aún no tienes partidas finalizadas registradas.
              </div>
            } @else {
              <div class="space-y-2">
                @for (g of recentGames().slice(0, 5); track g.id) {
                  <a [routerLink]="['/game', g.code]"
                     class="surface-2 p-2.5 flex items-center justify-between gap-2 hover:border-[#2a3968] transition-colors">
                    <div class="flex items-center gap-2.5 min-w-0">
                      <span class="px-2 py-1 rounded-md font-mono text-[10px] font-extrabold uppercase shrink-0"
                            [ngClass]="{
                              'bg-[#2bb5a0]/20 text-[#45d4be]': getGameOutcome(g) === 'win',
                              'bg-[#f4b942]/20 text-[#f4b942]': getGameOutcome(g) === 'draw',
                              'bg-red-500/20 text-red-400': getGameOutcome(g) === 'loss'
                            }">
                        {{ getGameOutcome(g) === 'win' ? 'Victoria' : (getGameOutcome(g) === 'draw' ? 'Empate' : 'Derrota') }}
                      </span>
                      <div class="min-w-0">
                        <div class="text-xs font-bold text-white truncate">
                          vs {{ getOpponentName(g) }}
                        </div>
                        <div class="text-[10px] font-mono text-slate-400 truncate">
                          {{ g.game_mode?.name || 'Blitz' }} &middot; {{ getReasonLabel(g.end_reason) }}
                        </div>
                      </div>
                    </div>
                    <span class="font-mono text-xs font-extrabold shrink-0"
                          [class.text-[#45d4be]]="getGameOutcome(g) === 'win'"
                          [class.text-[#f4b942]]="getGameOutcome(g) === 'draw'"
                          [class.text-red-400]="getGameOutcome(g) === 'loss'">
                      {{ getGameEloDelta(g) }}
                    </span>
                  </a>
                }
              </div>
            }
          </section>
        </aside>
      </div>

      <!-- MODAL DE SALA DE ESPERA -->
      @if (activeChallenge()) {
        <div class="fixed inset-0 z-[60] bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4 fade-in">
          <div class="w-full max-w-md surface !rounded-b-none sm:!rounded-b-[20px] p-6 sm:p-7 text-center pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <div class="w-12 h-12 mx-auto mb-4 rounded-2xl bg-[#161e36] border border-[#28345c] flex items-center justify-center text-[#f4b942] animate-pulse">
              <app-icon name="hourglass" class="w-6 h-6"></app-icon>
            </div>
            <span class="chip mb-3"
                  [class.!text-[#45d4be]]="!activeChallenge()?.is_private"
                  [class.!text-[#f4b942]]="activeChallenge()?.is_private">
              {{ activeChallenge()?.is_private ? 'Sala privada con invitación' : 'Sala pública abierta' }}
            </span>
            <h3 class="font-display text-2xl font-bold text-white">Esperando oponente</h3>
            <p class="text-xs text-slate-400 mt-1">
              {{ activeChallenge()?.game_mode?.name }} &bull;
              <span class="capitalize">{{ activeChallenge()?.color_preference }}</span>
            </p>

            <div class="my-5 p-4 surface-2">
              <div class="eyebrow mb-1">{{ activeChallenge()?.is_private ? 'Comparte este código con tu rival' : 'Código oficial de sala' }}</div>
              <div class="font-mono text-3xl font-extrabold tracking-[0.25em] text-[#f4b942]">{{ activeChallenge()?.code }}</div>
            </div>

            <div class="space-y-2.5">
              <button (click)="copyChallengeLink()" class="btn btn-primary w-full">
                @if (copiedLink()) {
                  <app-icon name="check" class="w-4 h-4"></app-icon>
                  <span>¡Enlace copiado al portapapeles!</span>
                } @else {
                  <app-icon name="copy" class="w-4 h-4"></app-icon>
                  <span>Copiar enlace directo de invitación</span>
                }
              </button>
              <button (click)="cancelActiveChallenge()" class="btn btn-ghost w-full !py-2.5 !text-xs hover:!text-red-400">
                Cancelar sala
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

  openChallenges = signal<GameChallenge[]>([]);
  liveGames = signal<Game[]>([]);
  recentGames = signal<Game[]>([]);

  quickJoinCode = '';
  isJoiningCode = signal<boolean>(false);
  joinError = signal<string | null>(null);

  isLoadingModes = signal<boolean>(true);
  isCreating = signal<boolean>(false);
  copiedLink = signal<boolean>(false);

  blitzRating = computed(() => getUserRating(this.authService.currentUser(), 'blitz'));
  rapidRating = computed(() => getUserRating(this.authService.currentUser(), 'rapid'));
  bulletRating = computed(() => getUserRating(this.authService.currentUser(), 'bullet'));

  fideTitle = computed(() => {
    const r = Math.max(this.blitzRating(), this.rapidRating(), this.bulletRating());
    if (r >= 2000) return 'GM';
    if (r >= 1800) return 'IM';
    if (r >= 1600) return 'FM';
    if (r >= 1400) return 'CM';
    return 'CLUB';
  });

  totalGames = computed(() => this.authService.currentUser()?.total_games || 0);
  wins = computed(() => this.authService.currentUser()?.total_wins || 0);
  losses = computed(() => this.authService.currentUser()?.total_losses || 0);
  draws = computed(() => this.authService.currentUser()?.total_draws ?? Math.max(0, this.totalGames() - this.wins() - this.losses()));

  effectiveness = computed(() =>
    this.totalGames() > 0 ? Math.round(((this.wins() + this.draws() * 0.5) / this.totalGames()) * 100) : 0
  );
  winRate = computed(() => (this.totalGames() > 0 ? Math.round((this.wins() / this.totalGames()) * 100) : 0));
  drawRate = computed(() => (this.totalGames() > 0 ? Math.round((this.draws() / this.totalGames()) * 100) : 0));
  lossRate = computed(() => (this.totalGames() > 0 ? Math.max(0, 100 - this.winRate() - this.drawRate()) : 0));

  private pollInterval: any;
  private isCheckingChallenge = false;

  ngOnInit(): void {
    // Refrescar perfil y estadísticas (victorias, empates/tablas, derrotas y Elo) al entrar al Lobby
    this.authService.checkAuth();
    this.loadGameModes();
    this.loadCommunityActivity();

    this.pollInterval = setInterval(() => {
      if (this.activeChallenge()) {
        this.checkIfActiveChallengeAccepted();
      }
      if (typeof document === 'undefined' || !document.hidden) {
        this.loadCommunityActivity();
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

  loadCommunityActivity(): void {
    this.gameService.getOpenChallenges().subscribe({
      next: (res) => this.openChallenges.set(res.challenges || []),
    });
    this.gameService.getActiveGames().subscribe({
      next: (res) => this.liveGames.set(res.games || []),
    });
    const username = this.authService.currentUser()?.username;
    if (username) {
      this.gameService.getUserHistory(username).subscribe({
        next: (res) => {
          const valid = (res.games || []).filter(g => g.end_reason !== 'aborted');
          this.recentGames.set(valid);
        }
      });
    }
  }

  getGameOutcome(g: Game): 'win' | 'draw' | 'loss' {
    const myId = this.authService.currentUser()?.id;
    if (g.winner_id === null || g.winner_id === undefined) return 'draw';
    return Number(g.winner_id) === Number(myId) ? 'win' : 'loss';
  }

  getOpponentName(g: Game): string {
    const myId = this.authService.currentUser()?.id;
    if (Number(g.white_player_id) === Number(myId)) {
      return g.black_player?.username || 'Oponente';
    }
    return g.white_player?.username || 'Oponente';
  }

  getReasonLabel(reason?: string | null): string {
    switch (reason) {
      case 'checkmate': return 'Jaque Mate';
      case 'resignation': return 'Abandono';
      case 'timeout': return 'Tiempo agotado';
      case 'draw_agreed':
      case 'draw_agreement': return 'Tablas acordadas';
      case 'draw_rule': return 'Tablas FIDE';
      case 'stalemate': return 'Rey ahogado';
      default: return 'Finalizada';
    }
  }

  getGameEloDelta(g: Game): string {
    const myId = this.authService.currentUser()?.id;
    const isWhite = Number(g.white_player_id) === Number(myId);
    const change = isWhite ? g.white_rating_change : g.black_rating_change;
    if (change !== null && change !== undefined) {
      return `${change >= 0 ? '+' : ''}${change}`;
    }
    const out = this.getGameOutcome(g);
    return out === 'win' ? '+16' : (out === 'draw' ? '0' : '-16');
  }

  getChallengeElo(chal: GameChallenge): number {
    return getUserRating(chal.challenger, chal.game_mode?.type || 'blitz');
  }

  acceptOpenChallenge(code: string): void {
    this.gameService.acceptChallenge(code).subscribe({
      next: (res) => this.router.navigate(['/game', res.game.code]),
      error: () => this.loadCommunityActivity(),
    });
  }

  joinByCode(): void {
    const code = this.quickJoinCode.trim().toUpperCase();
    if (!code) return;
    this.isJoiningCode.set(true);
    this.joinError.set(null);

    this.gameService.acceptChallenge(code).subscribe({
      next: (res) => {
        this.isJoiningCode.set(false);
        this.router.navigate(['/game', res.game.code]);
      },
      error: (err) => {
        this.isJoiningCode.set(false);
        this.joinError.set(err.error?.message || 'Código no encontrado o sala ya ocupada.');
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

    // Si existe un reto público de otro jugador en ese modo, unir al instante
    const myId = this.authService.currentUser()?.id;
    const existing = this.openChallenges().find(
      c => c.game_mode?.slug === modeSlug && c.challenger_id !== myId
    );
    if (existing) {
      this.acceptOpenChallenge(existing.code);
      return;
    }

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
