import { Component, inject, computed, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { IconComponent } from '../icon/icon.component';
import { getUserRating } from '../../../core/models';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, IconComponent],
  template: `
    <!-- ===== SIDEBAR (Escritorio en vistas de plataforma) ===== -->
    <aside [class.!hidden]="compact" class="hidden lg:flex flex-col h-full bg-[#0b1020] border-r border-[#222c4e] p-5 select-none">
      <!-- Marca -->
      <a routerLink="/lobby" class="flex items-center gap-3 mb-8 focus:outline-none group">
        <div class="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#2bb5a0] to-[#1a8a78] text-[#04141a] flex items-center justify-center shadow-[0_6px_20px_-6px_rgba(43,181,160,0.65)]">
          <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 22H5v-2h14v2M17.15 7.62c-.32-.23-.74-.3-1.12-.17l-.87.3c-.34.12-.72.04-.98-.21L13 6.4V4c0-1.1-.9-2-2-2h-.5c-.28 0-.5.22-.5.5v1.65l-2.07 2.08c-.46.46-.77 1.05-.88 1.69l-.65 3.86c-.05.28.04.56.24.75.2.19.48.27.75.22l2.11-.35v3.1c0 .83.67 1.5 1.5 1.5h4c.83 0 1.5-.67 1.5-1.5v-2.38l1.45-1.45c.42-.42.66-.99.66-1.58v-4.5c0-.62-.26-1.22-.76-1.63z"/>
          </svg>
        </div>
        <div class="leading-none">
          <div class="font-display text-xl font-extrabold text-white tracking-tight">
            Chess<span class="text-[#45d4be]">Arena</span>
          </div>
          <div class="flex items-center gap-1.5 mt-1">
            <span class="w-1.5 h-1.5 rounded-full bg-[#2bb5a0]"></span>
            <span class="font-mono text-[10px] uppercase tracking-widest text-slate-400">FIDE Online</span>
          </div>
        </div>
      </a>

      <!-- Navegación Principal -->
      <div class="eyebrow mb-2.5 px-3">Arena</div>
      <nav class="flex flex-col gap-1.5">
        <a routerLink="/lobby"
           routerLinkActive="!bg-[#2bb5a0] !text-[#04141a] shadow-[0_6px_20px_-6px_rgba(43,181,160,0.55)]"
           class="flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-bold text-slate-300 hover:bg-[#161e36] hover:text-white">
          <span class="flex items-center gap-3">
            <app-icon name="swords" class="w-5 h-5"></app-icon>
            <span>Jugar</span>
          </span>
          <span class="text-[10px] font-mono uppercase tracking-wider opacity-75">Lobby</span>
        </a>

        <a routerLink="/challenges"
           routerLinkActive="!bg-[#2bb5a0] !text-[#04141a] shadow-[0_6px_20px_-6px_rgba(43,181,160,0.55)]"
           class="flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-bold text-slate-300 hover:bg-[#161e36] hover:text-white">
          <span class="flex items-center gap-3">
            <app-icon name="board" class="w-5 h-5"></app-icon>
            <span>Salas y TV</span>
          </span>
          <span class="w-2 h-2 rounded-full bg-[#45d4be]"></span>
        </a>

        <a routerLink="/leaderboard"
           routerLinkActive="!bg-[#2bb5a0] !text-[#04141a] shadow-[0_6px_20px_-6px_rgba(43,181,160,0.55)]"
           class="flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-bold text-slate-300 hover:bg-[#161e36] hover:text-white">
          <span class="flex items-center gap-3">
            <app-icon name="trophy" class="w-5 h-5"></app-icon>
            <span>Clasificación</span>
          </span>
          <span class="text-[10px] font-mono uppercase tracking-wider opacity-75">Top</span>
        </a>
      </nav>

      <!-- Tarjeta de Ratings Rápidos del Jugador -->
      @if (authService.isAuthenticated()) {
        <div class="mt-6 pt-6 border-t border-[#222c4e]">
          <div class="flex items-center justify-between px-1 mb-2.5">
            <span class="eyebrow !text-[10px]">Tu Elo FIDE</span>
            <span class="fide-badge">{{ fideTitle() }}</span>
          </div>
          <div class="grid grid-cols-3 gap-1.5">
            <div class="surface-2 p-2.5 text-center">
              <div class="flex items-center justify-center gap-1 text-[10px] text-slate-400 font-semibold">
                <app-icon name="flame" class="w-3 h-3 text-[#f4b942]"></app-icon>Blitz
              </div>
              <div class="font-mono text-sm font-extrabold text-white mt-0.5">{{ blitzRating() }}</div>
            </div>
            <div class="surface-2 p-2.5 text-center">
              <div class="flex items-center justify-center gap-1 text-[10px] text-slate-400 font-semibold">
                <app-icon name="timer" class="w-3 h-3 text-[#45d4be]"></app-icon>Rapid
              </div>
              <div class="font-mono text-sm font-extrabold text-white mt-0.5">{{ rapidRating() }}</div>
            </div>
            <div class="surface-2 p-2.5 text-center">
              <div class="flex items-center justify-center gap-1 text-[10px] text-slate-400 font-semibold">
                <app-icon name="lightning" class="w-3 h-3 text-[#8b7cf6]"></app-icon>Bullet
              </div>
              <div class="font-mono text-sm font-extrabold text-white mt-0.5">{{ bulletRating() }}</div>
            </div>
          </div>
        </div>
      }

      <!-- Pie del Sidebar: Perfil + Estado Servidor -->
      <div class="mt-auto space-y-3">
        <div class="px-3 py-2 rounded-xl bg-[#0f1629] border border-[#1d2645] flex items-center justify-between text-[11px]">
          <span class="flex items-center gap-2 text-slate-400">
            <span class="w-2 h-2 rounded-full bg-[#2bb5a0]"></span>
            Servidor FIDE
          </span>
          <span class="font-mono text-[#45d4be] font-semibold">K=32 &middot; Activo</span>
        </div>

        @if (authService.isAuthenticated()) {
          <div class="surface-2 p-3 flex items-center gap-3">
            <img [src]="authService.currentUser()?.avatar_url"
                 [alt]="authService.currentUser()?.username"
                 class="w-10 h-10 rounded-xl bg-[#0d1124] ring-1 ring-[#334272]">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-1.5">
                <span class="fide-badge !px-1 !py-0 !text-[9px]">{{ fideTitle() }}</span>
                <span class="text-sm font-bold text-white truncate">{{ authService.currentUser()?.username }}</span>
              </div>
              <div class="text-[11px] font-mono text-slate-400 mt-0.5">
                {{ authService.currentUser()?.total_wins || 0 }}V &middot; {{ authService.currentUser()?.total_games || 0 }} partidas
              </div>
            </div>
            <button (click)="onLogout()" title="Cerrar sesión" aria-label="Cerrar sesión"
                    class="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-[#0d1124]">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
            </button>
          </div>
        } @else {
          <div class="flex flex-col gap-2">
            <a routerLink="/register" class="btn btn-primary w-full">Crear cuenta</a>
            <a routerLink="/login" class="btn btn-ghost w-full">Iniciar sesión</a>
          </div>
        }
      </div>
    </aside>

    <!-- ===== TOPBAR (Móvil / Tablet, y Escritorio en modo Partida Focus) ===== -->
    <header [ngClass]="{ 'lg:hidden': !compact }" class="sticky top-0 z-50 bg-[#0b1020] border-b border-[#222c4e] pt-[env(safe-area-inset-top)]">
      <div class="max-w-[1600px] mx-auto flex items-center justify-between h-14 px-3.5 sm:px-6">
        <div class="flex items-center gap-4">
          <a routerLink="/lobby" class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-[#2bb5a0] text-[#04141a] flex items-center justify-center">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 22H5v-2h14v2M17.15 7.62c-.32-.23-.74-.3-1.12-.17l-.87.3c-.34.12-.72.04-.98-.21L13 6.4V4c0-1.1-.9-2-2-2h-.5c-.28 0-.5.22-.5.5v1.65l-2.07 2.08c-.46.46-.77 1.05-.88 1.69l-.65 3.86c-.05.28.04.56.24.75.2.19.48.27.75.22l2.11-.35v3.1c0 .83.67 1.5 1.5 1.5h4c.83 0 1.5-.67 1.5-1.5v-2.38l1.45-1.45c.42-.42.66-.99.66-1.58v-4.5c0-.62-.26-1.22-.76-1.63z"/>
              </svg>
            </div>
            <span class="font-display text-lg font-extrabold text-white">Chess<span class="text-[#45d4be]">Arena</span></span>
          </a>

          @if (compact) {
            <nav class="hidden md:flex items-center gap-1 pl-3 border-l border-[#222c4e]">
              <a routerLink="/lobby" class="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 hover:text-white hover:bg-[#161e36] flex items-center gap-1.5">
                <app-icon name="arrow-left" class="w-3.5 h-3.5 text-[#45d4be]"></app-icon>
                <span>Lobby</span>
              </a>
              <a routerLink="/challenges" class="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 hover:text-white hover:bg-[#161e36]">Salas y TV</a>
              <a routerLink="/leaderboard" class="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 hover:text-white hover:bg-[#161e36]">Ranking</a>
            </nav>
          }
        </div>

        @if (authService.isAuthenticated()) {
          <div class="flex items-center gap-2.5">
            <div class="text-right leading-tight hidden xs:block">
              <div class="flex items-center justify-end gap-1.5">
                <span class="fide-badge !px-1 !py-0 !text-[9px]">{{ fideTitle() }}</span>
                <span class="text-xs font-bold text-white max-w-[120px] truncate">{{ authService.currentUser()?.username }}</span>
              </div>
              <div class="text-[10px] font-mono text-[#f4b942]">{{ userRating() }} Elo</div>
            </div>
            <img [src]="authService.currentUser()?.avatar_url" class="w-8 h-8 rounded-xl bg-[#161e36] ring-1 ring-[#334272]" alt="avatar">
            <button (click)="onLogout()" aria-label="Cerrar sesión" title="Cerrar sesión" class="p-2 rounded-lg text-slate-400 hover:text-red-400">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
            </button>
          </div>
        } @else {
          <div class="flex items-center gap-2">
            <a routerLink="/login" class="px-3 py-2 text-xs font-bold text-slate-200">Entrar</a>
            <a routerLink="/register" class="btn btn-primary !py-2 !px-3 !text-xs">Registro</a>
          </div>
        }
      </div>
    </header>

    <!-- ===== BARRA INFERIOR (Móvil / Tablet) ===== -->
    <nav [class.!hidden]="compact" class="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0b1020] border-t border-[#222c4e] grid grid-cols-3 pb-[env(safe-area-inset-bottom)]">
      <a routerLink="/lobby" routerLinkActive="!text-[#45d4be]" class="flex flex-col items-center gap-1 py-2.5 text-slate-400">
        <app-icon name="swords" class="w-5 h-5"></app-icon>
        <span class="text-[10px] font-bold">Jugar</span>
      </a>
      <a routerLink="/challenges" routerLinkActive="!text-[#45d4be]" class="flex flex-col items-center gap-1 py-2.5 text-slate-400">
        <app-icon name="board" class="w-5 h-5"></app-icon>
        <span class="text-[10px] font-bold">Salas y TV</span>
      </a>
      <a routerLink="/leaderboard" routerLinkActive="!text-[#45d4be]" class="flex flex-col items-center gap-1 py-2.5 text-slate-400">
        <app-icon name="trophy" class="w-5 h-5"></app-icon>
        <span class="text-[10px] font-bold">Ranking</span>
      </a>
    </nav>
  `
})
export class NavbarComponent {
  @Input() compact = false;

  authService = inject(AuthService);
  private router = inject(Router);

  isMobileMenuOpen = signal<boolean>(false);

  blitzRating = computed(() => getUserRating(this.authService.currentUser(), 'blitz'));
  rapidRating = computed(() => getUserRating(this.authService.currentUser(), 'rapid'));
  bulletRating = computed(() => getUserRating(this.authService.currentUser(), 'bullet'));
  userRating = computed(() => Math.max(this.blitzRating(), this.rapidRating(), this.bulletRating()));

  fideTitle = computed(() => {
    const r = this.userRating();
    if (r >= 2000) return 'GM';
    if (r >= 1800) return 'IM';
    if (r >= 1600) return 'FM';
    if (r >= 1400) return 'CM';
    return 'CLUB';
  });

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  onLogout(): void {
    this.closeMobileMenu();
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      }
    });
  }
}
