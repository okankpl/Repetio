import { Component, inject, signal } from '@angular/core';
import { DataSafety } from '../../../core/data-safety';

/**
 * Hinweis auf der Startseite, wenn eine Sicherung fällig ist (Regel G14 der Spezifikation).
 * Erscheint nur bei Bedarf; „Später“ blendet ihn bis zum nächsten Öffnen der App aus.
 */
@Component({
  selector: 'app-backup-reminder',
  template: `
    @if (dataSafety.reminderDue() && !dismissed()) {
      <section class="card reminder" aria-labelledby="reminder-title">
        <h2 id="reminder-title">
          @if (dataSafety.daysSinceBackup() === null) {
            Noch keine Sicherung
          } @else {
            Letzte Sicherung vor {{ dataSafety.daysSinceBackup() }} Tagen
          }
        </h2>
        <p>Dein Lernstand liegt nur auf diesem Gerät. Eine Sicherung schützt ihn vor Verlust.</p>
        <div class="button-row">
          <button class="btn btn-primary" (click)="dataSafety.exportBackup()">Jetzt sichern</button>
          <button class="btn btn-secondary" (click)="dismissed.set(true)">Später</button>
        </div>
      </section>
    }
  `,
  styles: `
    .reminder {
      display: grid;
      gap: 8px;
      margin-bottom: 14px;
      background: var(--warning-soft);
      border-color: transparent;
    }
    h2 {
      font-size: 16px;
      color: var(--warning);
    }
    p {
      margin-bottom: 4px;
      font-size: 14px;
    }
  `,
})
export class BackupReminder {
  protected readonly dataSafety = inject(DataSafety);
  /** Ob der Hinweis für diesen Besuch weggeklickt wurde */
  protected readonly dismissed = signal(false);
}
