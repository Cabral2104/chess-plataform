import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeaderboardService, LeaderboardEntry } from '../../core/services/leaderboard.service';
import { AuthService } from '../../core/services/auth.service';
import { IconComponent, IconName } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="page fade-in">

      <!-- Cabecera -->
      <header class="mb-7 flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div>
          <div class="eyebrow mb-1.5">Escalafón Mundial FIDE</div>
          <h1 class="font-display text-3xl sm:text-5xl font-extrabold text-white leading-[1.05]">
            Clasificación <span class="text-[#f4b942]">Oficial</span>
          </h1>
          <p class="text-sm text-slate-400 mt-1.5">
            Puntuación Elo calculada en tiempo real con factor reglamentario K=32.
          </p>
        </div>

        <!-- Selector de Ritmo + Buscador -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div class="flex gap-1.5 overflow-x-auto no-scrollbar">
            @for (m of modes; track m.slug) {
              <button type="button" (click)="changeMode(m.slug)"
                      class="opt shrink-0 whitespace-nowrap px-4 py-2.5 text-xs font-bold flex items-center gap-2"
                      [class.is-active]="selectedMode() === m.slug">
                <app-icon [name]="m.icon" class="w-4 h-4 text-[#f4b942]"></app-icon>
                <span>{{ m.label }}</span>
              </button>
            }
          </div>
          <input type="text"
                 [(ngModel)]="searchQuery"
                 placeholder="Buscar jugador..."
                 class="field !py-2 !text-xs sm:w-48">
        </div>
      </header>

      <!-- Banner de tu posición actual en la tabla -->
      @if (myRankEntry(); as mine) {
        <div class="surface-2 p-3.5 sm:px-5 mb-6 flex items-center justify-between gap-3 border-[#45d4be]/50">
          <div class="flex items-center gap-3 min-w-0">
            <span class="px-2.5 py-1 rounded-lg bg-[#2bb5a0] text-[#04141a] font-mono text-xs font-extrabold">
              Puesto #{{ mine.rank }}
            </span>
            <span class="text-xs sm:text-sm font-bold text-white truncate">
              Tu posición actual en {{ selectedMode() | uppercase }}
            </span>
          </div>
          <span class="font-mono text-sm sm:text-base font-extrabold text-[#f4b942] shrink-0">
            {{ mine.entry.rating }} Elo
          </span>
        </div>
      }

      <!-- PODIO DE LOS 3 PRIMEROS -->
      @if (leaderboard().length >= 3 && !searchQuery.trim()) {
        <div class="grid grid-cols-3 gap-2.5 sm:gap-5 mb-8 items-end">

          <!-- #2 Plata -->
          <div class="surface p-3.5 sm:p-5 text-center order-1 relative">
            <div class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-700 text-white font-mono text-xs font-extrabold mb-1">2</div>
            <img [src]="leaderboard()[1].user.avatar_url" class="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl mx-auto my-2 bg-[#161e36] ring-2 ring-slate-400" alt="">
            <div class="flex items-center justify-center gap-1">
              <span class="fide-badge !px-1 !py-0 !text-[9px]">{{ getFideTitle(leaderboard()[1].rating) }}</span>
              <span class="text-xs sm:text-base font-bold text-white truncate">{{ leaderboard()[1].user.username }}</span>
            </div>
            <div class="font-mono text-sm sm:text-lg font-extrabold text-slate-200 mt-0.5">{{ leaderboard()[1].rating }} Elo</div>
            <div class="hidden sm:flex justify-center gap-3 text-[11px] font-mono text-slate-400 mt-2 pt-2 border-t border-[#222c4e]">
              <span class="text-[#45d4be]">{{ leaderboard()[1].wins_count }}V</span>
              <span>{{ leaderboard()[1].draws_count }}E</span>
              <span class="text-red-400">{{ leaderboard()[1].losses_count }}D</span>
            </div>
          </div>

          <!-- #1 Oro -->
          <div class="surface p-4 sm:p-6 text-center order-2 !border-[#f4b942] sm:pb-8 relative">
            <div class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#f4b942] text-[#141004] text-[10px] font-extrabold uppercase tracking-wider mb-1">
              <app-icon name="crown" class="w-3.5 h-3.5"></app-icon>
              <span>Campeón</span>
            </div>
            <img [src]="leaderboard()[0].user.avatar_url" class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl mx-auto my-2 bg-[#161e36] ring-2 ring-[#f4b942]" alt="">
            <div class="flex items-center justify-center gap-1.5">
              <span class="fide-badge">{{ getFideTitle(leaderboard()[0].rating) }}</span>
              <span class="text-sm sm:text-xl font-extrabold text-white truncate font-display">{{ leaderboard()[0].user.username }}</span>
            </div>
            <div class="font-mono text-base sm:text-2xl font-extrabold text-[#f4b942] mt-0.5">{{ leaderboard()[0].rating }} Elo</div>
            <div class="hidden sm:flex justify-center gap-3 text-xs font-mono text-slate-300 mt-3 pt-2.5 border-t border-[#222c4e]">
              <span class="text-[#45d4be] font-bold">{{ leaderboard()[0].wins_count }}V</span>
              <span>{{ leaderboard()[0].draws_count }}E</span>
              <span class="text-red-400">{{ leaderboard()[0].losses_count }}D</span>
            </div>
          </div>

          <!-- #3 Bronce -->
          <div class="surface p-3.5 sm:p-5 text-center order-3 relative">
            <div class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-800 text-amber-100 font-mono text-xs font-extrabold mb-1">3</div>
            <img [src]="leaderboard()[2].user.avatar_url" class="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl mx-auto my-2 bg-[#161e36] ring-2 ring-amber-700" alt="">
            <div class="flex items-center justify-center gap-1">
              <span class="fide-badge !px-1 !py-0 !text-[9px]">{{ getFideTitle(leaderboard()[2].rating) }}</span>
              <span class="text-xs sm:text-base font-bold text-white truncate">{{ leaderboard()[2].user.username }}</span>
            </div>
            <div class="font-mono text-sm sm:text-lg font-extrabold text-amber-300 mt-0.5">{{ leaderboard()[2].rating }} Elo</div>
            <div class="hidden sm:flex justify-center gap-3 text-[11px] font-mono text-slate-400 mt-2 pt-2 border-t border-[#222c4e]">
              <span class="text-[#45d4be]">{{ leaderboard()[2].wins_count }}V</span>
              <span>{{ leaderboard()[2].draws_count }}E</span>
              <span class="text-red-400">{{ leaderboard()[2].losses_count }}D</span>
            </div>
          </div>
        </div>
      }

      <!-- TABLA DE CLASIFICACIÓN COMPLETA -->
      <section class="surface overflow-hidden">
        <div class="hidden sm:grid grid-cols-12 gap-2 px-5 py-3 eyebrow border-b border-[#222c4e] bg-[#0c1122]">
          <span class="col-span-1">#</span>
          <span class="col-span-4">Jugador</span>
          <span class="col-span-2 text-right">Rating Elo</span>
          <span class="col-span-2 text-center">V / E / D</span>
          <span class="col-span-3 text-right">Efectividad</span>
        </div>

        @if (isLoading()) {
          <div class="py-14 text-center text-slate-400 text-sm">
            <svg class="animate-spin w-6 h-6 mx-auto mb-2 text-[#45d4be]" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            Cargando escalafón oficial...
          </div>
        } @else if (filteredLeaderboard().length === 0) {
          <div class="py-12 text-center text-slate-400 text-sm">No se encontraron jugadores con ese criterio.</div>
        } @else {
          @for (item of filteredLeaderboard(); track item.entry.id) {
            <div class="grid grid-cols-12 gap-2 items-center px-4 sm:px-5 py-3.5 border-b border-[#222c4e] last:border-0 hover:bg-[#161e36]"
                 [class.bg-[#112a38]]="item.entry.user_id === authService.currentUser()?.id">
              <span class="col-span-2 sm:col-span-1 font-mono text-sm font-extrabold"
                    [class.text-[#f4b942]]="item.rank === 1"
                    [class.text-slate-300]="item.rank === 2"
                    [class.text-amber-500]="item.rank === 3"
                    [class.text-slate-500]="item.rank > 3">
                #{{ item.rank }}
              </span>

              <div class="col-span-6 sm:col-span-4 flex items-center gap-2.5 min-w-0">
                <img [src]="item.entry.user.avatar_url" class="w-9 h-9 rounded-xl bg-[#161e36] shrink-0" alt="">
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5">
                    <span class="fide-badge !px-1 !py-0 !text-[9px]">{{ getFideTitle(item.entry.rating) }}</span>
                    <span class="font-bold text-white truncate">{{ item.entry.user.username }}</span>
                    @if (item.entry.user_id === authService.currentUser()?.id) {
                      <span class="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-[#2bb5a0] text-[#04141a]">Tú</span>
                    }
                  </div>
                  <span class="text-[10px] font-mono text-slate-400 sm:hidden">
                    {{ item.entry.wins_count }}V / {{ item.entry.draws_count }}E / {{ item.entry.losses_count }}D
                  </span>
                </div>
              </div>

              <span class="col-span-4 sm:col-span-2 text-right font-mono text-base font-extrabold text-[#f4b942]">
                {{ item.entry.rating }}
              </span>

              <span class="hidden sm:block col-span-2 text-center font-mono text-xs">
                <span class="text-[#45d4be] font-bold">{{ item.entry.wins_count }}</span> /
                <span class="text-slate-400">{{ item.entry.draws_count }}</span> /
                <span class="text-red-400">{{ item.entry.losses_count }}</span>
              </span>

              <div class="hidden sm:flex col-span-3 items-center justify-end gap-2.5">
                <div class="w-24 h-1.5 rounded-full bg-[#0b1020] overflow-hidden">
                  <div class="h-full bg-[#2bb5a0]" [style.width.%]="getWinRate(item.entry)"></div>
                </div>
                <span class="font-mono text-xs font-bold text-slate-200 w-9 text-right">
                  {{ getWinRate(item.entry) }}%
                </span>
              </div>
            </div>
          }
        }
      </section>
    </div>
  `
})
export class LeaderboardComponent implements OnInit {
  private leaderboardService = inject(LeaderboardService);
  authService = inject(AuthService);

  modes: Array<{ slug: string; label: string; icon: IconName }> = [
    { slug: 'blitz', label: 'Blitz', icon: 'flame' },
    { slug: 'rapid', label: 'Rapid', icon: 'timer' },
    { slug: 'bullet', label: 'Bullet', icon: 'lightning' },
  ];

  selectedMode = signal<string>('blitz');
  leaderboard = signal<LeaderboardEntry[]>([]);
  isLoading = signal<boolean>(true);
  searchQuery = '';

  filteredLeaderboard = computed(() => {
    const q = this.searchQuery.trim().toLowerCase();
    return this.leaderboard()
      .map((entry, idx) => ({ entry, rank: idx + 1 }))
      .filter(item => !q || item.entry.user.username.toLowerCase().includes(q));
  });

  myRankEntry = computed(() => {
    const myId = this.authService.currentUser()?.id;
    if (!myId) return null;
    const idx = this.leaderboard().findIndex(e => e.user_id === myId);
    if (idx === -1) return null;
    return { rank: idx + 1, entry: this.leaderboard()[idx] };
  });

  ngOnInit(): void {
    this.loadRankings();
  }

  changeMode(slug: string): void {
    this.selectedMode.set(slug);
    this.loadRankings();
  }

  getFideTitle(rating: number): string {
    if (rating >= 2000) return 'GM';
    if (rating >= 1800) return 'IM';
    if (rating >= 1600) return 'FM';
    if (rating >= 1400) return 'CM';
    return 'CLUB';
  }

  getWinRate(entry: LeaderboardEntry): number {
    return entry.games_count > 0
      ? Math.round(((entry.wins_count + entry.draws_count * 0.5) / entry.games_count) * 100)
      : 0;
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
