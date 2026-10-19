import { Component, computed, input } from '@angular/core';

/**
 * Schmaler Fortschrittsbalken, z. B. "12 von 20 gelernt".
 * Bewusst klein gehalten: Template und Styles stehen direkt hier statt in eigenen Dateien.
 */
@Component({
  selector: 'app-progress-bar',
  // role="progressbar" + aria-Werte: Screenreader lesen den Fortschritt als Zahl vor.
  // [attr.x] setzt ein HTML-Attribut, [style.width.%] eine Breite in Prozent.
  template: `
    <div
      class="track"
      role="progressbar"
      aria-valuemin="0"
      [attr.aria-valuemax]="max()"
      [attr.aria-valuenow]="value()"
      [attr.aria-label]="label()"
    >
      <div class="fill" [style.width.%]="percent()"></div>
    </div>
  `,
  styles: `
    .track {
      height: 6px;
      overflow: hidden;
      background: var(--surface-muted);
      border-radius: 999px;
    }
    .fill {
      height: 100%;
      background: var(--primary);
      border-radius: inherit;
      transition: width 0.3s ease;
    }
  `,
})
export class ProgressBar {
  /** `input()` deklariert einen Eingabewert, den die Elternkomponente setzt: [value]="…" */
  readonly value = input(0);
  readonly max = input(1);
  readonly label = input('');

  protected readonly percent = computed(() =>
    this.max() > 0 ? Math.min(100, (this.value() / this.max()) * 100) : 0,
  );
}
