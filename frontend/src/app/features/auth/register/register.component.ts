import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Validador para confirmar que ambas contraseñas coincidan.
 */
export const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password');
  const confirm = control.get('password_confirmation');
  return password && confirm && password.value !== confirm.value ? { passwordMismatch: true } : null;
};

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div class="w-full max-w-lg chess-panel g-arch px-6 pb-8 pt-20 sm:px-10 fade-in">
        
        <!-- Encabezado -->
        <div class="text-center mb-6">
          <span class="g-glyph block text-6xl text-chess-gold mb-2" aria-hidden="true">&#9813;&#xFE0E;</span>
          <h1 class="text-5xl text-slate-100">Crea tu cuenta</h1>
          <p class="text-sm text-slate-400 mt-1">Empieza con 1200 puntos Elo y compite en tiempo real</p>
        </div>

        <!-- Alerta de Error -->
        @if (errorMessage()) {
          <div class="mb-5 p-3  bg-red-950/60 border border-red-800/80 text-red-200 text-sm flex items-center gap-2.5">
            <svg class="w-5 h-5 flex-shrink-0 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{{ errorMessage() }}</span>
          </div>
        }

        <!-- Formulario de Registro -->
        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="space-y-4">
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Nombre Completo -->
            <div>
              <label class="block text-xs font-medium text-slate-300   mb-1.5">
                Nombre Completo
              </label>
              <input type="text" 
                     formControlName="name"
                     placeholder="ej. Carlos Mendoza"
                     class="w-full bg-chess-bg border border-chess-border  px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-chess-gold/80 transition-colors">
              @if (registerForm.get('name')?.touched && registerForm.get('name')?.invalid) {
                <span class="text-xs text-red-400 mt-1 block">Tu nombre es requerido</span>
              }
            </div>

            <!-- Nombre de Usuario -->
            <div>
              <label class="block text-xs font-medium text-slate-300   mb-1.5">
                Nombre de Usuario
              </label>
              <input type="text" 
                     formControlName="username"
                     placeholder="ej. gran_maestro"
                     class="w-full bg-chess-bg border border-chess-border  px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-chess-gold/80 transition-colors">
              @if (registerForm.get('username')?.touched && registerForm.get('username')?.invalid) {
                <span class="text-xs text-red-400 mt-1 block">Mínimo 3 caracteres alfanuméricos</span>
              }
            </div>
          </div>

          <!-- Correo Electrónico -->
          <div>
            <label class="block text-xs font-medium text-slate-300   mb-1.5">
              Correo Electrónico
            </label>
            <input type="email" 
                   formControlName="email"
                   placeholder="tu@correo.com"
                   class="w-full bg-chess-bg border border-chess-border  px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-chess-gold/80 transition-colors">
            @if (registerForm.get('email')?.touched && registerForm.get('email')?.invalid) {
              <span class="text-xs text-red-400 mt-1 block">Ingresa un correo electrónico válido</span>
            }
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Contraseña -->
            <div>
              <label class="block text-xs font-medium text-slate-300   mb-1.5">
                Contraseña
              </label>
              <input type="password" 
                     formControlName="password"
                     placeholder="Mínimo 8 caracteres"
                     class="w-full bg-chess-bg border border-chess-border  px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-chess-gold/80 transition-colors">
              @if (registerForm.get('password')?.touched && registerForm.get('password')?.invalid) {
                <span class="text-xs text-red-400 mt-1 block">Mínimo 8 caracteres</span>
              }
            </div>

            <!-- Confirmar Contraseña -->
            <div>
              <label class="block text-xs font-medium text-slate-300   mb-1.5">
                Confirmar Contraseña
              </label>
              <input type="password" 
                     formControlName="password_confirmation"
                     placeholder="Repite tu contraseña"
                     class="w-full bg-chess-bg border border-chess-border  px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-chess-gold/80 transition-colors">
              @if (registerForm.hasError('passwordMismatch') && registerForm.get('password_confirmation')?.touched) {
                <span class="text-xs text-red-400 mt-1 block">Las contraseñas no coinciden</span>
              }
            </div>
          </div>

          <!-- Botón de Registro -->
          <button type="submit" 
                  [disabled]="registerForm.invalid || isSubmitting()"
                  class="w-full mt-4 py-2.5 px-4  bg-chess-primary hover:bg-chess-primaryHover disabled:opacity-50 disabled:cursor-not-allowed text-chess-bg font-semibold text-sm  transition-all flex items-center justify-center gap-2 transform active:scale-98">
            @if (isSubmitting()) {
              <svg class="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span>Creando cuenta de jugador...</span>
            } @else {
              <span>Completar Registro</span>
            }
          </button>
        </form>

        <!-- Enlace a Login -->
        <p class="text-center text-xs text-slate-400 mt-6">
          ¿Ya tienes cuenta?
          <a routerLink="/login" class="text-chess-gold hover:underline font-semibold ml-1">
            Inicia sesión aquí
          </a>
        </p>

      </div>
    </div>
  `
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  registerForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30), Validators.pattern(/^[a-zA-Z0-9_]+$/)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    password_confirmation: ['', [Validators.required]],
  }, { validators: passwordMatchValidator });

  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  onSubmit(): void {
    if (this.registerForm.invalid) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.authService.register(this.registerForm.value).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.router.navigate(['/lobby']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const errors = err.error?.errors;
        let msg = err.error?.message || 'Error al registrar usuario.';
        if (errors) {
          const firstKey = Object.keys(errors)[0];
          msg = errors[firstKey][0];
        }
        this.errorMessage.set(msg);
      }
    });
  }
}
