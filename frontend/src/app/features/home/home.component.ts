import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Letter { ch: string; i: number; }

const split = (s: string, offset = 0): Letter[] =>
  Array.from(s).map((ch, i) => ({ ch, i: i + offset }));

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="home">
      <header class="hero">
        <svg aria-hidden="true" viewBox="0 0 600 800" class="arch" fill="none" stroke="#4A4540">
          <path class="draw" pathLength="1" stroke-width="2" d="M40 800 V500 A520 520 0 0 1 300 50 A520 520 0 0 1 560 500 V800"></path>
          <path class="draw d2" pathLength="1" stroke-width="1" d="M64 800 V500 A496 496 0 0 1 300 78 A496 496 0 0 1 536 500 V800"></path>
          <g stroke="#C2A061" stroke-width="1">
            <circle class="draw d3" pathLength="1" cx="300" cy="230" r="90"></circle>
            <circle class="draw d3" pathLength="1" cx="300" cy="230" r="22"></circle>
            @for (p of rose; track $index) {
              <circle class="draw d3" pathLength="1" [attr.cx]="p[0]" [attr.cy]="p[1]" r="30"></circle>
            }
          </g>
        </svg>
        <div class="hero-body">
          <h1 class="hero-title" aria-label="Jaque">
            @for (l of hero; track l.i) {<span class="lt hl" aria-hidden="true" [style.--i]="l.i">{{ l.ch }}</span>}
          </h1>
          <p class="late lead">Ajedrez en tiempo real contra otra persona. Cada jugada llega al instante y el reloj no perdona.</p>
          <div class="late actions">
            <a routerLink="/lobby" class="btn btn-a">Jugar ahora</a>
            <a routerLink="/leaderboard" class="btn btn-b">Ver clasificación</a>
          </div>
        </div>
      </header>

      <section aria-labelledby="piezas" class="wrap pieces">
        <h2 id="piezas" class="rv h2">Seis piezas y un solo rey que proteger</h2>
        <p class="rv muted intro">Desliza hacia abajo. Cada pieza se presenta con la forma en que se mueve.</p>
        <div class="piece-list">
          @for (p of pieces; track p.name) {
            <article class="piece">
              <div class="gl glyph" aria-hidden="true">{{ p.glyph }}</div>
              <div class="piece-text">
                <h3 class="piece-name" [attr.aria-label]="p.name">
                  @for (l of p.letters; track l.i) {<span class="lt sl" aria-hidden="true" [style.--i]="l.i">{{ l.ch }}</span>}
                </h3>
                <p class="rv">{{ p.text }}</p>
              </div>
            </article>
          }
        </div>
      </section>

      <section aria-labelledby="ritmos" class="wrap modes">
        <h2 id="ritmos" class="rv h2">Elige tu ritmo</h2>
        <p class="rv muted intro-sm">El primer número son los minutos de cada jugador. El segundo, los segundos que ganas con cada jugada.</p>
        <div class="lancets">
          @for (m of modes; track m.name) {
            <div class="lancet">
              <svg aria-hidden="true" viewBox="0 0 300 560" preserveAspectRatio="none" fill="none" stroke="#4A4540">
                <path class="sdraw" pathLength="1" stroke-width="1.5" vector-effect="non-scaling-stroke" d="M2 560 V250 A296 296 0 0 1 150 4 A296 296 0 0 1 298 250 V560"></path>
              </svg>
              <div class="lancet-body">
                <h3 class="mode-name" [attr.aria-label]="m.name">
                  @for (l of m.letters; track l.i) {<span class="lt sl" aria-hidden="true" [style.--i]="l.i">{{ l.ch }}</span>}
                </h3>
                @for (c of m.controls; track c.t) {
                  <div class="rv">
                    <div class="tc">{{ c.t }}</div>
                    <div class="muted tc-d">{{ c.d }}</div>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      </section>

      <section aria-labelledby="elo" class="wrap elo">
        <div class="elo-text">
          <h2 id="elo" class="rv h2">Tu Elo, partida a partida</h2>
          <p class="rv">Empiezas con 1200 puntos en cada ritmo. Vencer a alguien con más puntos te da más; perder con alguien con menos te quita más.</p>
          <p class="rv muted">Bullet, Blitz y Rapid llevan clasificación propia, con los 50 mejores de cada una.</p>
        </div>
        <figure class="rv formula">
          <div>E = 1 / (1 + 10<sup>(R<sub>rival</sub> − R) / 400</sup>)</div>
          <div>R′ = R + <span class="gold">32</span> · (S − E)</div>
          <figcaption class="muted">E es el resultado esperado. S vale 1 si ganas, ½ en tablas y 0 si pierdes.</figcaption>
        </figure>
      </section>

      <section aria-labelledby="final" class="final">
        <h2 id="final" class="final-title" aria-label="La partida te espera">
          @for (w of finale; track $index) {<span class="word" aria-hidden="true">@for (l of w; track l.i) {<span class="lt sl" [style.--i]="l.i">{{ l.ch }}</span>}</span> }
        </h2>
        <div class="rv actions">
          <a routerLink="/register" class="btn btn-a">Crear cuenta</a>
          <a routerLink="/login" class="btn btn-b">Iniciar sesión</a>
        </div>
      </section>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .home { color: #ECE6D8; font-size: 20px; line-height: 1.6; overflow-x: hidden; }
    .muted { color: #A39C90; }
    .gold { color: #C2A061; font-style: normal; }
    .wrap { margin: 0 auto; padding-left: clamp(16px, 4vw, 48px); padding-right: clamp(16px, 4vw, 48px); }
    .lt { display: inline-block; }
    .h2 { margin: 0 0 24px; font-size: clamp(48px, 6vw, 80px); line-height: 1.05; }
    .gothic, .hero-title, .piece-name, .mode-name, .final-title { font-family: 'UnifrakturMaguntia', serif; font-weight: 400; }

    .btn { display: inline-flex; align-items: center; justify-content: center; min-height: 48px; padding: 0 28px; font-weight: 500; font-size: 18px; text-decoration: none; border: 1px solid #ECE6D8; letter-spacing: .02em; transition: background-color .2s, color .2s, border-color .2s; }
    .btn-a { background: #ECE6D8; color: #0F0D0B; }
    .btn-a:hover { background: #C2A061; border-color: #C2A061; }
    .btn-b { color: #ECE6D8; }
    .btn-b:hover { color: #C2A061; border-color: #C2A061; }
    .actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 16px; }

    .hero { position: relative; min-height: 860px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 64px 16px; text-align: center; }
    .arch { position: absolute; top: 24px; left: 50%; transform: translateX(-50%); width: min(600px, 92vw); height: auto; overflow: visible; }
    .hero-body { position: relative; margin-top: 260px; display: flex; flex-direction: column; align-items: center; gap: 28px; }
    .hero-title { margin: 0; font-size: clamp(110px, 17vw, 230px); line-height: .9; }
    .lead { margin: 0; max-width: 30ch; font-size: clamp(20px, 2.2vw, 26px); color: #A39C90; }

    .pieces { max-width: 1080px; padding-top: 160px; padding-bottom: 80px; }
    .pieces .h2 { max-width: 14ch; }
    .intro { margin: 0 0 120px; max-width: 46ch; }
    .intro-sm { margin: 0 0 72px; max-width: 46ch; }
    .piece-list { display: flex; flex-direction: column; gap: 140px; }
    .piece { display: flex; flex-wrap: wrap; align-items: center; gap: clamp(32px, 5vw, 72px); }
    .glyph { flex: 0 0 auto; width: 200px; height: 220px; display: flex; align-items: center; justify-content: center; font-family: 'Segoe UI Symbol', 'DejaVu Sans', 'Noto Sans Symbols 2', serif; font-size: 168px; line-height: 1; border: 1px solid #4A4540; border-radius: 100px 100px 0 0; background: #1F1C19; }
    .piece-text { flex: 1 1 320px; min-width: 0; }
    .piece-name { margin: 0 0 12px; font-size: clamp(56px, 7vw, 96px); line-height: 1; }
    .piece-text p { margin: 0; max-width: 40ch; font-size: 22px; line-height: 1.65; }

    .modes { max-width: 1180px; padding-top: 160px; padding-bottom: 160px; }
    .lancets { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 32px; }
    .lancet { position: relative; min-height: 560px; padding: 190px 32px 40px; box-sizing: border-box; }
    .lancet svg { position: absolute; inset: 0; width: 100%; height: 100%; }
    .lancet-body { position: relative; display: flex; flex-direction: column; align-items: center; gap: 28px; text-align: center; }
    .mode-name { margin: 0; font-size: 56px; line-height: 1; }
    .tc { font-size: 52px; line-height: 1; font-weight: 500; font-variant-numeric: lining-nums tabular-nums; color: #C2A061; }
    .tc-d { margin-top: 6px; font-size: 18px; }

    .elo { max-width: 1180px; padding-top: 120px; padding-bottom: 160px; display: flex; flex-wrap: wrap; gap: 64px; align-items: center; }
    .elo-text { flex: 1 1 380px; min-width: 0; }
    .elo-text p { margin: 0 0 16px; max-width: 42ch; }
    .formula { flex: 1 1 380px; min-width: 0; margin: 0; padding: 48px clamp(24px, 4vw, 56px); border: 1px solid #4A4540; background: #1F1C19; font-style: italic; font-size: clamp(22px, 2.4vw, 30px); line-height: 2; }
    .formula figcaption { margin-top: 20px; font-style: normal; font-size: 17px; line-height: 1.5; }

    .final { padding: 160px 16px 200px; text-align: center; border-top: 1px solid #4A4540; }
    .final-title { margin: 0 auto 48px; max-width: 12ch; font-size: clamp(64px, 9vw, 140px); line-height: 1; }
    .word { display: inline-block; white-space: nowrap; }

    /* Carga: el arco se dibuja y "Jaque" aparece letra a letra */
    @keyframes rise { from { opacity: 0; transform: translateY(.3em); filter: blur(8px); } }
    @keyframes draw { to { stroke-dashoffset: 0; } }
    @keyframes lift { from { opacity: 0; transform: translateY(80px) scale(.92); } }
    .draw { stroke-dasharray: 1; stroke-dashoffset: 1; animation: draw 2.4s cubic-bezier(.6,0,.2,1) forwards; }
    .d2 { animation-delay: .35s; }
    .d3 { animation-delay: .9s; animation-duration: 1.8s; }
    .hl { animation: rise 1.2s cubic-bezier(.2,.7,.2,1) both; animation-delay: calc(1.1s + var(--i) * .12s); }
    .late { animation: rise 1s ease-out both; animation-delay: 1.9s; }

    /* Scroll: piezas y letras aparecen al bajar (navegadores sin soporte ven todo estático) */
    /* Todo termina nítido en cuanto el elemento entra completo en pantalla (entry 100%) */
    @keyframes rise-s { from { opacity: 0; transform: translateY(.3em); filter: blur(4px); } }
    @supports (animation-timeline: view()) {
      .sl { animation: rise-s linear both; animation-timeline: view(); animation-range: entry calc(min(var(--i), 8) * 6%) entry calc(52% + min(var(--i), 8) * 6%); }
      .rv { animation: rise-s linear both; animation-timeline: view(); animation-range: entry 0% entry 100%; }
      .gl { animation: lift linear both; animation-timeline: view(); animation-range: entry 0% entry 100%; }
      .sdraw { stroke-dasharray: 1; stroke-dashoffset: 1; animation: draw linear both; animation-timeline: view(); animation-range: entry 0% entry 100%; }
    }
    @media (prefers-reduced-motion: reduce) {
      * { animation: none !important; }
      .draw, .sdraw { stroke-dashoffset: 0 !important; }
    }
  `]
})
export class HomeComponent {
  readonly hero = split('Jaque');

  // 8 lóbulos del rosetón, cada 45° a radio 55 del centro (300, 230)
  readonly rose = Array.from({ length: 8 }, (_, k) => [
    +(300 + 55 * Math.cos(k * Math.PI / 4)).toFixed(1),
    +(230 + 55 * Math.sin(k * Math.PI / 4)).toFixed(1),
  ]);

  readonly pieces = [
    { g: '♚', name: 'Rey', text: 'Se mueve una casilla en cualquier dirección. Si queda en jaque sin salida, la partida termina.' },
    { g: '♛', name: 'Dama', text: 'Recorre filas, columnas y diagonales tantas casillas como quiera. Es la pieza más poderosa.' },
    { g: '♜', name: 'Torre', text: 'Avanza en línea recta por filas y columnas, y junto al rey hace el enroque.' },
    { g: '♝', name: 'Alfil', text: 'Se desliza por las diagonales y nunca abandona el color de su casilla.' },
    { g: '♞', name: 'Caballo', text: 'Salta en forma de L. Es la única pieza que pasa por encima de las demás.' },
    { g: '♟', name: 'Peón', text: 'Avanza una casilla, dos en su primera jugada, y captura en diagonal. Al llegar al final, corona.' },
  ].map(p => ({ ...p, glyph: p.g + '︎', letters: split(p.name) }));

  // shortcut: ritmos fijos del GameModeSeeder; si se agregan modos, leerlos de GameService
  readonly modes = [
    { name: 'Bullet', controls: [{ t: '1+0', d: '1 minuto por jugador' }, { t: '2+1', d: '2 minutos, +1 s por jugada' }] },
    { name: 'Blitz', controls: [{ t: '3+0', d: '3 minutos por jugador' }, { t: '3+2', d: '3 minutos, +2 s por jugada' }] },
    { name: 'Rapid', controls: [{ t: '10+0', d: '10 minutos por jugador' }, { t: '15+10', d: '15 minutos, +10 s por jugada' }] },
  ].map(m => ({ ...m, letters: split(m.name) }));

  readonly finale = (() => {
    let off = 0;
    return 'La partida te espera'.split(' ').map(w => { const r = split(w, off); off += w.length; return r; });
  })();
}
