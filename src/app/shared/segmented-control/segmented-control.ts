import { Component, input, model } from '@angular/core';

/** Eine Wahlmöglichkeit im Umschalter */
export interface SegmentOption<T> {
  value: T;
  label: string;
}

/**
 * Umschalter aus nebeneinanderliegenden Buttons, von denen genau einer aktiv ist,
 * z. B. „Karteikarten | Quizfragen“ oder „14 Tage | 30 Tage“.
 *
 * Verwendung mit Zwei-Wege-Bindung:  <app-segmented-control [(value)]="kind" … />
 * `<T>` macht die Komponente generisch: Der Wert kann ein Text, eine Zahl o. Ä. sein.
 */
@Component({
  selector: 'app-segmented-control',
  template: `
    <!-- role="group" + aria-pressed: Screenreader erkennen die Gruppe und den aktiven Button -->
    <div class="segments" role="group" [attr.aria-label]="label()">
      @for (option of options(); track option.value) {
        <button
          type="button"
          class="btn"
          [class.active]="value() === option.value"
          [attr.aria-pressed]="value() === option.value"
          (click)="value.set(option.value)"
        >
          {{ option.label }}
        </button>
      }
    </div>
  `,
  styles: `
    .segments {
      display: flex;
      gap: 4px;
      padding: 4px;
      background: var(--surface-muted);
      border-radius: var(--radius-sm);
    }
    .btn {
      flex: 1;
      min-height: 44px;
      padding: 6px 12px;
      font-size: 14px;
      background: transparent;
    }
    .btn.active {
      background: var(--surface);
      box-shadow: var(--shadow);
    }
  `,
})
export class SegmentedControl<T> {
  readonly options = input.required<SegmentOption<T>[]>();
  /** Name der Gruppe für Screenreader, z. B. „Zeitraum“ */
  readonly label = input.required<string>();
  /**
   * `model()` ist ein input, das die Komponente auch selbst ändern darf. Die Elternkomponente
   * bekommt jede Änderung zurück, wenn sie mit [(value)]="…" bindet.
   */
  readonly value = model.required<T>();
}
