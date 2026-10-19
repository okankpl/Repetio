import { DestroyRef, Injectable, WritableSignal, effect, inject, signal } from '@angular/core';

/** Zustand der Speicherung, damit die Oberfläche Probleme anzeigen kann. */
@Injectable({ providedIn: 'root' })
export class PersistenceStatus {
  /** Meldung für die Oberfläche; null, solange alles in Ordnung ist */
  readonly problem = signal<string | null>(null);
}

/** Prüft, ob ein geladener Wert die erwartete Form hat */
export type Validator = (value: unknown) => boolean;

const acceptAll: Validator = () => true;

/**
 * Signal, dessen Wert im localStorage des Browsers gespeichert wird.
 *
 * - Beim Erzeugen wird der zuletzt gespeicherte Wert geladen und geprüft.
 * - Ein `effect` läuft bei jeder Änderung des Signals und speichert den neuen Wert.
 * - Ändert ein anderer Tab (oder die installierte App) denselben Wert, wird er übernommen.
 *
 * Muss wie `inject()` in einem Injection Context aufgerufen werden, also z. B. als
 * Feld-Initialisierer in einem Service.
 */
export function persistentSignal<T>(
  key: string,
  fallback: T,
  isValid: Validator = acceptAll,
): WritableSignal<T> {
  const status = inject(PersistenceStatus);
  const state = signal<T>(load(key, fallback, isValid, status));

  effect(() => {
    const json = JSON.stringify(state());
    // Unveränderte Werte nicht erneut schreiben (spart Arbeit und vermeidet Endlosschleifen
    // zwischen Tabs, die sich gegenseitig über Änderungen informieren)
    if (localStorage.getItem(key) === json) return;
    try {
      localStorage.setItem(key, json);
    } catch {
      // Tritt z. B. auf, wenn der Speicher des Browsers voll ist (QuotaExceededError)
      status.problem.set(
        'Speichern fehlgeschlagen: Der Speicher des Browsers ist voll. Bitte eine Sicherung erstellen.',
      );
    }
  });

  // Das "storage"-Ereignis meldet Änderungen aus anderen Tabs desselben Browsers.
  // Ohne diesen Abgleich würde dieser Tab fremde Änderungen beim nächsten Speichern überschreiben.
  const onStorage = (event: StorageEvent) => {
    // key === null bedeutet: der andere Tab hat den ganzen Speicher geleert
    if (event.key === key || event.key === null) {
      state.set(load(key, fallback, isValid, status));
    }
  };
  window.addEventListener('storage', onStorage);
  inject(DestroyRef).onDestroy(() => window.removeEventListener('storage', onStorage));

  return state;
}

/**
 * Liest einen gespeicherten Wert. Fehlt er, gilt der Ersatzwert. Ist er beschädigt, gilt
 * ebenfalls der Ersatzwert – der beschädigte Text wird aber unter "<key>.defekt" aufbewahrt,
 * damit nichts endgültig verloren geht.
 */
function load<T>(key: string, fallback: T, isValid: Validator, status: PersistenceStatus): T {
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;

  try {
    const value: unknown = JSON.parse(raw);
    if (isValid(value)) return value as T;
  } catch {
    // ungültiges JSON – wird unten wie ein ungültiger Wert behandelt
  }
  localStorage.setItem(`${key}.defekt`, raw);
  status.problem.set('Gespeicherte Daten waren beschädigt und wurden zurückgesetzt.');
  return fallback;
}

/** Liest einen JSON-Wert ohne Prüfung (für Migrationen); fehlt oder bricht er, gilt der Ersatzwert. */
export function loadJson<T>(key: string, fallback: T, storage: Storage = localStorage): T {
  try {
    return JSON.parse(storage.getItem(key) ?? 'null') ?? fallback;
  } catch {
    return fallback;
  }
}
