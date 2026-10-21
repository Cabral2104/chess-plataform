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
    <div class="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div class="w-full max-w-md bg-[#1c1b18] border border-[#2d2a26] rounded-2xl shadow-2xl p-6 sm:p-8 fade-in relative overflow-hidden">
        
        <!-- Detalle decorativo superior sutil -->
        <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#c5a059] to-transparent opacity-40"></div>

        <!-- Encabezado de Torneo -->
        <div class="text-center mb-6">
          <div class="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-b from-[#292723] to-[#1e1d1a] border border-[#3d3a33] flex items-center justify-center text-[#c5a059] shadow-inner">
            <svg class="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 22H5v-2h14v2M17.15 7.62c-.32-.23-.74-.3-1.12-.17l-.87.3c-.34.12-.72.04-.98-.21L13 6.4V4c0-1.1-.9-2-2-2h-.5c-.28 0-.5.22-.5.5v1.65l-2.07 2.08c-.46.46-.77 1.05-.88 1.69l-.65 3.86c-.05.28.04.56.24.75.2.19.48.27.75.22l2.11-.35v3.1c0 .83.67 1.5 1.5 1.5h4c.83 0 1.5-.67 1.5-1.5v-2.38l1.45-1.45c.42-.42.66-.99.66-1.58v-4.5c0-.62-.26-1.22-.76-1.63z"/>
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-slate-100 tracking-tight">Acceso a la Arena</h1>
          <p class="text-xs text-slate-400 mt-1">Ingresa tus credenciales oficiales de jugador</p>
        </div>

        <!-- Alerta de Error -->
        @if (errorMessage()) {
          <div class="mb-5 p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 text-xs flex items-center gap-2.5">
            <app-icon name="shield" class="w-4 h-4 text-red-400 flex-shrink-0"></app-icon>
            <span>{{ errorMessage() }}</span>
          </div>
        }

        <!-- Formulario -->
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-4">
          
          <!-- Campo Usuario / Email -->
          <div>
            <label class="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Correo o Nombre de Usuario
            </label>
            <div class="relative">
              <input type="text" 
                     formControlName="login"
                     placeholder="ej. jugador1 o tu@correo.com"
                     class="w-full bg-[#141311] border border-[#302e2a] rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#c5a059] transition-all">
            </div>
            @if (loginForm.get('login')?.touched && loginForm.get('login')?.invalid) {
              <span class="text-[11px] text-red-400 mt-1 block">Este campo es requerido</span>
            }
          </div>

          <!-- Campo Contraseña -->
          <div>
            <label class="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Contraseña
            </label>
            <div class="relative">
              <input [type]="showPassword() ? 'text' : 'password'" 
                     formControlName="password"
                     placeholder="••••••••"
                     class="w-full bg-[#141311] border border-[#302e2a] rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#c5a059] transition-all pr-10">
              <button type="button" 
                      (click)="toggleShowPassword()" 
                      class="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 focus:outline-none">
                @if (showPassword()) {
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                } @else {
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                }
              </button>
            </div>
            @if (loginForm.get('password')?.touched && loginForm.get('password')?.invalid) {
              <span class="text-[11px] text-red-400 mt-1 block">Ingresa tu contraseña</span>
            }
          </div>

          <!-- Botón de Envío -->
          <button type="submit" 
                  [disabled]="loginForm.invalid || isSubmitting()"
                  class="w-full mt-2 py-3 px-4 rounded-xl bg-[#779952] hover:bg-[#86aa5d] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 transform active:scale-98">
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

        <!-- Accesos Rápidos para Evaluación (Sin Emojis) -->
        <div class="mt-6 pt-5 border-t border-[#292724]">
          <span class="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2.5 text-center">
            Perfiles de Prueba
          </span>
          <div class="grid grid-cols-2 gap-2">
            <button type="button" 
                    (click)="fillCredentials('jugador1', 'password123')"
                    class="py-2 px-3 bg-[#22201d] hover:bg-[#2b2824] border border-[#33302b] rounded-lg text-xs font-semibold text-slate-200 transition-all flex items-center justify-center gap-2">
              <app-icon name="user" class="w-3.5 h-3.5 text-[#c5a059]"></app-icon>
              <span>Jugador 1</span>
            </button>
            <button type="button" 
                    (click)="fillCredentials('jugador2', 'password123')"
                    class="py-2 px-3 bg-[#22201d] hover:bg-[#2b2824] border border-[#33302b] rounded-lg text-xs font-semibold text-slate-200 transition-all flex items-center justify-center gap-2">
              <app-icon name="user" class="w-3.5 h-3.5 text-slate-400"></app-icon>
              <span>Jugador 2</span>
            </button>
          </div>
        </div>

        <!-- Enlace a Registro -->
        <p class="text-center text-xs text-slate-400 mt-6">
          ¿No tienes una cuenta aún?
          <a routerLink="/register" class="text-[#c5a059] hover:underline font-semibold ml-1">
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
