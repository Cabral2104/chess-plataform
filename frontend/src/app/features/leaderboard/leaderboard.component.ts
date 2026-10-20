import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeaderboardService, LeaderboardEntry } from '../../core/services/leaderboard.service';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 fade-in">
      
      <!-- Encabezado de la Clasificación -->
      <div class="text-center max-w-2xl mx-auto mb-8">
        <div class="w-12 h-12 mx-auto mb-3 rounded-lg bg-[#2a2825] border border-[#3e3b37] flex items-center justify-center text-chess-gold shadow-inner">
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/>
          </svg>
        </div>
        <h1 class="text-3xl font-extrabold text-slate-100 tracking-tight">Tabla de Clasificación Oficial</h1>
        <p class="text-sm text-slate-400 mt-2">
          Puntuación Elo FIDE calculada con factor K=32 para competidores activos
        </p>

        <!-- Selector de Ritmo de Juego -->
        <div class="inline-flex p-1 bg-[#1c1b18] border border-[#33302c] rounded-xl mt-6">
          @for (m of modes; track m.slug) {
            <button type="button" 
                    (click)="changeMode(m.slug)"
                    [class.bg-[#2f2c27]]="selectedMode() === m.slug"
                    [class.text-white]="selectedMode() === m.slug"
                    [class.border-chess-gold]="selectedMode() === m.slug"
                    class="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 border border-transparent transition-all flex items-center gap-1.5">
              <span>{{ m.icon }}</span>
              <span>{{ m.label }}</span>
            </button>
          }
        </div>
      </div>

      <!-- PODIO DE LOS 3 MEJORES JUGADORES -->
      @if (leaderboard().length >= 3) {
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-10 items-end">
          
          <!-- 2° Lugar (Plata) -->
          <div class="chess-card rounded-2xl p-5 border border-[#3e3c38] text-center relative order-2 md:order-1 shadow-lg transform md:-translate-y-2">
            <div class="w-8 h-8 rounded-full bg-slate-700 text-slate-200 font-bold font-mono text-sm flex items-center justify-center absolute -top-4 left-1/2 -translate-x-1/2 border-2 border-[#21201d]">
              2
            </div>
            <img [src]="leaderboard()[1].user.avatar_url" class="w-16 h-16 rounded-full mx-auto mb-3 border-2 border-slate-400 shadow">
            <h3 class="text-base font-bold text-slate-100">{{ leaderboard()[1].user.username }}</h3>
            <span class="text-xs text-slate-400 font-mono">{{ leaderboard()[1].rating }} Elo</span>
            <div class="mt-3 pt-3 border-t border-[#302e2b] flex justify-around text-xs text-slate-400 font-mono">
              <div><span>Vic:</span> <strong class="text-emerald-400">{{ leaderboard()[1].wins_count }}</strong></div>
              <div><span>Der:</span> <strong class="text-red-400">{{ leaderboard()[1].losses_count }}</strong></div>
            </div>
          </div>

          <!-- 1° Lugar (Oro) -->
          <div class="chess-card rounded-2xl p-6 border-2 border-chess-gold text-center relative order-1 md:order-2 shadow-2xl transform md:-translate-y-6 bg-gradient-to-b from-[#2a261f] to-[#21201d]">
            <div class="w-10 h-10 rounded-full bg-amber-500 text-[#161512] font-black font-mono text-base flex items-center justify-center absolute -top-5 left-1/2 -translate-x-1/2 border-2 border-[#21201d] shadow">
              👑
            </div>
            <img [src]="leaderboard()[0].user.avatar_url" class="w-20 h-20 rounded-full mx-auto mb-3 border-4 border-chess-gold shadow-md">
            <span class="text-[10px] uppercase font-bold tracking-widest text-chess-gold block">Gran Maestro Líder</span>
            <h3 class="text-lg font-extrabold text-slate-100">{{ leaderboard()[0].user.username }}</h3>
            <span class="text-sm text-chess-gold font-mono font-bold">{{ leaderboard()[0].rating }} Elo</span>
            <div class="mt-4 pt-3 border-t border-[#3a352c] flex justify-around text-xs text-slate-300 font-mono">
              <div><span>Partidas:</span> <strong>{{ leaderboard()[0].games_count }}</strong></div>
              <div><span>Victorias:</span> <strong class="text-emerald-400">{{ leaderboard()[0].wins_count }}</strong></div>
            </div>
          </div>

          <!-- 3° Lugar (Bronce) -->
          <div class="chess-card rounded-2xl p-5 border border-[#3e3c38] text-center relative order-3 md:order-3 shadow-lg">
            <div class="w-8 h-8 rounded-full bg-amber-900 text-amber-200 font-bold font-mono text-sm flex items-center justify-center absolute -top-4 left-1/2 -translate-x-1/2 border-2 border-[#21201d]">
              3
            </div>
            <img [src]="leaderboard()[2].user.avatar_url" class="w-16 h-16 rounded-full mx-auto mb-3 border-2 border-amber-700 shadow">
            <h3 class="text-base font-bold text-slate-100">{{ leaderboard()[2].user.username }}</h3>
            <span class="text-xs text-slate-400 font-mono">{{ leaderboard()[2].rating }} Elo</span>
            <div class="mt-3 pt-3 border-t border-[#302e2b] flex justify-around text-xs text-slate-400 font-mono">
              <div><span>Vic:</span> <strong class="text-emerald-400">{{ leaderboard()[2].wins_count }}</strong></div>
              <div><span>Der:</span> <strong class="text-red-400">{{ leaderboard()[2].losses_count }}</strong></div>
            </div>
          </div>

        </div>
      }

      <!-- TABLA GENERAL DE RANKINGS -->
      <div class="chess-panel rounded-xl border border-[#363431] overflow-hidden shadow-xl max-w-4xl mx-auto">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-[#181715] text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-[#302e2b]">
              <tr>
                <th class="py-3 px-4 text-center w-14">#</th>
                <th class="py-3 px-4">Jugador</th>
                <th class="py-3 px-4 text-right">Elo</th>
                <th class="py-3 px-4 text-center">Partidas</th>
                <th class="py-3 px-4 text-center">V / E / D</th>
                <th class="py-3 px-4 text-right">Efectividad</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#2a2825]">
              @if (isLoading()) {
                <tr>
                  <td colspan="6" class="text-center py-12 text-slate-400">
                    <svg class="animate-spin w-6 h-6 mx-auto mb-2 text-chess-gold" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    Cargando clasificación en tiempo real...
                  </td>
                </tr>
              } @else if (leaderboard().length === 0) {
                <tr>
                  <td colspan="6" class="text-center py-10 text-slate-400">
                    No se registran partidas en esta categoría aún.
                  </td>
                </tr>
              } @else {
                @for (entry of leaderboard(); track entry.id; let idx = $index) {
                  <tr class="hover:bg-[#23211e] transition-colors">
                    <td class="py-3 px-4 text-center font-mono text-xs font-bold"
                        [class.text-chess-gold]="idx === 0"
                        [class.text-slate-300]="idx === 1"
                        [class.text-amber-600]="idx === 2"
                        [class.text-slate-500]="idx > 2">
                      {{ idx + 1 }}
                    </td>
                    <td class="py-3 px-4">
                      <div class="flex items-center gap-3">
                        <img [src]="entry.user.avatar_url" class="w-8 h-8 rounded-full bg-[#2a2825] border border-[#3e3b37]">
                        <span class="font-bold text-slate-200">
                          {{ entry.user.username }}
                        </span>
                      </div>
                    </td>
                    <td class="py-3 px-4 text-right font-mono font-bold text-chess-gold">
                      {{ entry.rating }}
                    </td>
                    <td class="py-3 px-4 text-center font-mono text-slate-300">
                      {{ entry.games_count }}
                    </td>
                    <td class="py-3 px-4 text-center font-mono text-xs text-slate-400">
                      <span class="text-emerald-400">{{ entry.wins_count }}</span> / 
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

  modes = [
    { slug: 'blitz', label: 'Blitz (3+2 / 5+3)', icon: '🔥' },
    { slug: 'bullet', label: 'Bullet (1+0 / 2+1)', icon: '⚡' },
    { slug: 'rapid', label: 'Rápida (10+0 / 15+10)', icon: '⏱️' },
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
