import { ActivityLog, isActivityLog } from '../learning/activity';
import { CardState } from '../learning/srs';
import { Library, isLibrary, isRecord } from '../models';

/** Kennung im Dateiinhalt, an der eine Repetio-Sicherung erkannt wird */
const BACKUP_FORMAT = 'repetio-backup';
/** Kennung einer Datei mit einzelnen Fächern zum Teilen (ohne Lernstand) */
const SUBJECTS_FORMAT = 'repetio-subjects';
/** Kennungen aus der Zeit, als die App noch „Merkwerk“ hieß – solche Dateien bleiben lesbar */
const OLD_BACKUP_FORMAT = 'merkwerk-backup';
const OLD_SUBJECTS_FORMAT = 'merkwerk-subjects';

/**
 * Inhalt einer Sicherungsdatei: alle Inhalte, Lernstand und Statistik.
 * Der Aufbau ist in docs/spezifikation.md beschrieben. Version 2 ergänzt die Statistik (`activity`);
 * Dateien der Version 1 lassen sich weiterhin einlesen.
 */
export interface Backup {
  format: typeof BACKUP_FORMAT;
  version: 2;
  exportedAt: string;
  library: Library;
  progress: Record<string, CardState>;
  activity: ActivityLog;
}

/** Datei mit Fächern zum Weitergeben, z. B. an Kommilitonen – nur Inhalte, kein Lernstand */
export interface SubjectsFile {
  format: typeof SUBJECTS_FORMAT;
  version: 1;
  exportedAt: string;
  library: Library;
}

/**
 * Erstellt eine Sicherung. Übernommen wird nur der Lernstand von Einheiten, die es noch gibt –
 * Einträge gelöschter Karten bleiben im Gerät zurück, landen aber nicht in der Datei.
 */
export function createBackup(
  library: Library,
  progress: Record<string, CardState>,
  activity: ActivityLog = {},
): Backup {
  const itemIds = new Set(library.items.map((item) => item.id));
  return {
    format: BACKUP_FORMAT,
    version: 2,
    exportedAt: new Date().toISOString(),
    library,
    progress: Object.fromEntries(Object.entries(progress).filter(([id]) => itemIds.has(id))),
    activity,
  };
}

export function createSubjectsFile(library: Library): SubjectsFile {
  return { format: SUBJECTS_FORMAT, version: 1, exportedAt: new Date().toISOString(), library };
}

/**
 * Liest eine Sicherungsdatei ein und prüft ihren Aufbau.
 * Wirft einen Fehler mit verständlicher Meldung, wenn die Datei nicht passt –
 * so werden kaputte oder fremde Dateien abgelehnt, bevor sie Daten überschreiben.
 */
export function parseBackup(text: string): Backup {
  const data = parseJson(text);
  if (!isBackup(data)) {
    throw new Error('Die Datei ist keine Repetio-Sicherung oder unvollständig.');
  }
  // Version 1 kannte noch keine Statistik; ältere Kennungen werden vereinheitlicht
  return {
    ...data,
    format: BACKUP_FORMAT,
    version: 2,
    activity: data.version === 2 ? data.activity : {},
  };
}

/**
 * Liest die Inhalte aus einer Datei mit Fächern – oder aus einer vollständigen Sicherung,
 * deren Lernstand dabei unbeachtet bleibt.
 */
export function parseSubjects(text: string): Library {
  const data = parseJson(text);
  const format = isRecord(data) ? data['format'] : undefined;
  if (
    (format === SUBJECTS_FORMAT || format === OLD_SUBJECTS_FORMAT) &&
    isRecord(data) &&
    isLibrary(data['library'])
  ) {
    return data['library'];
  }
  if (isBackup(data)) return data.library;
  throw new Error('Die Datei enthält keine Repetio-Fächer.');
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Die Datei ist keine gültige JSON-Datei.');
  }
}

/** Sicherung der Version 1 oder 2 */
function isBackup(data: unknown): data is Omit<Backup, 'version'> & { version: 1 | 2 } {
  return (
    isRecord(data) &&
    (data['format'] === BACKUP_FORMAT || data['format'] === OLD_BACKUP_FORMAT) &&
    (data['version'] === 1 || (data['version'] === 2 && isActivityLog(data['activity']))) &&
    isLibrary(data['library']) &&
    isRecord(data['progress'])
  );
}
