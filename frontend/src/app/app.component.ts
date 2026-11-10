import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { NavbarComponent } from './shared/components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Chess Arena';

  private router = inject(Router);

  private url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  /** 'auth' = sin navegación, 'focus' = partida (tablero a máximo tamaño), 'app' = barra lateral completa */
  layout(): 'auth' | 'focus' | 'app' {
    const u = this.url();
    if (u.startsWith('/login') || u.startsWith('/register')) return 'auth';
    if (u.startsWith('/game')) return 'focus';
    return 'app';
  }
}
