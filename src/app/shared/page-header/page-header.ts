import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Kopfzeile einer Unterseite: Zurück-Link, kleine Oberzeile und Titel. */
@Component({
  selector: 'app-page-header',
  // RouterLink: Links, die innerhalb der App navigieren, ohne die Seite neu zu laden
  imports: [RouterLink],
  template: `
    @if (backLink()) {
      <a class="back" [routerLink]="backLink()">‹ {{ backLabel() }}</a>
    }
    @if (eyebrow()) {
      <p class="eyebrow">{{ eyebrow() }}</p>
    }
    <h1>{{ title() }}</h1>
  `,
  styles: `
    :host {
      display: block;
      padding: max(16px, env(safe-area-inset-top)) 0 18px;
    }
    .back {
      display: inline-flex;
      align-items: center;
      min-height: 44px; /* Mindestgröße für Touch-Ziele */
      margin-bottom: 4px;
      color: var(--primary);
      font-weight: 600;
      text-decoration: none;
    }
    .eyebrow {
      margin-bottom: 2px;
    }
    h1 {
      font-size: 24px;
      overflow-wrap: anywhere;
    }
  `,
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly eyebrow = input('');
  /** Ziel des Zurück-Links, z. B. ['/fach', id]; ohne Wert wird kein Link angezeigt */
  readonly backLink = input<string | unknown[]>();
  readonly backLabel = input('Zurück');
}
