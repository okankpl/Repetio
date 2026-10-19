import { Component, computed, input, signal } from '@angular/core';

/** Ein Balken: kurze Achsenbeschriftung, Wert und ausführliche Beschreibung für Hover/Screenreader */
export interface Bar {
  label: string;
  value: number;
  description: string;
}

/**
 * Säulendiagramm für eine einzelne Datenreihe, z. B. Antworten pro Tag.
 *
 * Bewusst ohne Diagramm-Bibliothek: Die Säulen sind HTML-Elemente mit einer Höhe in Prozent.
 * Zeigen, Antippen oder Fokussieren einer Säule zeigt ihre Beschreibung in der Zeile darüber;
 * Screenreader lesen sie als Liste mit Beschreibungen vor.
 */
@Component({
  selector: 'app-bar-chart',
  template: `
    <p class="readout" aria-hidden="true">{{ readout() }}</p>
    <div class="plot">
      <span class="tick top" aria-hidden="true">{{ scaleMax() }}</span>
      <span class="tick bottom" aria-hidden="true">0</span>
      <!-- role="list": Screenreader nennen die Anzahl und lesen jede Säule mit Beschreibung -->
      <div class="bars" role="list" [attr.aria-label]="label()" (pointerleave)="active.set(null)">
        @for (bar of bars(); track $index) {
          <div
            class="slot"
            role="listitem"
            tabindex="0"
            [attr.aria-label]="bar.description"
            [class.active]="active() === $index"
            (pointerenter)="active.set($index)"
            (focus)="active.set($index)"
            (blur)="active.set(null)"
          >
            <!-- Höhe relativ zum oberen Skalenwert; mindestens 2px, damit 1 neben 0 sichtbar bleibt -->
            <span
              class="bar"
              [class.empty]="bar.value === 0"
              [style.height]="bar.value === 0 ? '0' : 'max(2px, ' + percent(bar.value) + '%)'"
            ></span>
          </div>
        }
      </div>
    </div>
    <div class="labels" aria-hidden="true">
      @for (bar of bars(); track $index) {
        <span>{{ showLabel($index) ? bar.label : '' }}</span>
      }
    </div>
  `,
  styleUrl: './bar-chart.css',
})
export class BarChart {
  readonly bars = input.required<Bar[]>();
  /** Name des Diagramms für Screenreader */
  readonly label = input.required<string>();
  /** Text über dem Diagramm, solange keine Säule ausgewählt ist, z. B. eine Summe */
  readonly summary = input('');

  /** Ausgewählte Säule (Maus darüber, angetippt oder per Tab fokussiert) */
  protected readonly active = signal<number | null>(null);

  protected readonly readout = computed(() => {
    const index = this.active();
    return index === null ? this.summary() : (this.bars()[index]?.description ?? '');
  });

  /** Oberer Skalenwert: der größte Wert, aufgerundet auf eine runde Zahl (1, 2, 5, 10, 20 …) */
  protected readonly scaleMax = computed(() =>
    niceCeiling(Math.max(0, ...this.bars().map((bar) => bar.value))),
  );

  protected percent(value: number): number {
    return (value / this.scaleMax()) * 100;
  }

  /** Nur einzelne Achsenbeschriftungen – erste, mittlere und letzte –, damit nichts überlappt */
  protected showLabel(index: number): boolean {
    const last = this.bars().length - 1;
    return index === 0 || index === last || index === Math.round(last / 2);
  }
}

/** Rundet auf die nächste „runde“ Zahl auf: 7 → 10, 23 → 50, 140 → 200; mindestens 1 */
export function niceCeiling(value: number): number {
  if (value <= 1) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 5, 10].find((factor) => factor * magnitude >= value)!;
  return step * magnitude;
}
