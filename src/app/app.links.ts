import { StudyScope } from './core/models';

// Ziele für Links und Navigation an einer Stelle, passend zu den Routen in app.routes.ts.
// Ändert sich eine Adresse, muss sie nur hier und dort angepasst werden.
// Die Arrays sind das Format, das [routerLink] und router.navigate() erwarten.

export function subjectLink(subjectId: string): string[] {
  return ['/fach', subjectId];
}

export function chapterLink(subjectId: string, chapterId: string): string[] {
  return ['/fach', subjectId, 'kapitel', chapterId];
}

export function itemLink(subjectId: string, chapterId: string, itemId: string): string[] {
  return [...chapterLink(subjectId, chapterId), 'eintrag', itemId];
}

/** Ziel „zurück“ für einen Lernumfang: Kapitel, Fach oder Startseite */
export function scopeLink({ subjectId, chapterId }: StudyScope): string[] {
  if (subjectId && chapterId) return chapterLink(subjectId, chapterId);
  if (subjectId) return subjectLink(subjectId);
  return ['/'];
}

/**
 * Query-Parameter für /lernen. Nur gesetzte Werte übernehmen,
 * damit die Adresse kein "?fach=undefined" enthält.
 */
export function studyQueryParams({ subjectId, chapterId }: StudyScope): Record<string, string> {
  return { ...(subjectId && { fach: subjectId }), ...(chapterId && { kapitel: chapterId }) };
}
