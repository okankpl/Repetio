import { Library } from '../models';
import { copyWithNewIds } from './library-copy';

describe('copyWithNewIds', () => {
  const library: Library = {
    subjects: [{ id: 's', name: 'Physik' }],
    chapters: [
      { id: 'c', subjectId: 's', title: 'Optik' },
      { id: 'verwaist', subjectId: 'gibt-es-nicht', title: '?' },
    ],
    items: [
      { kind: 'flashcard', id: 'i', chapterId: 'c', front: 'Licht?', back: 'Welle und Teilchen' },
      { kind: 'flashcard', id: 'x', chapterId: 'verwaist', front: '?', back: '?' },
    ],
  };

  it('gives every object a new id and rewrites the references', () => {
    let counter = 0;
    const copy = copyWithNewIds(library, () => `neu-${++counter}`);

    expect(copy).toEqual({
      subjects: [{ id: 'neu-1', name: 'Physik' }],
      chapters: [{ id: 'neu-2', subjectId: 'neu-1', title: 'Optik' }],
      items: [
        {
          kind: 'flashcard',
          id: 'neu-3',
          chapterId: 'neu-2',
          front: 'Licht?',
          back: 'Welle und Teilchen',
        },
      ],
    });
  });

  it('leaves the original unchanged', () => {
    const before = structuredClone(library);
    copyWithNewIds(library);
    expect(library).toEqual(before);
  });
});
