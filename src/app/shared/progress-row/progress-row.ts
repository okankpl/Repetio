import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProgressBar } from '../progress-bar/progress-bar';

/**
 * Listenzeile mit Fortschritt, z. B. für ein Fach oder ein Kapitel.
 * Die ganze Zeile ist ein Link; mehrere Zeilen stehen in einem Container mit `.list`.
 */
@Component({
  selector: 'app-progress-row',
  imports: [RouterLink, ProgressBar],
  template: `
    <a class="row" [routerLink]="link()">
      <span class="badge" aria-hidden="true">{{ badge() }}</span>
      <span class="body">
        <span class="title">{{ title() }}</span>
        <app-progress-bar [value]="learned()" [max]="total()" [label]="'Fortschritt ' + title()" />
        <span class="meta">
          @if (detail()) {
            {{ detail() }} ·
          }
          {{ learned() }} von {{ total() }} gelernt
          @if (due() > 0) {
            · <strong>{{ due() }} fällig</strong>
          }
        </span>
      </span>
      <span class="chevron" aria-hidden="true">›</span>
    </a>
  `,
  styles: `
    .row {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 12px 10px;
      color: inherit;
      text-decoration: none;
      border-radius: var(--radius-sm);
    }
    .row:hover {
      background: var(--surface-muted);
    }
    .badge {
      flex: none;
      display: grid;
      place-items: center;
      width: 36px;
      height: 36px;
      font-weight: 700;
      color: var(--primary);
      background: var(--primary-soft);
      border-radius: 10px;
    }
    .body {
      display: grid;
      flex: 1;
      gap: 6px;
      min-width: 0;
    }
    .title {
      font-weight: 600;
      overflow-wrap: anywhere;
    }
    .meta {
      font-size: 13px;
      color: var(--muted);
    }
    .meta strong {
      color: var(--primary);
    }
    .chevron {
      font-size: 22px;
      color: var(--muted);
    }
  `,
})
export class ProgressRow {
  /** Ziel der Zeile, z. B. ['/fach', id] */
  readonly link = input.required<string | unknown[]>();
  readonly title = input.required<string>();
  /** Kurzes Kennzeichen links, z. B. Kapitelnummer oder Anfangsbuchstabe */
  readonly badge = input('');
  /** Zusatzinfo vor dem Fortschritt, z. B. "8 Kapitel" */
  readonly detail = input('');
  readonly learned = input(0);
  readonly total = input(0);
  readonly due = input(0);
}
