import { TestBed } from '@angular/core/testing';
import { prepareStorage } from '../persistence/migrations';
import { SAMPLE_SUBJECT_ID } from './sample/sample-id';
import { LibraryStore } from './library-store';

describe('LibraryStore', () => {
  let library: LibraryStore;

  beforeEach(async () => {
    localStorage.clear();
    await prepareStorage();
    library = TestBed.inject(LibraryStore);
  });

  it('starts with the sample subject', () => {
    expect(library.subjects().map((subject) => subject.id)).toEqual([SAMPLE_SUBJECT_ID]);
    expect(library.chaptersOf(SAMPLE_SUBJECT_ID)).toHaveLength(3);
  });

  it('creates subjects, chapters and items that belong together', () => {
    const subject = library.addSubject('Mathematik');
    const chapter = library.addChapter(subject.id, 'Analysis');
    library.saveItem({
      kind: 'flashcard',
      id: 'm1',
      chapterId: chapter.id,
      front: 'f′(x²)?',
      back: '2x',
    });

    expect(library.itemsIn({ subjectId: subject.id }).map((item) => item.id)).toEqual(['m1']);
    expect(library.subjectIdOf(library.item('m1')!)).toBe(subject.id);
  });

  it('replaces an item with the same id instead of adding a second one', () => {
    const chapterId = library.addChapter(library.addSubject('Physik').id, 'Optik').id;
    library.saveItem({ kind: 'flashcard', id: 'p1', chapterId, front: 'alt', back: 'alt' });
    library.saveItem({ kind: 'flashcard', id: 'p1', chapterId, front: 'neu', back: 'neu' });

    expect(library.itemsIn({ chapterId })).toEqual([
      { kind: 'flashcard', id: 'p1', chapterId, front: 'neu', back: 'neu' },
    ]);
  });

  it('deletes a subject together with its chapters and items', () => {
    library.deleteSubject(SAMPLE_SUBJECT_ID);
    expect(library.data()).toEqual({ subjects: [], chapters: [], items: [] });
  });

  it('can restore the sample subject after it was deleted', async () => {
    library.deleteSubject(SAMPLE_SUBJECT_ID);
    // Zwei Aufrufe gleichzeitig dürfen nichts doppelt anlegen
    await Promise.all([library.restoreSampleSubject(), library.restoreSampleSubject()]);
    expect(library.subjects()).toHaveLength(1);
    expect(library.items().length).toBeGreaterThan(30);
  });

  it('adds subjects from a file as copies with new ids', () => {
    const shared = library.subjectContent(SAMPLE_SUBJECT_ID);
    const [added] = library.addSubjects(shared);

    expect(library.subjects()).toHaveLength(2);
    expect(added.id).not.toBe(SAMPLE_SUBJECT_ID);
    expect(added.name).toBe('Beispielfach: Besser lernen');
    expect(library.chaptersOf(added.id)).toHaveLength(3);
    expect(library.itemsIn({ subjectId: added.id })).toHaveLength(shared.items.length);
    // Das Original bleibt unverändert
    expect(library.itemsIn({ subjectId: SAMPLE_SUBJECT_ID })).toHaveLength(shared.items.length);
  });

  it('adds many items at once', () => {
    const chapterId = library.addChapter(library.addSubject('Chemie').id, 'Atome').id;
    library.addItems([
      { kind: 'flashcard', id: 'c1', chapterId, front: 'H?', back: 'Wasserstoff' },
      { kind: 'flashcard', id: 'c2', chapterId, front: 'O?', back: 'Sauerstoff' },
    ]);
    expect(library.itemsIn({ chapterId }).map((item) => item.id)).toEqual(['c1', 'c2']);
  });
});
