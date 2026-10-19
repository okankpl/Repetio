import { Injectable, computed, inject, signal } from '@angular/core';
import { Clock } from './clock';
import { DAY_MS, dayKey } from './dates';
import { LearningStore } from './learning/learning-store';
import { LibraryStore } from './library/library-store';
import { isRecord } from './models';
import { Backup, createBackup, createSubjectsFile } from './persistence/backup';
import { persistentSignal } from './persistence/persistent-signal';
import { jsonFile, shareOrDownload } from './persistence/share-file';
import { STORAGE_KEYS } from './persistence/storage-keys';

/** Nach so vielen Tagen ohne Sicherung erinnert die App daran */
export const BACKUP_REMINDER_DAYS = 7;

interface BackupInfo {
  /** Zeitpunkt der letzten Sicherung in ms; null = noch nie */
  lastBackupAt: number | null;
}

/**
 * Alles rund um die Sicherheit der Daten, die nur auf diesem Gerät liegen:
 * Sicherungen erstellen und einlesen, an Sicherungen erinnern, Fächer als Datei teilen
 * und den Browser bitten, die Daten nicht von selbst zu löschen.
 */
@Injectable({ providedIn: 'root' })
export class DataSafety {
  private readonly library = inject(LibraryStore);
  private readonly learning = inject(LearningStore);
  private readonly clock = inject(Clock);

  private readonly info = persistentSignal<BackupInfo>(
    STORAGE_KEYS.backup,
    { lastBackupAt: null },
    isRecord,
  );

  readonly lastBackupAt = computed(() => this.info().lastBackupAt);

  /** Ganze Tage seit der letzten Sicherung; null = noch nie gesichert */
  readonly daysSinceBackup = computed(() => {
    const last = this.lastBackupAt();
    return last === null ? null : Math.floor((this.clock.now() - last) / DAY_MS);
  });

  /**
   * Wann an eine Sicherung erinnert wird: wenn die letzte älter als 7 Tage ist – oder, falls es
   * noch nie eine gab, ab dem zweiten Lerntag (nicht schon mitten in der allerersten Runde).
   */
  readonly reminderDue = computed(() => {
    const days = this.daysSinceBackup();
    if (days !== null) return days >= BACKUP_REMINDER_DAYS;
    const today = dayKey(this.clock.now());
    return Object.keys(this.learning.activityData()).some((day) => day < today);
  });

  /** Ob der Browser zugesagt hat, die Daten nicht bei Speichermangel zu löschen (null = unbekannt) */
  readonly persisted = signal<boolean | null>(null);

  constructor() {
    // navigator.storage fehlt in alten Browsern und ohne HTTPS – dann bleibt der Status unbekannt
    navigator.storage?.persisted?.().then(
      (persisted) => this.persisted.set(persisted),
      () => {
        // Abfrage nicht möglich: Status bleibt "unbekannt"
      },
    );
  }

  /**
   * Bittet den Browser, die Daten dauerhaft aufzubewahren. Chrome und Edge entscheiden still
   * (installierte Apps bekommen die Zusage in der Regel), Firefox fragt nach.
   */
  async requestPersistence(): Promise<boolean> {
    try {
      const granted = (await navigator.storage?.persist?.()) ?? false;
      this.persisted.set(granted);
      return granted;
    } catch {
      return false;
    }
  }

  /** Erstellt eine Sicherung aller Daten und bietet sie zum Speichern oder Teilen an. */
  async exportBackup(): Promise<boolean> {
    const backup = createBackup(
      this.library.data(),
      this.learning.progressData(),
      this.learning.activityData(),
    );
    const saved = await shareOrDownload(jsonFile(backup, `repetio-${dayKey(Date.now())}.json`));
    if (saved) this.info.set({ lastBackupAt: Date.now() });
    return saved;
  }

  /** Ersetzt alle Daten durch die einer Sicherung. */
  restoreBackup(backup: Backup): void {
    this.library.replace(backup.library);
    this.learning.replaceProgress(backup.progress, backup.activity);
  }

  /** Bietet ein Fach (ohne Lernstand) als Datei an, z. B. für Kommilitonen. */
  async exportSubject(subjectId: string): Promise<boolean> {
    const content = this.library.subjectContent(subjectId);
    const name = content.subjects[0]?.name ?? 'fach';
    return shareOrDownload(jsonFile(createSubjectsFile(content), `repetio-${fileSafe(name)}.json`));
  }

  /** Belegter Speicher aller Repetio-Daten in Byte (localStorage speichert Text als UTF-16) */
  usedBytes(): number {
    return Object.values(STORAGE_KEYS).reduce(
      (sum, key) => sum + (localStorage.getItem(key)?.length ?? 0) * 2,
      0,
    );
  }
}

/** Dateiname aus einem Fachnamen: Kleinbuchstaben, Umlaute ausgeschrieben, sonst nur a–z, 0–9 und - */
function fileSafe(name: string): string {
  const replaced = name
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return replaced || 'fach';
}
