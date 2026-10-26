import { Component, inject, computed, signal } from '@angular/core';
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
    <header class="sticky top-0 z-50 bg-[#171613]/95 backdrop-blur-md border-b border-[#2b2925] shadow-lg transition-all">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          
          <!-- Logo & Marca -->
          <div class="flex items-center gap-8">
            <a routerLink="/" (click)="closeMobileMenu()" class="flex items-center gap-3 group focus:outline-none">
              <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-[#2b2824] to-[#1a1917] border border-[#3f3c36] flex items-center justify-center shadow-inner group-hover:border-[#c5a059] transition-all">
                <svg class="w-6 h-6 text-[#c5a059]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 22H5v-2h14v2M17.15 7.62c-.32-.23-.74-.3-1.12-.17l-.87.3c-.34.12-.72.04-.98-.21L13 6.4V4c0-1.1-.9-2-2-2h-.5c-.28 0-.5.22-.5.5v1.65l-2.07 2.08c-.46.46-.77 1.05-.88 1.69l-.65 3.86c-.05.28.04.56.24.75.2.19.48.27.75.22l2.11-.35v3.1c0 .83.67 1.5 1.5 1.5h4c.83 0 1.5-.67 1.5-1.5v-2.38l1.45-1.45c.42-.42.66-.99.66-1.58v-4.5c0-.62-.26-1.22-.76-1.63z"/>
                </svg>
              </div>
              <div class="flex flex-col">
                <div class="flex items-center gap-1.5">
                  <span class="text-sm font-bold tracking-widest text-slate-100 uppercase group-hover:text-white transition-colors">
                    CHESS <span class="text-[#c5a059]">ARENA</span>
                  </span>
                  <span class="w-1.5 h-1.5 rounded-full bg-[#779952]"></span>
                </div>
                <span class="text-[9px] tracking-widest text-slate-400 font-mono">FIDE ONLINE PLATFORM</span>
              </div>
            </a>

            <!-- Enlaces de Navegación de Escritorio con Iconografía Vectorial -->
            <nav class="hidden md:flex items-center gap-1">
              <a routerLink="/lobby" routerLinkActive="bg-[#262420] text-white border-[#3e3b34]"
                 class="px-3 py-2 rounded-lg text-xs font-semibold tracking-wide text-slate-300 hover:text-white hover:bg-[#201f1c] border border-transparent transition-all flex items-center gap-2">
                <app-icon name="swords" class="w-4 h-4 text-[#779952]"></app-icon>
                <span>Jugar</span>
              </a>

              <a routerLink="/challenges" routerLinkActive="bg-[#262420] text-white border-[#3e3b34]"
                 class="px-3 py-2 rounded-lg text-xs font-semibold tracking-wide text-slate-300 hover:text-white hover:bg-[#201f1c] border border-transparent transition-all flex items-center gap-2">
                <app-icon name="board" class="w-4 h-4 text-[#c5a059]"></app-icon>
                <span>Salas y Retos</span>
              </a>

              <a routerLink="/leaderboard" routerLinkActive="bg-[#262420] text-white border-[#3e3b34]"
                 class="px-3 py-2 rounded-lg text-xs font-semibold tracking-wide text-slate-300 hover:text-white hover:bg-[#201f1c] border border-transparent transition-all flex items-center gap-2">
                <app-icon name="trophy" class="w-4 h-4 text-[#c5a059]"></app-icon>
                <span>Clasificación</span>
              </a>
            </nav>
          </div>

          <!-- Sección Derecha: Usuario o Auth + Botón Hamburguesa Móvil -->
          <div class="flex items-center gap-2 sm:gap-3">
            @if (authService.isAuthenticated()) {
              <!-- Usuario Autenticado -->
              <div class="flex items-center gap-2 sm:gap-3 bg-[#1d1c19] border border-[#2f2d29] py-1.5 px-2.5 sm:px-3 rounded-lg shadow-sm">
                <!-- Avatar -->
                <img [src]="authService.currentUser()?.avatar_url" 
                     [alt]="authService.currentUser()?.username" 
                     class="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#2a2824] border border-[#3e3b36]">
                
                <div class="flex flex-col">
                  <span class="text-xs font-semibold text-slate-100 leading-tight max-w-[80px] sm:max-w-none truncate">
                    {{ authService.currentUser()?.username }}
                  </span>
                  <span class="text-[10px] text-[#c5a059] font-mono font-medium leading-tight">
                    {{ userRating() }} Elo
                  </span>
                </div>

                <!-- Separador -->
                <div class="w-px h-5 sm:h-6 bg-[#2d2b27] mx-0.5 sm:mx-1"></div>

                <!-- Botón Salir -->
                <button (click)="onLogout()" 
                        title="Cerrar Sesión" 
                        class="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-[#292723] transition-colors focus:outline-none">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            } @else {
              <!-- Usuario No Autenticado -->
              <div class="flex items-center gap-2">
                <a routerLink="/login" 
                   (click)="closeMobileMenu()"
                   class="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#22211e] transition-colors">
                  Iniciar Sesión
                </a>
                <a routerLink="/register" 
                   (click)="closeMobileMenu()"
                   class="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-[#779952] hover:bg-[#86aa5d] shadow transition-all transform active:scale-95">
                  Registrarse
                </a>
              </div>
            }

            <!-- Botón de Menú Móvil (Hamburguesa / Cerrar) -->
            <button type="button"
                    (click)="toggleMobileMenu()" 
                    class="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-[#22201c] border border-[#2e2c27] focus:outline-none transition-colors ml-0.5"
                    [attr.aria-expanded]="isMobileMenuOpen()"
                    aria-label="Abrir menú de navegación">
              <app-icon [name]="isMobileMenuOpen() ? 'x' : 'menu'" class="w-5 h-5 text-[#c5a059]"></app-icon>
            </button>
          </div>

        </div>
      </div>

      <!-- Menú Móvil Superior Desplegable -->
      @if (isMobileMenuOpen()) {
        <div class="md:hidden border-t border-[#292723] bg-[#161512] px-4 pt-3 pb-4 space-y-1.5 shadow-2xl fade-in">
          <a routerLink="/lobby" 
             (click)="closeMobileMenu()"
             routerLinkActive="bg-[#262420] text-white border-[#3e3b34]"
             class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#201f1c] border border-transparent transition-all">
            <div class="w-7 h-7 rounded-lg bg-[#201f1c] border border-[#302e29] flex items-center justify-center text-[#779952]">
              <app-icon name="swords" class="w-4 h-4"></app-icon>
            </div>
            <div class="flex flex-col">
              <span class="text-slate-100 font-bold">Jugar</span>
              <span class="text-[10px] text-slate-400">Crear sala oficial o partida rápida</span>
            </div>
          </a>

          <a routerLink="/challenges" 
             (click)="closeMobileMenu()"
             routerLinkActive="bg-[#262420] text-white border-[#3e3b34]"
             class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#201f1c] border border-transparent transition-all">
            <div class="w-7 h-7 rounded-lg bg-[#201f1c] border border-[#302e29] flex items-center justify-center text-[#c5a059]">
              <app-icon name="board" class="w-4 h-4"></app-icon>
            </div>
            <div class="flex flex-col">
              <span class="text-slate-100 font-bold">Salas y Retos</span>
              <span class="text-[10px] text-slate-400">Retos abiertos, unirse con código o TV en vivo</span>
            </div>
          </a>

          <a routerLink="/leaderboard" 
             (click)="closeMobileMenu()"
             routerLinkActive="bg-[#262420] text-white border-[#3e3b34]"
             class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#201f1c] border border-transparent transition-all">
            <div class="w-7 h-7 rounded-lg bg-[#201f1c] border border-[#302e29] flex items-center justify-center text-[#c5a059]">
              <app-icon name="trophy" class="w-4 h-4"></app-icon>
            </div>
            <div class="flex flex-col">
              <span class="text-slate-100 font-bold">Clasificación</span>
              <span class="text-[10px] text-slate-400">Tabla de posiciones y rankings FIDE</span>
            </div>
          </a>
        </div>
      }
    </header>

    <!-- Barra de Navegación Móvil Inferior (Thumb-Friendly Bottom App Bar) -->
    <nav class="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#161513]/95 backdrop-blur-md border-t border-[#292723] px-2 py-1.5 flex items-center justify-around shadow-[0_-4px_25px_rgba(0,0,0,0.6)]">
      <a routerLink="/lobby" 
         (click)="closeMobileMenu()"
         routerLinkActive="text-[#c5a059] bg-[#22201c] border-[#383329]"
         [routerLinkActiveOptions]="{exact: false}"
         class="flex-1 flex flex-col items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-slate-400 hover:text-slate-200 border border-transparent transition-all">
        <app-icon name="swords" class="w-5 h-5"></app-icon>
        <span class="text-[10px] font-semibold tracking-wide">Jugar</span>
      </a>

      <a routerLink="/challenges" 
         (click)="closeMobileMenu()"
         routerLinkActive="text-[#c5a059] bg-[#22201c] border-[#383329]"
         [routerLinkActiveOptions]="{exact: false}"
         class="flex-1 flex flex-col items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-slate-400 hover:text-slate-200 border border-transparent transition-all">
        <app-icon name="board" class="w-5 h-5"></app-icon>
        <span class="text-[10px] font-semibold tracking-wide">Salas y Retos</span>
      </a>

      <a routerLink="/leaderboard" 
         (click)="closeMobileMenu()"
         routerLinkActive="text-[#c5a059] bg-[#22201c] border-[#383329]"
         [routerLinkActiveOptions]="{exact: false}"
         class="flex-1 flex flex-col items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-slate-400 hover:text-slate-200 border border-transparent transition-all">
        <app-icon name="trophy" class="w-5 h-5"></app-icon>
        <span class="text-[10px] font-semibold tracking-wide">Clasificación</span>
      </a>
    </nav>
  `
})
export class NavbarComponent {
  authService = inject(AuthService);
  private router = inject(Router);

  isMobileMenuOpen = signal<boolean>(false);
  userRating = computed(() => getUserRating(this.authService.currentUser(), 'blitz'));

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

