import { Injectable, computed } from '@angular/core';
import { createId } from '../id';
import { Chapter, Library, StudyItem, StudyScope, Subject, isLibrary } from '../models';
import { persistentSignal } from '../persistence/persistent-signal';
import { STORAGE_KEYS } from '../persistence/storage-keys';
import { copyWithNewIds } from './library-copy';
import { SAMPLE_SUBJECT_ID } from './sample/sample-id';
import { loadSampleLibrary } from './sample/load-sample';

/** Leere Inhalte – das Beispielfach legt prepareStorage() beim ersten Start an */
export const EMPTY_LIBRARY: Library = { subjects: [], chapters: [], items: [] };

/**
 * Verwaltet die Inhalte: Fächer, Kapitel und Lerneinheiten (anlegen, ändern, löschen, abfragen).
 * Der Lernfortschritt liegt getrennt davon im LearningStore.
 *
 * `@Injectable({ providedIn: 'root' })` macht den Service app-weit als eine einzige Instanz
 * verfügbar; Komponenten holen ihn sich mit `inject(LibraryStore)`.
 */
@Injectable({ providedIn: 'root' })
export class LibraryStore {
  /** Alle Inhalte */
  private readonly library = persistentSignal<Library>(
    STORAGE_KEYS.library,
    EMPTY_LIBRARY,
    isLibrary,
  );

  /** Nur lesbare Sicht auf alle Inhalte, z. B. für den Export */
  readonly data = this.library.asReadonly();

  /**
   * `computed` leitet einen Wert aus anderen Signals ab und berechnet ihn nur neu,
   * wenn sich eines davon ändert.
   */
  readonly subjects = computed(() => this.library().subjects);
  readonly items = computed(() => this.library().items);

  /** Nachschlagetabellen id → Objekt, damit nicht bei jedem Zugriff Listen durchsucht werden */
  private readonly subjectsById = computed(() => toMap(this.library().subjects));
  private readonly chaptersById = computed(() => toMap(this.library().chapters));
  private readonly itemsById = computed(() => toMap(this.library().items));

  /** Einheiten je Kapitel und je Fach – einmal gruppiert statt bei jeder Abfrage gefiltert */
  private readonly itemsByChapter = computed(() =>
    groupBy(this.library().items, (item) => item.chapterId),
  );
  private readonly itemsBySubject = computed(() =>
    groupBy(this.library().items, (item) => this.subjectIdOf(item) ?? ''),
  );
  private readonly chaptersBySubject = computed(() =>
    groupBy(this.library().chapters, (chapter) => chapter.subjectId),
  );

  subject(id: string): Subject | undefined {
    return this.subjectsById().get(id);
  }

  chapter(id: string): Chapter | undefined {
    return this.chaptersById().get(id);
  }

  item(id: string): StudyItem | undefined {
    return this.itemsById().get(id);
  }

  chaptersOf(subjectId: string): Chapter[] {
    return this.chaptersBySubject().get(subjectId) ?? [];
  }

  /** Alle Lerneinheiten, die zu einem Umfang gehören (alles, ein Fach oder ein Kapitel) */
  itemsIn(scope: StudyScope): StudyItem[] {
    if (scope.chapterId) return this.itemsByChapter().get(scope.chapterId) ?? [];
    if (scope.subjectId) return this.itemsBySubject().get(scope.subjectId) ?? [];
    return this.items();
  }

  subjectIdOf(item: StudyItem): string | undefined {
    return this.chapter(item.chapterId)?.subjectId;
  }

  /** Herkunft einer Einheit als Text, z. B. "Mathematik · Analysis" */
  contextOf(item: StudyItem): string {
    const chapter = this.chapter(item.chapterId);
    const subject = chapter && this.subject(chapter.subjectId);
    return [subject?.name, chapter?.title].filter(Boolean).join(' · ');
  }

  /** Ein Fach mit seinen Kapiteln und Einheiten, z. B. zum Teilen als Datei */
  subjectContent(subjectId: string): Library {
    return {
      subjects: this.library().subjects.filter((subject) => subject.id === subjectId),
      chapters: this.chaptersOf(subjectId),
      items: this.itemsIn({ subjectId }),
    };
  }

  hasSampleSubject(): boolean {
    return !!this.subject(SAMPLE_SUBJECT_ID);
  }

  // ---------- Ändern ----------

  addSubject(name: string): Subject {
    const subject: Subject = { id: createId(), name };
    this.library.update((lib) => ({ ...lib, subjects: [...lib.subjects, subject] }));
    return subject;
  }

  renameSubject(id: string, name: string): void {
    this.library.update((lib) => ({
      ...lib,
      subjects: lib.subjects.map((subject) => (subject.id === id ? { ...subject, name } : subject)),
    }));
  }

  /** Löscht ein Fach samt seinen Kapiteln und Lerneinheiten. */
  deleteSubject(id: string): void {
    const chapterIds = new Set(this.chaptersOf(id).map((chapter) => chapter.id));
    this.library.update((lib) => ({
      subjects: lib.subjects.filter((subject) => subject.id !== id),
      chapters: lib.chapters.filter((chapter) => chapter.subjectId !== id),
      items: lib.items.filter((item) => !chapterIds.has(item.chapterId)),
    }));
  }

  addChapter(subjectId: string, title: string): Chapter {
    const chapter: Chapter = { id: createId(), subjectId, title };
    this.library.update((lib) => ({ ...lib, chapters: [...lib.chapters, chapter] }));
    return chapter;
  }

  renameChapter(id: string, title: string): void {
    this.library.update((lib) => ({
      ...lib,
      chapters: lib.chapters.map((chapter) =>
        chapter.id === id ? { ...chapter, title } : chapter,
      ),
    }));
  }

  /** Löscht ein Kapitel samt seinen Lerneinheiten. */
  deleteChapter(id: string): void {
    this.library.update((lib) => ({
      ...lib,
      chapters: lib.chapters.filter((chapter) => chapter.id !== id),
      items: lib.items.filter((item) => item.chapterId !== id),
    }));
  }

  /** Legt eine Lerneinheit an oder ersetzt die vorhandene mit derselben id. */
  saveItem(item: StudyItem): void {
    this.library.update((lib) => ({
      ...lib,
      items: this.item(item.id)
        ? lib.items.map((existing) => (existing.id === item.id ? item : existing))
        : [...lib.items, item],
    }));
  }

  /** Fügt mehrere neue Lerneinheiten auf einmal hinzu, z. B. aus dem Massenimport. */
  addItems(items: StudyItem[]): void {
    this.library.update((lib) => ({ ...lib, items: [...lib.items, ...items] }));
  }

  deleteItem(id: string): void {
    this.library.update((lib) => ({ ...lib, items: lib.items.filter((item) => item.id !== id) }));
  }

  /**
   * Fügt Fächer aus einer Datei zu den vorhandenen hinzu (vorhandene bleiben unverändert).
   * Gibt die neu angelegten Fächer zurück.
   */
  addSubjects(content: Library): Subject[] {
    const copy = copyWithNewIds(content);
    this.library.update((lib) => ({
      subjects: [...lib.subjects, ...copy.subjects],
      chapters: [...lib.chapters, ...copy.chapters],
      items: [...lib.items, ...copy.items],
    }));
    return copy.subjects;
  }

  /** Ersetzt alle Inhalte, z. B. beim Import einer Sicherung. */
  replace(library: Library): void {
    this.library.set(library);
  }

  /** Fügt das Beispielfach wieder hinzu, falls es gelöscht wurde. */
  async restoreSampleSubject(): Promise<void> {
    if (this.hasSampleSubject()) return;
    const sample = await loadSampleLibrary();
    // Nach dem Laden erneut prüfen: Ein zweiter Aufruf könnte inzwischen fertig sein
    if (this.hasSampleSubject()) return;
    this.library.update((lib) => ({
      subjects: [...lib.subjects, ...sample.subjects],
      chapters: [...lib.chapters, ...sample.chapters],
      items: [...lib.items, ...sample.items],
    }));
  }
}

function toMap<T extends { id: string }>(list: T[]): Map<string, T> {
  return new Map(list.map((entry) => [entry.id, entry]));
}

/** Gruppiert eine Liste nach einem Schlüssel; die Reihenfolge innerhalb der Gruppen bleibt erhalten */
function groupBy<T>(list: T[], keyOf: (entry: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const entry of list) {
    const key = keyOf(entry);
    const group = groups.get(key);
    if (group) group.push(entry);
    else groups.set(key, [entry]);
  }
  return groups;
}
