import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type IconName =
  | 'lightning'
  | 'flame'
  | 'timer'
  | 'hourglass'
  | 'swords'
  | 'trophy'
  | 'crown'
  | 'medal'
  | 'user'
  | 'flag'
  | 'handshake'
  | 'chat'
  | 'rotate'
  | 'volume'
  | 'volume-x'
  | 'copy'
  | 'check'
  | 'plus'
  | 'arrow-left'
  | 'arrow-right'
  | 'chevrons-left'
  | 'chevrons-right'
  | 'crosshair'
  | 'sparkles'
  | 'shield'
  | 'board'
  | 'refresh'
  | 'circle-dot'
  | 'menu'
  | 'x';

/**
 * Componente de iconografía vectorial minimalista para la plataforma de ajedrez.
 * Reemplaza emojis informales por trazos limpios, modernos y proporcionados.
 */
@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg [class]="svgClass"
         viewBox="0 0 24 24" 
         fill="none" 
         stroke="currentColor" 
         stroke-width="1.8" 
         stroke-linecap="round" 
         stroke-linejoin="round">
      @switch (name) {
        @case ('lightning') {
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        }
        @case ('flame') {
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        }
        @case ('timer') {
          <circle cx="12" cy="12" r="9" />
          <polyline points="12 6 12 12 16 14" />
          <path d="M12 2v2" />
        }
        @case ('hourglass') {
          <path d="M5 22h14" />
          <path d="M5 2h14" />
          <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
          <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
        }
        @case ('swords') {
          <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
          <line x1="13" y1="19" x2="19" y2="13" />
          <line x1="16" y1="16" x2="20" y2="20" />
          <line x1="19" y1="21" x2="21" y2="19" />
          <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5" />
          <line x1="5" y1="14" x2="9" y2="18" />
          <line x1="7" y1="17" x2="4" y2="20" />
          <line x1="3" y1="19" x2="5" y2="21" />
        }
        @case ('trophy') {
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.45 1-1 1H8v4h8v-4h-1c-.55 0-1-.45-1-1v-2.34" />
          <path d="M6 4h12v7a6 6 0 0 1-12 0V4z" />
        }
        @case ('crown') {
          <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
          <circle cx="12" cy="19" r="1" />
        }
        @case ('medal') {
          <circle cx="12" cy="14" r="6" />
          <path d="M8.21 13.89L7 22l5-3 5 3-1.21-8.11" />
          <path d="M12 2v6" />
          <path d="M7.5 4.5l9 9" />
        }
        @case ('user') {
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        }
        @case ('flag') {
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
          <line x1="4" y1="22" x2="4" y2="15" />
        }
        @case ('handshake') {
          <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
          <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
          <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
          <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
        }
        @case ('chat') {
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        }
        @case ('rotate') {
          <path d="M21.5 2v6h-6" />
          <path d="M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
        }
        @case ('volume') {
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        }
        @case ('volume-x') {
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        }
        @case ('copy') {
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        }
        @case ('check') {
          <polyline points="20 6 9 17 4 12" />
        }
        @case ('plus') {
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        }
        @case ('arrow-left') {
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        }
        @case ('arrow-right') {
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        }
        @case ('chevrons-left') {
          <polyline points="11 17 6 12 11 7" />
          <polyline points="18 17 13 12 18 7" />
        }
        @case ('chevrons-right') {
          <polyline points="13 17 18 12 13 7" />
          <polyline points="6 17 11 12 6 7" />
        }
        @case ('crosshair') {
          <circle cx="12" cy="12" r="10" />
          <line x1="22" y1="12" x2="18" y2="12" />
          <line x1="6" y1="12" x2="2" y2="12" />
          <line x1="12" y1="6" x2="12" y2="2" />
          <line x1="12" y1="22" x2="12" y2="18" />
        }
        @case ('sparkles') {
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
        }
        @case ('shield') {
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        }
        @case ('board') {
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
        }
        @case ('refresh') {
          <path d="M23 4v6h-6" />
          <path d="M1 20v-6h6" />
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        }
        @case ('circle-dot') {
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="3" />
        }
        @case ('menu') {
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        }
        @case ('x') {
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        }
      }
    </svg>
  `
})
export class IconComponent {
  @Input({ required: true }) name!: IconName;
  @Input() class: string = 'w-4 h-4';

  get svgClass(): string {
    return this.class || 'w-4 h-4';
  }
}
