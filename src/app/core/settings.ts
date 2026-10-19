import { Injectable, computed } from '@angular/core';
import { isRecord } from './models';
import { persistentSignal } from './persistence/persistent-signal';
import { STORAGE_KEYS } from './persistence/storage-keys';

/** Farbschema: dem System folgen oder fest hell bzw. dunkel */
export type Theme = 'system' | 'light' | 'dark';

export interface SettingsData {
  /** Bei Karteikarten die Antwort zuerst eintippen und dann mit der Musterlösung vergleichen */
  typeAnswers: boolean;
  /** Neue Karteikarten pro Fach und Tag */
  newFlashcardsPerDay: number;
  /** Neue Quizfragen pro Fach und Tag */
  newQuestionsPerDay: number;
  theme: Theme;
}

export const DEFAULT_SETTINGS: SettingsData = {
  typeAnswers: true,
  newFlashcardsPerDay: 10,
  newQuestionsPerDay: 5,
  theme: 'system',
};

/** Persönliche Einstellungen, die über Neustarts hinweg erhalten bleiben. */
@Injectable({ providedIn: 'root' })
export class Settings {
  private readonly stored = persistentSignal<Partial<SettingsData>>(
    STORAGE_KEYS.settings,
    {},
    isRecord,
  );

  /**
   * Gespeicherte Werte, ergänzt um Standardwerte. So funktionieren auch Einstellungen,
   * die eine ältere Version mit weniger Feldern gespeichert hat.
   */
  readonly current = computed<SettingsData>(() => ({ ...DEFAULT_SETTINGS, ...this.stored() }));

  update(changes: Partial<SettingsData>): void {
    this.stored.update((stored) => ({ ...stored, ...changes }));
  }
}
