import { computed } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SAMPLE_SUBJECT_ID } from '../library/sample/sample-id';
import { LearningStore } from './learning-store';
import { LibraryStore } from '../library/library-store';
import { prepareStorage } from '../persistence/migrations';
import { DEFAULT_SETTINGS, Settings } from '../settings';
import { RATING } from './srs';

describe('LearningStore', () => {
  let learning: LearningStore;
  let library: LibraryStore;

  beforeEach(async () => {
    localStorage.clear();
    await prepareStorage(); // legt wie beim ersten Start das Beispielfach an
    learning = TestBed.inject(LearningStore);
    library = TestBed.inject(LibraryStore);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts a day with the daily limits of new flashcards and questions, alternating', () => {
    const queue = learning.buildQueue({});
    expect(queue.filter((item) => item.kind === 'flashcard')).toHaveLength(
      DEFAULT_SETTINGS.newFlashcardsPerDay,
    );
    expect(queue.filter((item) => item.kind === 'choice')).toHaveLength(
      DEFAULT_SETTINGS.newQuestionsPerDay,
    );
    expect(queue.slice(0, 4).map((item) => item.kind)).toEqual([
      'flashcard',
      'choice',
      'flashcard',
      'choice',
    ]);
  });

  it('only uses items of the chosen chapter', () => {
    const queue = learning.buildQueue({ chapterId: 'beispiel-3' });
    expect(queue.length).toBeGreaterThan(0);
    expect(queue.every((item) => item.chapterId === 'beispiel-3')).toBe(true);
  });

  it('applies the daily limit per subject', () => {
    const subject = library.addSubject('Mathematik');
    const chapterId = library.addChapter(subject.id, 'Analysis').id;
    for (let i = 0; i < 3; i++) {
      library.saveItem({
        kind: 'flashcard',
        id: `m${i}`,
        chapterId,
        front: `Frage ${i}`,
        back: '…',
      });
    }
    // Neue Karten aus dem Beispielfach verbrauchen das Limit der Mathematik nicht
    for (const item of learning.buildQueue({ subjectId: SAMPLE_SUBJECT_ID })) {
      learning.rate(item, RATING.GOOD);
    }
    expect(learning.overview({ subjectId: SAMPLE_SUBJECT_ID }).newFlashcards).toBe(0);
    expect(learning.overview({ subjectId: subject.id }).newFlashcards).toBe(3);
  });

  it('follows the limits from the settings', () => {
    TestBed.inject(Settings).update({ newFlashcardsPerDay: 2, newQuestionsPerDay: 0 });
    const queue = learning.buildQueue({});
    expect(queue.map((item) => item.kind)).toEqual(['flashcard', 'flashcard']);
  });

  it('puts due reviews before new items on the next day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 16, 12, 0));
    const [first] = learning.buildQueue({});
    learning.rate(first, RATING.GOOD); // "Richtig" bei einer neuen Karte → morgen wieder fällig
    expect(learning.dueLabel(first)).toBe('morgen');

    vi.setSystemTime(new Date(2026, 9, 17, 8, 0));
    expect(learning.overview({}).due).toBe(1);
    expect(learning.buildQueue({})[0].id).toBe(first.id);
    expect(learning.dueLabel(first)).toBe('fällig');
  });

  it('forgets the progress on reset but keeps the content', () => {
    const [first] = learning.buildQueue({});
    learning.rate(first, RATING.GOOD);
    learning.resetProgress();
    expect(learning.overview({}).learned).toBe(0);
    expect(learning.dueLabel(first)).toBe('neu');
    expect(library.item(first.id)).toBeDefined();
  });

  it('records answers, correct answers, new items and time per day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 16, 12, 0));
    const [first, second] = learning.buildQueue({});
    learning.rate(first, RATING.GOOD, 20_000);
    learning.rate(second, RATING.AGAIN, 10 * 60_000); // zu lange: zählt nur 2 Minuten
    learning.rate(second, RATING.GOOD, 5_000);

    expect(learning.activityData()['2026-10-16']).toEqual({
      reviews: 3,
      correct: 2,
      learned: 2,
      timeMs: 20_000 + 2 * 60_000 + 5_000,
    });
  });

  it('takes back a rating including daily counts and statistics', () => {
    const [first] = learning.buildQueue({});
    const before = learning.overview({});
    const { undo } = learning.rate(first, RATING.GOOD);
    expect(learning.dueLabel(first)).toBe('morgen');

    undo();

    expect(learning.dueLabel(first)).toBe('neu');
    expect(learning.overview({})).toEqual(before);
    expect(learning.activityData()).toEqual({});
  });

  it('restores the previous state when a review is taken back', () => {
    const [first] = learning.buildQueue({});
    learning.rate(first, RATING.GOOD);
    const learned = learning.stateOf(first);
    const { undo } = learning.rate(first, RATING.AGAIN);
    undo();
    expect(learning.stateOf(first)).toEqual(learned);
  });

  it('allows extra new items beyond the daily limit', () => {
    TestBed.inject(Settings).update({ newFlashcardsPerDay: 0, newQuestionsPerDay: 0 });
    expect(learning.buildQueue({})).toHaveLength(0);
    expect(learning.buildQueue({}, 3)).toHaveLength(6);
    expect(learning.overview({}).unseen).toBe(library.items().length);
  });

  it('updates time-dependent numbers when the app comes back to the foreground', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 16, 12, 0));
    const [first] = learning.buildQueue({});
    learning.rate(first, RATING.GOOD);
    const due = TestBed.runInInjectionContext(() => computed(() => learning.overview({}).due));
    expect(due()).toBe(0);

    // Am nächsten Morgen: Die App lag im Hintergrund und wird wieder sichtbar
    vi.setSystemTime(new Date(2026, 9, 17, 8, 0));
    document.dispatchEvent(new Event('visibilitychange'));
    expect(due()).toBe(1);
  });

  it('starts new daily limits after midnight without a restart', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 16, 23, 59, 30));
    // Die Uhr erst jetzt erzeugen, damit ihr Minutentakt die künstliche Zeit nutzt
    TestBed.resetTestingModule();
    learning = TestBed.inject(LearningStore);
    TestBed.inject(Settings).update({ newFlashcardsPerDay: 1, newQuestionsPerDay: 0 });
    const [first] = learning.buildQueue({});
    learning.rate(first, RATING.GOOD);
    const fresh = TestBed.runInInjectionContext(() =>
      computed(() => learning.overview({}).newFlashcards),
    );
    expect(fresh()).toBe(0);

    vi.advanceTimersByTime(60_000); // die Uhr tickt jede Minute – jetzt ist es nach Mitternacht
    expect(fresh()).toBe(1);
  });
});
