import { loadSampleLibrary } from '../library/sample/load-sample';
import { Chapter, Flashcard, Library } from '../models';
import { loadJson } from './persistent-signal';
import { STORAGE_KEYS } from './storage-keys';

/** Eigene Karte, wie sie die ersten Versionen gespeichert haben (Lektionsnummer statt Kapitel) */
interface LegacyCard {
  id: string;
  lesson: number;
  front: string;
  back: string;
}

/** Liefert das Beispielfach; in Tests lässt es sich ersetzen */
export type SampleLoader = () => Promise<Library>;

/**
 * Bereitet den Speicher vor, bevor die App startet (siehe provideAppInitializer in app.config.ts):
 * übernimmt Daten früherer Versionen und legt beim allerersten Start das Beispielfach an.
 * Ein zweiter Aufruf ändert nichts mehr.
 */
export async function prepareStorage(
  storage: Storage = localStorage,
  loadSample: SampleLoader = loadSampleLibrary,
): Promise<void> {
  await migrateLegacyStorage(storage, loadSample);
  if (storage.getItem(STORAGE_KEYS.library) === null) {
    storage.setItem(STORAGE_KEYS.library, JSON.stringify(await loadSample()));
  }
}

/**
 * Übernimmt Daten früherer Versionen in das aktuelle Speicherformat.
 * Danach sind die alten Schlüssel gelöscht, ein zweiter Aufruf ändert also nichts mehr.
 * Die Schritte sind nach Alter sortiert, damit sehr alte Daten alle nacheinander durchlaufen.
 */
export async function migrateLegacyStorage(
  storage: Storage = localStorage,
  loadSample: SampleLoader = loadSampleLibrary,
): Promise<void> {
  await migrateFirstVersion(storage, loadSample);
  migrateLernkartenKeys(storage);
  migrateMerkwerkKeys(storage);
}

/** Erste Versionen: eigene Schlüssel ("srs-…") und Lektionsnummern statt Kapitel */
async function migrateFirstVersion(storage: Storage, loadSample: SampleLoader): Promise<void> {
  // Lernstand: nur der Schlüssel hat sich geändert, die ids der Karten sind gleich geblieben
  moveKey(storage, 'srs-progress-v1', STORAGE_KEYS.progress);

  // Eigene Karten: bekommen ein eigenes Fach mit einem Kapitel je Lektion, neben dem Beispielfach
  const legacyCards = loadJson<LegacyCard[]>('srs-custom-cards-v1', [], storage);
  if (legacyCards.length > 0 && storage.getItem(STORAGE_KEYS.library) === null) {
    const sample = await loadSample();
    const lessons = [...new Set(legacyCards.map((card) => card.lesson))].sort((a, b) => a - b);
    const subjectId = 'eigene-karten';
    const chapters: Chapter[] = lessons.map((lesson) => ({
      id: `${subjectId}-${lesson}`,
      subjectId,
      title: `Lektion ${lesson}`,
    }));
    const cards = legacyCards.map((card): Flashcard => ({
      kind: 'flashcard',
      id: card.id,
      chapterId: `${subjectId}-${card.lesson}`,
      front: card.front,
      back: card.back,
    }));
    const library: Library = {
      subjects: [...sample.subjects, { id: subjectId, name: 'Eigene Karten' }],
      chapters: [...sample.chapters, ...chapters],
      items: [...sample.items, ...cards],
    };
    storage.setItem(STORAGE_KEYS.library, JSON.stringify(library));
  }

  // Einstellung "Antworten eintippen"
  const typing = storage.getItem('srs-typing-mode-v1');
  if (typing !== null && storage.getItem(STORAGE_KEYS.settings) === null) {
    storage.setItem(STORAGE_KEYS.settings, JSON.stringify({ typeAnswers: typing !== 'false' }));
  }

  for (const key of ['srs-custom-cards-v1', 'srs-typing-mode-v1', 'srs-daily-v1', 'srs-daily-v2']) {
    storage.removeItem(key);
  }
}

/** Version unter dem Arbeitstitel "Lernkarten": gleiches Format, nur andere Schlüssel */
function migrateLernkartenKeys(storage: Storage): void {
  moveKey(storage, 'lernkarten.library', STORAGE_KEYS.library);
  moveKey(storage, 'lernkarten.progress', STORAGE_KEYS.progress);
  moveKey(storage, 'lernkarten.daily', STORAGE_KEYS.daily);
  moveKey(storage, 'lernkarten.settings', STORAGE_KEYS.settings);
}

/** Version unter dem Namen "Merkwerk": gleiches Format, nur andere Schlüssel */
function migrateMerkwerkKeys(storage: Storage): void {
  for (const [name, key] of Object.entries(STORAGE_KEYS)) {
    moveKey(storage, `merkwerk.${name}`, key);
  }
}

/** Übernimmt einen Wert unter neuem Schlüssel (falls dort noch nichts liegt) und löscht den alten. */
function moveKey(storage: Storage, from: string, to: string): void {
  const value = storage.getItem(from);
  if (value !== null && storage.getItem(to) === null) {
    storage.setItem(to, value);
  }
  storage.removeItem(from);
}
