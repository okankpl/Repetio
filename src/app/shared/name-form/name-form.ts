import {
  Component,
  ElementRef,
  afterNextRender,
  computed,
  input,
  linkedSignal,
  output,
  viewChild,
} from '@angular/core';

/**
 * Einzeiliges Formular für einen Namen: neues Fach, neues Kapitel oder Umbenennen.
 * Meldet den bereinigten Namen über (saved); Abbrechen über (cancelled).
 *
 * Bewusst ohne Reactive Forms: Für ein einzelnes Feld genügt ein Signal. Weil das Formular auf
 * der Startseite steht, bleibt so das Formular-Modul von Angular aus dem Startpaket heraus.
 */
@Component({
  selector: 'app-name-form',
  template: `
    <!-- (submit) reagiert auf Enter im Feld und auf den Speichern-Button -->
    <form class="card" (submit)="submit($event)">
      <!-- [value] schreibt das Signal ins Feld, (input) bei jeder Eingabe zurück ins Signal -->
      <input
        #field
        type="text"
        autocomplete="off"
        [value]="name()"
        (input)="name.set(field.value)"
        [placeholder]="placeholder()"
        [attr.aria-label]="placeholder()"
      />
      <div class="buttons">
        <button class="btn btn-primary" type="submit" [disabled]="blank()">
          {{ submitLabel() }}
        </button>
        <button class="btn btn-ghost" type="button" (click)="cancelled.emit()">Abbrechen</button>
      </div>
    </form>
  `,
  styles: `
    form {
      display: grid;
      gap: 10px;
    }
    .buttons {
      display: flex;
      gap: 8px;
    }
    .buttons .btn-primary {
      flex: 1;
    }
  `,
})
export class NameForm {
  /** Vorbelegter Name, z. B. beim Umbenennen */
  readonly value = input('');
  readonly placeholder = input('Name');
  readonly submitLabel = input('Speichern');
  readonly saved = output<string>();
  readonly cancelled = output<void>();

  /**
   * `linkedSignal`: startet mit dem Wert des inputs `value` und ist danach frei änderbar
   * (Eingaben im Feld). Ändert sich `value` von außen, wird er wieder übernommen.
   */
  protected readonly name = linkedSignal(() => this.value());
  /** Leer oder nur Leerzeichen – dann lässt sich nicht speichern */
  protected readonly blank = computed(() => !this.name().trim());
  private readonly field = viewChild.required<ElementRef<HTMLInputElement>>('field');

  constructor() {
    // Läuft einmal nach dem ersten Rendern: Cursor direkt ins Feld setzen
    afterNextRender(() => this.field().nativeElement.focus());
  }

  protected submit(event: Event): void {
    // Ohne diesen Aufruf würde der Browser das Formular abschicken und die Seite neu laden
    event.preventDefault();
    if (this.blank()) return;
    this.saved.emit(this.name().trim());
  }
}
