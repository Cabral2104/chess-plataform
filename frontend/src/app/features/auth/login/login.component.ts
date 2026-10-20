import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div class="w-full max-w-md bg-[#21201d] border border-[#363431] rounded-xl shadow-2xl p-6 sm:p-8 fade-in">
        
        <!-- Encabezado -->
        <div class="text-center mb-6">
          <div class="w-12 h-12 mx-auto mb-3 rounded-lg bg-[#2a2825] border border-[#3e3b37] flex items-center justify-center text-chess-gold shadow-inner">
            <svg class="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 22H5v-2h14v2M17.15 7.62c-.32-.23-.74-.3-1.12-.17l-.87.3c-.34.12-.72.04-.98-.21L13 6.4V4c0-1.1-.9-2-2-2h-.5c-.28 0-.5.22-.5.5v1.65l-2.07 2.08c-.46.46-.77 1.05-.88 1.69l-.65 3.86c-.05.28.04.56.24.75.2.19.48.27.75.22l2.11-.35v3.1c0 .83.67 1.5 1.5 1.5h4c.83 0 1.5-.67 1.5-1.5v-2.38l1.45-1.45c.42-.42.66-.99.66-1.58v-4.5c0-.62-.26-1.22-.76-1.63z"/>
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-slate-100 tracking-tight">Bienvenido a Chess Arena</h1>
          <p class="text-sm text-slate-400 mt-1">Inicia sesión con tu correo o nombre de usuario</p>
        </div>

        <!-- Alerta de Error -->
        @if (errorMessage()) {
          <div class="mb-5 p-3 rounded-lg bg-red-950/60 border border-red-800/80 text-red-200 text-sm flex items-center gap-2.5">
            <svg class="w-5 h-5 flex-shrink-0 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{{ errorMessage() }}</span>
          </div>
        }

        <!-- Formulario -->
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-4">
          
          <!-- Campo Usuario / Email -->
          <div>
            <label class="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
              Correo o Nombre de Usuario
            </label>
            <div class="relative">
              <input type="text" 
                     formControlName="login"
                     placeholder="ej. jugador1 o tu@correo.com"
                     class="w-full bg-[#181715] border border-[#383531] rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-chess-gold/80 transition-colors">
            </div>
            @if (loginForm.get('login')?.touched && loginForm.get('login')?.invalid) {
              <span class="text-xs text-red-400 mt-1 block">Este campo es requerido</span>
            }
          </div>

          <!-- Campo Contraseña -->
          <div>
            <label class="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
              Contraseña
            </label>
            <div class="relative">
              <input [type]="showPassword() ? 'text' : 'password'" 
                     formControlName="password"
                     placeholder="••••••••"
                     class="w-full bg-[#181715] border border-[#383531] rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-chess-gold/80 transition-colors pr-10">
              <button type="button" 
                      (click)="toggleShowPassword()" 
                      class="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 focus:outline-none">
                @if (showPassword()) {
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                } @else {
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                }
              </button>
            </div>
            @if (loginForm.get('password')?.touched && loginForm.get('password')?.invalid) {
              <span class="text-xs text-red-400 mt-1 block">Ingresa tu contraseña</span>
            }
          </div>

          <!-- Botón de Envío -->
          <button type="submit" 
                  [disabled]="loginForm.invalid || isSubmitting()"
                  class="w-full mt-2 py-2.5 px-4 rounded-lg bg-chess-primary hover:bg-chess-primaryHover disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 transform active:scale-98">
            @if (isSubmitting()) {
              <svg class="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span>Verificando credenciales...</span>
            } @else {
              <span>Entrar a la Plataforma</span>
            }
          </button>
        </form>

        <!-- Accesos Rápidos para Evaluación Universitaria -->
        <div class="mt-6 pt-5 border-t border-[#302e2b]">
          <span class="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2 text-center">
            Acceso Rápido para Pruebas (Test Users)
          </span>
          <div class="grid grid-cols-2 gap-2">
            <button type="button" 
                    (click)="fillCredentials('jugador1', 'password123')"
                    class="py-1.5 px-2.5 bg-[#2b2926] hover:bg-[#33302c] border border-[#3e3b37] rounded text-xs text-slate-200 transition-colors text-center">
              👤 Jugador 1
            </button>
            <button type="button" 
                    (click)="fillCredentials('jugador2', 'password123')"
                    class="py-1.5 px-2.5 bg-[#2b2926] hover:bg-[#33302c] border border-[#3e3b37] rounded text-xs text-slate-200 transition-colors text-center">
              👤 Jugador 2
            </button>
          </div>
        </div>

        <!-- Enlace a Registro -->
        <p class="text-center text-xs text-slate-400 mt-6">
          ¿No tienes una cuenta aún?
          <a routerLink="/register" class="text-chess-gold hover:underline font-semibold ml-1">
            Crear cuenta gratis
          </a>
        </p>

      </div>
    </div>
  `
})
export class LoginComponent {
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
