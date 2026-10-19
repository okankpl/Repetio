import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Farbe der Markierung rechts: neutral, Akzentfarbe (fällig), grün (neu), rot (Problem) */
export type PillTone = 'neutral' | 'accent' | 'success' | 'danger';

/** Passende Farbe für einen Lernstatus wie „fällig“, „neu“ oder „in 5 T“ */
export function statusTone(status: string): PillTone {
  if (status === 'fällig') return 'accent';
  if (status === 'neu') return 'success';
  return 'neutral';
}

/**
 * Listenzeile für eine Karteikarte oder Quizfrage: Text (höchstens zwei Zeilen), optional eine
 * Zusatzzeile darunter und rechts eine kleine Markierung, z. B. den Lernstatus.
 * Die ganze Zeile ist ein Link. Gedacht für Listen der Form <ul class="card list"><li>…</li></ul>.
 */
@Component({
  selector: 'app-item-row',
  imports: [RouterLink],
  template: `
    <a class="row" [routerLink]="link()">
      <span class="body">
        <span class="text clamp-2">{{ text() }}</span>
        @if (detail()) {
          <small>{{ detail() }}</small>
        }
      </span>
      @if (pill()) {
        <span class="pill" [class]="tone()">{{ pill() }}</span>
      }
    </a>
  `,
  styles: `
    .row {
      display: flex;
      align-items: center;
      gap: 12px;
      min-height: 44px;
      padding: 12px 10px;
      color: inherit;
      text-decoration: none;
      border-radius: var(--radius-sm);
    }
    .row:hover {
      background: var(--surface-muted);
    }
    .body {
      display: grid;
      flex: 1;
      gap: 2px;
      min-width: 0;
    }
    small {
      font-size: 13px;
      color: var(--muted);
    }
  `,
})
export class ItemRow {
  /** Ziel der Zeile, z. B. itemLink(…) aus app.links.ts */
  readonly link = input.required<string[]>();
  readonly text = input.required<string>();
  /** Zusatzzeile, z. B. „Quiz · Mathematik · Analysis“ */
  readonly detail = input('');
  /** Text der Markierung rechts, z. B. „fällig“ oder „3×“; leer = keine Markierung */
  readonly pill = input('');
  readonly tone = input<PillTone>('neutral');
}
