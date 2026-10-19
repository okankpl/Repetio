import { Component, input, output } from '@angular/core';

/**
 * Button, der eine Datei auswählen lässt, z. B. „Sicherung laden“.
 * Meldet die gewählte Datei über (picked); was mit ihr passiert, entscheidet die Seite.
 *
 * Ein echtes <input type="file"> lässt sich kaum gestalten. Deshalb ist es unsichtbar, und ein
 * <label> im Button-Stil öffnet es beim Antippen – so funktioniert es auch mit Tastatur und Screenreader.
 */
@Component({
  selector: 'app-file-button',
  template: `
    <label class="btn btn-secondary">
      {{ label() }}
      <input
        #field
        class="visually-hidden"
        type="file"
        [accept]="accept()"
        (change)="pick(field)"
      />
    </label>
  `,
  // display: contents – das <label> verhält sich im Layout, als stünde es direkt in der Seite
  // (wichtig z. B. in .button-row, die ihre Kinder in zwei Spalten anordnet)
  styles: `
    :host {
      display: contents;
    }
  `,
})
export class FileButton {
  readonly label = input.required<string>();
  /** Erlaubte Dateitypen, wie beim accept-Attribut von <input type="file"> */
  readonly accept = input('application/json,.json');
  readonly picked = output<File>();

  protected pick(field: HTMLInputElement): void {
    const file = field.files?.[0];
    // Zurücksetzen, damit sich dieselbe Datei später erneut auswählen lässt
    field.value = '';
    if (file) this.picked.emit(file);
  }
}
