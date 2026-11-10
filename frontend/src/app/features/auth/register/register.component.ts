import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

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
  imports: [CommonModule, ReactiveFormsModule, RouterLink, IconComponent],
  template: `
    <div class="min-h-dvh lg:min-h-screen grid lg:grid-cols-2">

      <div class="hidden lg:flex flex-col justify-between p-12 bg-[#0d1124] border-r border-[#232b4d] relative overflow-hidden">
        <div class="eyebrow">Chess Arena &middot; online</div>
        <div class="relative z-10">
          <h1 class="font-display text-6xl xl:text-7xl font-extrabold text-white leading-[0.98]">
            Tu camino<br>empieza<br><span class="text-[#f4b942]">aquí.</span>
          </h1>
          <p class="text-slate-400 mt-6 max-w-sm">Crea tu cuenta y arranca con 1200 puntos Elo. Sube en el ranking partida a partida.</p>
        </div>
        <div class="grid grid-cols-8 w-72 rotate-[8deg] opacity-80 absolute -right-10 -bottom-10">
          @for (i of board; track $index) {
            <div class="aspect-square" [class.bg-[#2bb5a0]]="i % 2 === 0" [class.bg-[#e4efe9]]="i % 2 === 1"></div>
          }
        </div>
        <div class="eyebrow relative z-10">1200 Elo inicial</div>
      </div>

      <div class="flex items-center justify-center p-5 sm:p-10">
        <div class="w-full max-w-md fade-in">
          <div class="lg:hidden flex items-center gap-2.5 mb-8">
            <div class="w-9 h-9 rounded-xl bg-[#2bb5a0] text-[#04141a] flex items-center justify-center"><app-icon name="crown" class="w-5 h-5"></app-icon></div>
            <span class="font-display text-xl font-extrabold text-white">Chess<span class="text-[#45d4be]">Arena</span></span>
          </div>

          <div class="eyebrow mb-2">Registro</div>
          <h2 class="font-display text-4xl font-extrabold text-white">Crea tu cuenta</h2>
          <p class="text-sm text-slate-400 mt-2 mb-7">Solo toma un minuto.</p>

          @if (errorMessage()) {
            <div class="mb-5 p-3 rounded-xl bg-red-950/50 border border-red-800/60 text-red-200 text-xs flex items-center gap-2.5">
              <app-icon name="shield" class="w-4 h-4 text-red-400 shrink-0"></app-icon>
              <span>{{ errorMessage() }}</span>
            </div>
          }

          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="field-label">Nombre completo</label>
                <input type="text" formControlName="name" placeholder="Carlos Mendoza" class="field">
                @if (registerForm.get('name')?.touched && registerForm.get('name')?.invalid) {
                  <span class="text-[11px] text-red-400 mt-1 block">Tu nombre es requerido</span>
                }
              </div>
              <div>
                <label class="field-label">Usuario</label>
                <input type="text" formControlName="username" placeholder="gran_maestro" class="field">
                @if (registerForm.get('username')?.touched && registerForm.get('username')?.invalid) {
                  <span class="text-[11px] text-red-400 mt-1 block">Mínimo 3 caracteres alfanuméricos</span>
                }
              </div>
            </div>

            <div>
              <label class="field-label">Correo electrónico</label>
              <input type="email" formControlName="email" placeholder="tu@correo.com" class="field">
              @if (registerForm.get('email')?.touched && registerForm.get('email')?.invalid) {
                <span class="text-[11px] text-red-400 mt-1 block">Ingresa un correo válido</span>
              }
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="field-label">Contraseña</label>
                <input type="password" formControlName="password" placeholder="Mínimo 8 caracteres" class="field">
                @if (registerForm.get('password')?.touched && registerForm.get('password')?.invalid) {
                  <span class="text-[11px] text-red-400 mt-1 block">Mínimo 8 caracteres</span>
                }
              </div>
              <div>
                <label class="field-label">Confirmar</label>
                <input type="password" formControlName="password_confirmation" placeholder="Repite tu contraseña" class="field">
                @if (registerForm.hasError('passwordMismatch') && registerForm.get('password_confirmation')?.touched) {
                  <span class="text-[11px] text-red-400 mt-1 block">Las contraseñas no coinciden</span>
                }
              </div>
            </div>

            <button type="submit" [disabled]="registerForm.invalid || isSubmitting()" class="btn btn-primary w-full !py-3.5 mt-2">
              @if (isSubmitting()) {
                <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>Creando cuenta...</span>
              } @else {
                <span>Completar registro</span>
              }
            </button>
          </form>

          <p class="text-center text-sm text-slate-400 mt-7">
            ¿Ya tienes cuenta?
            <a routerLink="/login" class="text-[#45d4be] font-bold hover:underline ml-1">Inicia sesión</a>
          </p>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
  board = Array.from({ length: 64 }, (_, i) => (Math.floor(i / 8) + i) % 2);

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
