import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeaderboardService, LeaderboardEntry } from '../../core/services/leaderboard.service';
import { IconComponent, IconName } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 fade-in">
      
      <!-- Encabezado de la Clasificación -->
      <div class="text-center max-w-2xl mx-auto mb-8">
        <div class="w-12 h-12 mx-auto mb-3 rounded-2xl bg-gradient-to-b from-[#292723] to-[#1e1d1a] border border-[#3d3a33] flex items-center justify-center text-[#c5a059] shadow-inner">
          <app-icon name="trophy" class="w-6 h-6 text-[#c5a059]"></app-icon>
        </div>
        <h1 class="text-3xl font-extrabold text-slate-100 tracking-tight">Tabla de Clasificación Oficial</h1>
        <p class="text-xs text-slate-400 mt-2">
          Puntuación Elo FIDE calculada con factor K=32 para competidores activos
        </p>

        <!-- Selector de Ritmo de Juego Vectorial -->
        <div class="inline-flex p-1.5 bg-[#171613] border border-[#2b2925] rounded-2xl mt-6 shadow-md">
          @for (m of modes; track m.slug) {
            <button type="button" 
                    (click)="changeMode(m.slug)"
                    [class.bg-[#262420]]="selectedMode() === m.slug"
                    [class.text-white]="selectedMode() === m.slug"
                    [class.border-[#c5a059]]="selectedMode() === m.slug"
                    class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 border border-transparent transition-all flex items-center gap-2">
              <app-icon [name]="m.icon" class="w-3.5 h-3.5"></app-icon>
              <span>{{ m.label }}</span>
            </button>
          }
        </div>
      </div>

      <!-- PODIO DE LOS 3 MEJORES JUGADORES (SIN EMOJIS) -->
      @if (leaderboard().length >= 3) {
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-10 items-end">
          
          <!-- 2° Lugar (Plata) -->
          <div class="bg-[#1b1a17] rounded-2xl p-5 border border-[#33302b] text-center relative order-2 md:order-1 shadow-lg transform md:-translate-y-2">
            <div class="w-7 h-7 rounded-full bg-slate-700 text-slate-200 font-bold font-mono text-xs flex items-center justify-center absolute -top-3.5 left-1/2 -translate-x-1/2 border-2 border-[#1b1a17] shadow">
              2
            </div>
            <img [src]="leaderboard()[1].user.avatar_url" class="w-16 h-16 rounded-full mx-auto mb-3 border-2 border-slate-400 shadow">
            <h3 class="text-base font-bold text-slate-100">{{ leaderboard()[1].user.username }}</h3>
            <span class="text-xs text-slate-400 font-mono">{{ leaderboard()[1].rating }} Elo</span>
            <div class="mt-3 pt-3 border-t border-[#292723] flex justify-around text-xs text-slate-400 font-mono">
              <div><span>Vic:</span> <strong class="text-[#86aa5d]">{{ leaderboard()[1].wins_count }}</strong></div>
              <div><span>Der:</span> <strong class="text-red-400">{{ leaderboard()[1].losses_count }}</strong></div>
            </div>
          </div>

          <!-- 1° Lugar (Oro con Corona Vectorial) -->
          <div class="bg-gradient-to-b from-[#26221a] to-[#1c1b18] rounded-2xl p-6 border-2 border-[#c5a059] text-center relative order-1 md:order-2 shadow-2xl transform md:-translate-y-6">
            <div class="w-9 h-9 rounded-full bg-[#c5a059] text-[#161512] flex items-center justify-center absolute -top-4.5 left-1/2 -translate-x-1/2 border-2 border-[#1c1b18] shadow">
              <app-icon name="crown" class="w-5 h-5 text-[#161512]"></app-icon>
            </div>
            <img [src]="leaderboard()[0].user.avatar_url" class="w-20 h-20 rounded-full mx-auto mb-3 border-4 border-[#c5a059] shadow-md">
            <span class="text-[9px] uppercase font-bold tracking-widest text-[#c5a059] block mb-0.5">Líder del Torneo</span>
            <h3 class="text-lg font-extrabold text-slate-100">{{ leaderboard()[0].user.username }}</h3>
            <span class="text-sm text-[#c5a059] font-mono font-bold">{{ leaderboard()[0].rating }} Elo</span>
            <div class="mt-4 pt-3 border-t border-[#363228] flex justify-around text-xs text-slate-300 font-mono">
              <div><span>Partidas:</span> <strong>{{ leaderboard()[0].games_count }}</strong></div>
              <div><span>Victorias:</span> <strong class="text-[#86aa5d]">{{ leaderboard()[0].wins_count }}</strong></div>
            </div>
          </div>

          <!-- 3° Lugar (Bronce) -->
          <div class="bg-[#1b1a17] rounded-2xl p-5 border border-[#33302b] text-center relative order-3 md:order-3 shadow-lg">
            <div class="w-7 h-7 rounded-full bg-amber-900 text-amber-200 font-bold font-mono text-xs flex items-center justify-center absolute -top-3.5 left-1/2 -translate-x-1/2 border-2 border-[#1b1a17] shadow">
              3
            </div>
            <img [src]="leaderboard()[2].user.avatar_url" class="w-16 h-16 rounded-full mx-auto mb-3 border-2 border-amber-700 shadow">
            <h3 class="text-base font-bold text-slate-100">{{ leaderboard()[2].user.username }}</h3>
            <span class="text-xs text-slate-400 font-mono">{{ leaderboard()[2].rating }} Elo</span>
            <div class="mt-3 pt-3 border-t border-[#292723] flex justify-around text-xs text-slate-400 font-mono">
              <div><span>Vic:</span> <strong class="text-[#86aa5d]">{{ leaderboard()[2].wins_count }}</strong></div>
              <div><span>Der:</span> <strong class="text-red-400">{{ leaderboard()[2].losses_count }}</strong></div>
            </div>
          </div>

        </div>
      }

      <!-- TABLA GENERAL DE RANKINGS -->
      <div class="bg-[#1b1a17] rounded-2xl border border-[#2b2925] overflow-hidden shadow-xl max-w-4xl mx-auto">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-[#141311] text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-[#292723]">
              <tr>
                <th class="py-3 px-4 text-center w-14">#</th>
                <th class="py-3 px-4">Jugador</th>
                <th class="py-3 px-4 text-right">Elo</th>
                <th class="py-3 px-4 text-center">Partidas</th>
                <th class="py-3 px-4 text-center">V / E / D</th>
                <th class="py-3 px-4 text-right">Efectividad</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#24221f]">
              @if (isLoading()) {
                <tr>
                  <td colspan="6" class="text-center py-12 text-slate-400">
                    <svg class="animate-spin w-6 h-6 mx-auto mb-2 text-[#c5a059]" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    Cargando clasificación en tiempo real...
                  </td>
                </tr>
              } @else if (leaderboard().length === 0) {
                <tr>
                  <td colspan="6" class="text-center py-10 text-slate-400 text-xs">
                    No se registran partidas en esta categoría aún.
                  </td>
                </tr>
              } @else {
                @for (entry of leaderboard(); track entry.id; let idx = $index) {
                  <tr class="hover:bg-[#201f1c] transition-colors">
                    <td class="py-3 px-4 text-center font-mono text-xs font-bold"
                        [class.text-[#c5a059]]="idx === 0"
                        [class.text-slate-300]="idx === 1"
                        [class.text-amber-600]="idx === 2"
                        [class.text-slate-500]="idx > 2">
                      {{ idx + 1 }}
                    </td>
                    <td class="py-3 px-4">
                      <div class="flex items-center gap-3">
                        <img [src]="entry.user.avatar_url" class="w-8 h-8 rounded-full bg-[#24221e] border border-[#36342e]">
                        <span class="font-bold text-slate-200">
                          {{ entry.user.username }}
                        </span>
                      </div>
                    </td>
                    <td class="py-3 px-4 text-right font-mono font-bold text-[#c5a059]">
                      {{ entry.rating }}
                    </td>
                    <td class="py-3 px-4 text-center font-mono text-slate-300">
                      {{ entry.games_count }}
                    </td>
                    <td class="py-3 px-4 text-center font-mono text-xs text-slate-400">
                      <span class="text-[#86aa5d]">{{ entry.wins_count }}</span> / 
                      <span class="text-slate-400">{{ entry.draws_count }}</span> / 
                      <span class="text-red-400">{{ entry.losses_count }}</span>
                    </td>
                    <td class="py-3 px-4 text-right font-mono text-xs text-slate-300">
                      {{ entry.games_count > 0 ? (entry.wins_count / entry.games_count * 100).toFixed(0) + '%' : '0%' }}
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `
})
export class LeaderboardComponent implements OnInit {
  private leaderboardService = inject(LeaderboardService);

  modes: Array<{ slug: string; label: string; icon: IconName }> = [
    { slug: 'blitz', label: 'Blitz (3+2 / 5+3)', icon: 'flame' },
    { slug: 'bullet', label: 'Bullet (1+0 / 2+1)', icon: 'lightning' },
    { slug: 'rapid', label: 'Rápida (10+0 / 15+10)', icon: 'timer' },
  ];

  selectedMode = signal<string>('blitz');
  leaderboard = signal<LeaderboardEntry[]>([]);
  isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.loadRankings();
  }

  changeMode(slug: string): void {
    this.selectedMode.set(slug);
    this.loadRankings();
  }

  loadRankings(): void {
    this.isLoading.set(true);
    this.leaderboardService.getLeaderboard(this.selectedMode()).subscribe({
      next: (res) => {
        this.leaderboard.set(res.leaderboard);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }
}
