import { SAMPLE_LIBRARY } from '../library/sample/sample-library';
import { migrateLegacyStorage, prepareStorage } from './migrations';
import { Library } from '../models';
import { loadJson } from './persistent-signal';
import { STORAGE_KEYS } from './storage-keys';

describe('migrateLegacyStorage', async () => {
  beforeEach(() => localStorage.clear());

  it('moves data of the first versions to the current keys', async () => {
    localStorage.setItem('srs-progress-v1', '{"l1-01":{"reps":1}}');
    localStorage.setItem(
      'srs-custom-cards-v1',
      JSON.stringify([
        { id: 'custom-1', lesson: 3, front: 'Eigene Frage', back: 'Eigene Antwort' },
      ]),
    );
    localStorage.setItem('srs-typing-mode-v1', 'false');

    await migrateLegacyStorage();

    expect(localStorage.getItem(STORAGE_KEYS.progress)).toBe('{"l1-01":{"reps":1}}');
    const library = loadJson<Library | null>(STORAGE_KEYS.library, null)!;
    expect(library.items).toHaveLength(SAMPLE_LIBRARY.items.length + 1);
    expect(library.subjects.at(-1)).toEqual({ id: 'eigene-karten', name: 'Eigene Karten' });
    expect(library.chapters.at(-1)).toEqual({
      id: 'eigene-karten-3',
      subjectId: 'eigene-karten',
      title: 'Lektion 3',
    });
    expect(library.items.at(-1)).toEqual({
      kind: 'flashcard',
      id: 'custom-1',
      chapterId: 'eigene-karten-3',
      front: 'Eigene Frage',
      back: 'Eigene Antwort',
    });
    expect(loadJson(STORAGE_KEYS.settings, {})).toEqual({ typeAnswers: false });
    expect(localStorage.getItem('srs-progress-v1')).toBeNull();
  });

  it('changes nothing when there is no old data', async () => {
    await migrateLegacyStorage();
    expect(localStorage.length).toBe(0);
  });

  it('moves data of the "Merkwerk" version to the current keys', async () => {
    localStorage.setItem('merkwerk.library', '{"subjects":[],"chapters":[],"items":[]}');
    localStorage.setItem('merkwerk.activity', '{"2026-10-18":{"reviews":4,"correct":3}}');

    await migrateLegacyStorage();

    expect(localStorage.getItem(STORAGE_KEYS.library)).toBe(
      '{"subjects":[],"chapters":[],"items":[]}',
    );
    expect(localStorage.getItem(STORAGE_KEYS.activity)).toBe(
      '{"2026-10-18":{"reviews":4,"correct":3}}',
    );
    expect(localStorage.getItem('merkwerk.library')).toBeNull();
  });

  it('moves data of the "Lernkarten" version to the current keys', async () => {
    localStorage.setItem('lernkarten.progress', '{"l2-01":{"reps":3}}');
    localStorage.setItem('lernkarten.settings', '{"newQuestionsPerDay":2}');

    await migrateLegacyStorage();

    expect(localStorage.getItem(STORAGE_KEYS.progress)).toBe('{"l2-01":{"reps":3}}');
    expect(localStorage.getItem(STORAGE_KEYS.settings)).toBe('{"newQuestionsPerDay":2}');
    expect(localStorage.getItem('lernkarten.progress')).toBeNull();
  });

  it('runs all steps for data of the very first version', async () => {
    localStorage.setItem('srs-progress-v1', '{"l1-01":{"reps":1}}');
    await migrateLegacyStorage();
    await migrateLegacyStorage(); // ein zweiter Lauf darf nichts mehr verändern
    expect(localStorage.getItem(STORAGE_KEYS.progress)).toBe('{"l1-01":{"reps":1}}');
    expect(localStorage.length).toBe(1);
  });
});

describe('prepareStorage', () => {
  beforeEach(() => localStorage.clear());

  it('creates the sample subject on the very first start', async () => {
    await prepareStorage();
    expect(loadJson(STORAGE_KEYS.library, null)).toEqual(SAMPLE_LIBRARY);
  });

  it('keeps existing data – also when all subjects were deleted', async () => {
    const empty: Library = { subjects: [], chapters: [], items: [] };
    localStorage.setItem(STORAGE_KEYS.library, JSON.stringify(empty));
    const loadSample = vi.fn(async () => SAMPLE_LIBRARY);

    await prepareStorage(localStorage, loadSample);

    expect(loadJson(STORAGE_KEYS.library, null)).toEqual(empty);
    expect(loadSample).not.toHaveBeenCalled();
  });
});
