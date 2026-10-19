import { Component, input } from '@angular/core';

/** Eine Kennzahl, z. B. { label: 'fällig', value: 12 } */
export interface Figure {
  label: string;
  value: string | number;
  /** Optional farbig hervorheben, z. B. „richtig“ grün und „falsch“ rot */
  tone?: 'success' | 'danger';
}

/**
 * Raster aus Kennzahlen: große Zahl, kleine Beschriftung darunter.
 * Genutzt auf der Startseite (fällig/neu), am Ende einer Lernrunde und in der Statistik.
 */
@Component({
  selector: 'app-key-figures',
  template: `
    <!-- <dl>: Liste aus Begriff (dt) und Wert (dd) – Screenreader lesen beides zusammen vor -->
    <dl [style.grid-template-columns]="'repeat(' + columns() + ', 1fr)'">
      @for (figure of figures(); track figure.label) {
        <div>
          <dt>{{ figure.label }}</dt>
          <dd [class]="figure.tone ?? ''">{{ figure.value }}</dd>
        </div>
      }
    </dl>
  `,
  styles: `
    dl {
      display: grid;
      gap: 8px;
      margin: 0;
    }
    div {
      display: flex;
      flex-direction: column-reverse; /* Zahl oben, Beschriftung darunter */
      align-items: center;
      padding: 10px 4px;
      background: var(--surface-muted);
      border-radius: var(--radius-sm);
    }
    dd {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      white-space: nowrap;
    }
    dt {
      font-size: 13px;
      color: var(--muted);
      text-align: center;
    }
    .success {
      color: var(--success);
    }
    .danger {
      color: var(--danger);
    }
  `,
})
export class KeyFigures {
  readonly figures = input.required<Figure[]>();
  /** Anzahl der Spalten im Raster */
  readonly columns = input(3);
}
