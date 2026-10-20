import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { LobbyComponent } from './features/lobby/lobby.component';
import { GameComponent } from './features/game/game.component';
import { LeaderboardComponent } from './features/leaderboard/leaderboard.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'lobby', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'lobby', component: LobbyComponent, canActivate: [authGuard] },
  { path: 'challenges', component: LobbyComponent, canActivate: [authGuard] },
  { path: 'game/:code', component: GameComponent, canActivate: [authGuard] },
  { path: 'leaderboard', component: LeaderboardComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'lobby' },
];
