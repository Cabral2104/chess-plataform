import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="sticky top-0 z-50 bg-[#1e1d1a]/95 backdrop-blur-md border-b border-[#302e2b] shadow-md transition-all">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          
          <!-- Logo & Marca -->
          <div class="flex items-center gap-8">
            <a routerLink="/" class="flex items-center gap-3 group focus:outline-none">
              <div class="w-10 h-10 rounded-lg bg-[#2b2926] border border-[#3e3b37] flex items-center justify-center shadow-inner group-hover:border-chess-gold transition-colors">
                <!-- Icono de Caballo / Knight estilizado sobrio -->
                <svg class="w-6 h-6 text-chess-gold" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 22H5v-2h14v2M17.15 7.62c-.32-.23-.74-.3-1.12-.17l-.87.3c-.34.12-.72.04-.98-.21L13 6.4V4c0-1.1-.9-2-2-2h-.5c-.28 0-.5.22-.5.5v1.65l-2.07 2.08c-.46.46-.77 1.05-.88 1.69l-.65 3.86c-.05.28.04.56.24.75.2.19.48.27.75.22l2.11-.35v3.1c0 .83.67 1.5 1.5 1.5h4c.83 0 1.5-.67 1.5-1.5v-2.38l1.45-1.45c.42-.42.66-.99.66-1.58v-4.5c0-.62-.26-1.22-.76-1.63z"/>
                </svg>
              </div>
              <div class="flex flex-col">
                <span class="text-base font-bold tracking-wider text-slate-100 uppercase group-hover:text-white transition-colors">
                  Chess <span class="text-chess-gold">Arena</span>
                </span>
                <span class="text-[10px] tracking-widest text-slate-400 font-mono -mt-1">MULTIJUGADOR</span>
              </div>
            </a>

            <!-- Enlaces de Navegación de Escritorio -->
            <nav class="hidden md:flex items-center gap-1">
              <a routerLink="/lobby" routerLinkActive="bg-[#2d2a27] text-white border-[#45423d]"
                 class="px-3.5 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-[#282623] border border-transparent transition-all flex items-center gap-2">
                <svg class="w-4 h-4 text-chess-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Jugar
              </a>

              <a routerLink="/challenges" routerLinkActive="bg-[#2d2a27] text-white border-[#45423d]"
                 class="px-3.5 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-[#282623] border border-transparent transition-all flex items-center gap-2">
                <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Salas y Retos
              </a>

              <a routerLink="/leaderboard" routerLinkActive="bg-[#2d2a27] text-white border-[#45423d]"
                 class="px-3.5 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-[#282623] border border-transparent transition-all flex items-center gap-2">
                <svg class="w-4 h-4 text-chess-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                Clasificación
              </a>
            </nav>
          </div>

          <!-- Sección Derecha: Usuario o Auth -->
          <div class="flex items-center gap-3">
            @if (authService.isAuthenticated(); as user) {
              <!-- Usuario Autenticado -->
              <div class="flex items-center gap-3 bg-[#262421] border border-[#383531] py-1.5 px-3 rounded-lg shadow-sm">
                <!-- Avatar -->
                <img [src]="authService.currentUser()?.avatar_url" 
                     [alt]="authService.currentUser()?.username" 
                     class="w-7 h-7 rounded-full bg-[#363431] border border-[#4a4742]">
                
                <div class="flex flex-col">
                  <span class="text-xs font-semibold text-slate-100 leading-tight">
                    {{ authService.currentUser()?.username }}
                  </span>
                  <span class="text-[10px] text-chess-gold font-mono leading-tight">
                    Elo 1200
                  </span>
                </div>

                <!-- Separador -->
                <div class="w-px h-6 bg-[#3a3733] mx-1"></div>

                <!-- Botón Salir -->
                <button (click)="onLogout()" 
                        title="Cerrar Sesión" 
                        class="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-[#33302c] transition-colors focus:outline-none">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            } @else {
              <!-- Usuario No Autenticado -->
              <div class="flex items-center gap-2">
                <a routerLink="/login" 
                   class="px-3.5 py-1.5 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-[#282623] transition-colors">
                  Iniciar Sesión
                </a>
                <a routerLink="/register" 
                   class="px-4 py-1.5 rounded-md text-sm font-semibold text-white bg-chess-primary hover:bg-chess-primaryHover shadow-sm transition-all transform active:scale-95">
                  Registrarse
                </a>
              </div>
            }
          </div>

        </div>
      </div>
    </header>
  `
})
export class NavbarComponent {
  authService = inject(AuthService);
  private router = inject(Router);

  onLogout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      }
    });
  }
}
