// Kleine Datumshilfen in lokaler Zeit. Ohne Angular, damit Lernalgorithmus und Statistik sie nutzen können.

export const MINUTE_MS = 60 * 1000;
export const DAY_MS = 24 * 60 * MINUTE_MS;

/** Mitternacht des Tages, in dem `timestamp` liegt */
export function startOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/**
 * Mitternacht `days` Tage nach dem Tag von `timestamp`. Über `setDate` statt `+ days * DAY_MS`,
 * damit Tage mit Zeitumstellung (23 oder 25 Stunden) richtig gezählt werden.
 */
export function addDays(timestamp: number, days: number): number {
  const date = new Date(startOfDay(timestamp));
  date.setDate(date.getDate() + days);
  return date.getTime();
}

/** Tag als Text im Format JJJJ-MM-TT (lokale Zeit) – Schlüssel für Tageswerte */
export function dayKey(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('sv-SE');
}
