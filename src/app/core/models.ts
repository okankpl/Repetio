// Fachliches Datenmodell der App.
//
// Aufbau wie ein Register: Fach → Kapitel → Lerneinheiten.
// Die Objekte verweisen über ids aufeinander (subjectId, chapterId) statt ineinander verschachtelt
// zu sein – wie Tabellen in einer Datenbank. So lässt sich jedes Objekt einzeln ändern oder löschen.

/** Ein Fach, z. B. "Mathematik" */
export interface Subject {
  id: string;
  name: string;
}

/** Ein Kapitel innerhalb eines Fachs; die Reihenfolge ergibt sich aus der Liste */
export interface Chapter {
  id: string;
  subjectId: string;
  title: string;
}

/** Karteikarte: Frage lesen, Antwort selbst formulieren, selbst bewerten */
export interface Flashcard {
  kind: 'flashcard';
  /** Stabile, eindeutige Kennung – daran hängt der gespeicherte Lernfortschritt */
  id: string;
  chapterId: string;
  front: string;
  back: string;
}

/** Quizfrage mit genau einer richtigen Antwort; die App wertet sie selbst aus */
export interface ChoiceQuestion {
  kind: 'choice';
  id: string;
  chapterId: string;
  question: string;
  correct: string;
  /** Falsche, aber plausible Antwortmöglichkeiten (Distraktoren) */
  wrong: string[];
  /** Begründung, die nach dem Antworten angezeigt wird (darf leer sein) */
  explanation: string;
}

/**
 * Union-Typ: Eine Lerneinheit ist entweder eine Karteikarte oder eine Quizfrage.
 * Über das Feld `kind` erkennt TypeScript, welcher der beiden Typen vorliegt.
 */
export type StudyItem = Flashcard | ChoiceQuestion;
export type StudyKind = StudyItem['kind'];

/** Der Text, mit dem eine Einheit in Listen erscheint: Vorderseite bzw. Frage */
export function itemTitle(item: StudyItem): string {
  return item.kind === 'flashcard' ? item.front : item.question;
}

/** Alle Inhalte der App – so werden sie gespeichert und exportiert */
export interface Library {
  subjects: Subject[];
  chapters: Chapter[];
  items: StudyItem[];
}

/** Umfang einer Lernrunde: alles (leer), ein Fach oder ein Kapitel */
export interface StudyScope {
  subjectId?: string;
  chapterId?: string;
}

// ---------- Prüfungen für Daten von außen (Speicher, Import) ----------
// TypeScript-Typen gibt es nur beim Entwickeln; Daten aus dem localStorage oder einer Datei
// müssen zur Laufzeit geprüft werden, bevor die App sich auf ihre Form verlässt.

/** Ein einfaches Objekt (kein Array, nicht null) */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isLibrary(value: unknown): value is Library {
  return (
    isRecord(value) &&
    Array.isArray(value['subjects']) &&
    value['subjects'].every((subject) => isRecord(subject) && typeof subject['id'] === 'string') &&
    Array.isArray(value['chapters']) &&
    value['chapters'].every(
      (chapter) => isRecord(chapter) && typeof chapter['subjectId'] === 'string',
    ) &&
    Array.isArray(value['items']) &&
    value['items'].every(isStudyItem)
  );
}

function isStudyItem(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value['id'] === 'string' &&
    typeof value['chapterId'] === 'string' &&
    (value['kind'] === 'flashcard' || value['kind'] === 'choice')
  );
}
