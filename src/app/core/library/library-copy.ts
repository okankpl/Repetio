import { createId } from '../id';
import { Library } from '../models';

/**
 * Kopie von Inhalten mit lauter neuen ids – zum Hinzufügen eines geteilten Fachs.
 *
 * Neue ids verhindern Zusammenstöße mit vorhandenen Einträgen (etwa wenn dasselbe Fach zweimal
 * geladen wird). Die Verweise (subjectId, chapterId) werden dabei passend umgeschrieben.
 * Verwaiste Kapitel und Einheiten ohne passendes Fach bzw. Kapitel werden weggelassen.
 */
export function copyWithNewIds(library: Library, newId: () => string = createId): Library {
  const subjectIds = new Map(library.subjects.map((subject) => [subject.id, newId()]));
  const chapterIds = new Map(
    library.chapters
      .filter((chapter) => subjectIds.has(chapter.subjectId))
      .map((chapter) => [chapter.id, newId()]),
  );

  return {
    subjects: library.subjects.map((subject) => ({ ...subject, id: subjectIds.get(subject.id)! })),
    chapters: library.chapters
      .filter((chapter) => chapterIds.has(chapter.id))
      .map((chapter) => ({
        ...chapter,
        id: chapterIds.get(chapter.id)!,
        subjectId: subjectIds.get(chapter.subjectId)!,
      })),
    items: library.items
      .filter((item) => chapterIds.has(item.chapterId))
      .map((item) => ({ ...item, id: newId(), chapterId: chapterIds.get(item.chapterId)! })),
  };
}
