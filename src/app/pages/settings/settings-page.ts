import { Component, computed, inject, signal } from '@angular/core';
import { DataSafety } from '../../core/data-safety';
import { LearningStore } from '../../core/learning/learning-store';
import { LibraryStore } from '../../core/library/library-store';
import { parseBackup } from '../../core/persistence/backup';
import { Settings, SettingsData, Theme } from '../../core/settings';
import { FileButton } from '../../shared/file-button/file-button';
import { PageHeader } from '../../shared/page-header/page-header';

type LimitKey = keyof Pick<SettingsData, 'newFlashcardsPerDay' | 'newQuestionsPerDay'>;

/** Faustwert: So viel Platz geben Browser einer Seite im localStorage mindestens */
const STORAGE_LIMIT_BYTES = 5 * 1024 * 1024;

/** Einstellungen: Lernverhalten, Design, Datensicherheit (Sicherung, Speicher) und Zurücksetzen. */
@Component({
  selector: 'app-settings-page',
  imports: [PageHeader, FileButton],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.css',
})
export class SettingsPage {
  protected readonly settings = inject(Settings);
  protected readonly library = inject(LibraryStore);
  protected readonly dataSafety = inject(DataSafety);
  private readonly learning = inject(LearningStore);

  protected readonly themes: { value: Theme; label: string }[] = [
    { value: 'system', label: 'wie System' },
    { value: 'light', label: 'hell' },
    { value: 'dark', label: 'dunkel' },
  ];

  /** Rückmeldung nach einer Aktion, z. B. "Sicherung geladen." */
  protected readonly message = signal('');

  /** "noch nie", "heute", "vor 3 Tagen" */
  protected readonly lastBackupText = computed(() => {
    const days = this.dataSafety.daysSinceBackup();
    if (days === null) return 'noch nie';
    if (days === 0) return 'heute';
    return days === 1 ? 'gestern' : `vor ${days} Tagen`;
  });

  /** Belegter Speicher; neu berechnet, sobald sich Inhalte oder Lernstand ändern */
  protected readonly usage = computed(() => {
    this.library.data();
    this.learning.progressData();
    const bytes = this.dataSafety.usedBytes();
    return {
      text:
        bytes < 1024 * 1024
          ? `${Math.ceil(bytes / 1024)} kB`
          : `${(bytes / 1024 / 1024).toFixed(1)} MB`,
      percent: Math.max(1, Math.round((bytes / STORAGE_LIMIT_BYTES) * 100)),
    };
  });

  protected setLimit(key: LimitKey, value: string): void {
    const limit = Math.round(Number(value));
    if (Number.isNaN(limit)) return;
    this.settings.update({ [key]: Math.min(100, Math.max(0, limit)) });
  }

  protected setTheme(value: string): void {
    this.settings.update({ theme: value as Theme });
  }

  protected async exportBackup(): Promise<void> {
    if (await this.dataSafety.exportBackup()) this.message.set('Sicherung erstellt.');
  }

  protected async importBackup(file: File): Promise<void> {
    try {
      const backup = parseBackup(await file.text());
      const date = new Date(backup.exportedAt).toLocaleString('de-DE');
      const subjects = backup.library.subjects.length;
      if (
        !confirm(
          `Sicherung vom ${date} mit ${subjects} Fächern laden? Die aktuellen Daten werden ersetzt.`,
        )
      ) {
        return;
      }
      this.dataSafety.restoreBackup(backup);
      this.message.set('Sicherung geladen.');
    } catch (error) {
      this.message.set((error as Error).message);
    }
  }

  protected async requestPersistence(): Promise<void> {
    const granted = await this.dataSafety.requestPersistence();
    this.message.set(
      granted
        ? 'Der Browser bewahrt die Daten jetzt dauerhaft auf.'
        : 'Der Browser hat abgelehnt. Tipp: Repetio als App installieren und regelmäßig sichern.',
    );
  }

  protected resetProgress(): void {
    if (!confirm('Lernfortschritt und Statistik löschen? Fächer und Karten bleiben erhalten.')) {
      return;
    }
    this.learning.resetProgress();
    this.message.set('Lernfortschritt zurückgesetzt.');
  }

  protected async restoreSample(): Promise<void> {
    await this.library.restoreSampleSubject();
    this.message.set('Beispielfach wieder hinzugefügt.');
  }
}
