import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, IconComponent],
  template: `
    <div class="min-h-dvh lg:min-h-screen grid lg:grid-cols-2">

      <!-- Panel de marca -->
      <div class="hidden lg:flex flex-col justify-between p-12 bg-[#0d1124] border-r border-[#232b4d] relative overflow-hidden">
        <div class="eyebrow">Chess Arena &middot; online</div>
        <div class="relative z-10">
          <h1 class="font-display text-6xl xl:text-7xl font-extrabold text-white leading-[0.98]">
            Cada jugada<br>cuenta.<br><span class="text-[#45d4be]">Juega.</span>
          </h1>
          <p class="text-slate-400 mt-6 max-w-sm">Partidas en tiempo real, ranking Elo y salas privadas para jugar con amigos.</p>
        </div>
        <div class="grid grid-cols-8 w-72 rotate-[-8deg] opacity-80 absolute -right-10 -bottom-10">
          @for (i of board; track $index) {
            <div class="aspect-square" [class.bg-[#2bb5a0]]="i % 2 === 0" [class.bg-[#e4efe9]]="i % 2 === 1"></div>
          }
        </div>
        <div class="eyebrow relative z-10">Elo FIDE &middot; K=32</div>
      </div>

      <!-- Formulario -->
      <div class="flex items-center justify-center p-5 sm:p-10">
        <div class="w-full max-w-md fade-in">
          <div class="lg:hidden flex items-center gap-2.5 mb-8">
            <div class="w-9 h-9 rounded-xl bg-[#2bb5a0] text-[#04141a] flex items-center justify-center"><app-icon name="crown" class="w-5 h-5"></app-icon></div>
            <span class="font-display text-xl font-extrabold text-white">Chess<span class="text-[#45d4be]">Arena</span></span>
          </div>

          <div class="eyebrow mb-2">Acceso</div>
          <h2 class="font-display text-4xl font-extrabold text-white">Bienvenido de vuelta</h2>
          <p class="text-sm text-slate-400 mt-2 mb-7">Ingresa tus credenciales para entrar a la arena.</p>

          @if (errorMessage()) {
            <div class="mb-5 p-3 rounded-xl bg-red-950/50 border border-red-800/60 text-red-200 text-xs flex items-center gap-2.5">
              <app-icon name="shield" class="w-4 h-4 text-red-400 shrink-0"></app-icon>
              <span>{{ errorMessage() }}</span>
            </div>
          }

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-4">
            <div>
              <label class="field-label">Correo o usuario</label>
              <input type="text" formControlName="login" placeholder="jugador1 o tu@correo.com" class="field" autocomplete="username">
              @if (loginForm.get('login')?.touched && loginForm.get('login')?.invalid) {
                <span class="text-[11px] text-red-400 mt-1 block">Este campo es requerido</span>
              }
            </div>

            <div>
              <label class="field-label">Contraseña</label>
              <div class="relative">
                <input [type]="showPassword() ? 'text' : 'password'" formControlName="password" placeholder="••••••••" class="field pr-11" autocomplete="current-password">
                <button type="button" (click)="toggleShowPassword()" aria-label="Mostrar contraseña"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                  @if (showPassword()) {
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>
                  } @else {
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  }
                </button>
              </div>
              @if (loginForm.get('password')?.touched && loginForm.get('password')?.invalid) {
                <span class="text-[11px] text-red-400 mt-1 block">Ingresa tu contraseña</span>
              }
            </div>

            <button type="submit" [disabled]="loginForm.invalid || isSubmitting()" class="btn btn-primary w-full !py-3.5 mt-2">
              @if (isSubmitting()) {
                <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>Verificando...</span>
              } @else {
                <span>Entrar</span>
              }
            </button>
          </form>

          <div class="mt-7 pt-6 border-t border-[#232b4d]">
            <div class="eyebrow mb-3 text-center">Perfiles de prueba</div>
            <div class="grid grid-cols-2 gap-2">
              <button type="button" (click)="fillCredentials('jugador1', 'password123')" class="btn btn-ghost !py-2.5 !text-xs">
                <app-icon name="user" class="w-4 h-4 text-[#f4b942]"></app-icon>Jugador 1
              </button>
              <button type="button" (click)="fillCredentials('jugador2', 'password123')" class="btn btn-ghost !py-2.5 !text-xs">
                <app-icon name="user" class="w-4 h-4 text-[#8b7cf6]"></app-icon>Jugador 2
              </button>
            </div>
          </div>

          <p class="text-center text-sm text-slate-400 mt-7">
            ¿No tienes cuenta?
            <a routerLink="/register" class="text-[#45d4be] font-bold hover:underline ml-1">Crear cuenta</a>
          </p>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  board = Array.from({ length: 64 }, (_, i) => (Math.floor(i / 8) + i) % 2);

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm: FormGroup = this.fb.group({
    login: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  showPassword = signal<boolean>(false);

  toggleShowPassword(): void {
    this.showPassword.update(v => !v);
  }

  fillCredentials(user: string, pass: string): void {
    this.loginForm.patchValue({
      login: user,
      password: pass,
    });
    this.errorMessage.set(null);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.router.navigate(['/lobby']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = err.error?.message || err.error?.errors?.login?.[0] || 'Error al iniciar sesión. Verifica tus datos.';
        this.errorMessage.set(msg);
      }
    });
  }
}
