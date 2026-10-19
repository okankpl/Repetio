// Massenimport: viele Karteikarten oder Quizfragen aus Text anlegen, eine Zeile pro Einheit.
//
// Spalten werden durch Tabulator (z. B. aus Excel oder einem Anki-Export) oder Semikolon getrennt:
//   Karteikarte: Frage ; Antwort
//   Quizfrage:   Frage ; richtige Antwort ; 1–3 falsche Antworten ; (bei 6 Spalten) Begründung
// Leere Zeilen und Zeilen mit # am Anfang (Kopfzeilen eines Anki-Exports) werden übersprungen.

import { createId } from '../id';
import { StudyItem, StudyKind } from '../models';

/** Eine Zeile, die nicht übernommen werden konnte */
export interface SkippedLine {
  /** Zeilennummer, ab 1 gezählt */
  line: number;
  reason: string;
}

export interface TextImportResult {
  items: StudyItem[];
  skipped: SkippedLine[];
}

export function parseItemsFromText(
  text: string,
  kind: StudyKind,
  chapterId: string,
  newId: () => string = createId,
): TextImportResult {
  const result: TextImportResult = { items: [], skipped: [] };

  text.split(/\r?\n/).forEach((raw, index) => {
    const line = raw.trim();
    if (!line || line.startsWith('#')) return;

    const separator = line.includes('\t') ? '\t' : ';';
    const fields = line.split(separator).map(cleanField);
    const parsed =
      kind === 'flashcard'
        ? toFlashcard(fields, separator, chapterId, newId)
        : toQuestion(fields, chapterId, newId);

    if (typeof parsed === 'string') result.skipped.push({ line: index + 1, reason: parsed });
    else result.items.push(parsed);
  });

  return result;
}

/** Liefert die Karteikarte oder einen Grund, warum die Zeile nicht passt */
function toFlashcard(
  fields: string[],
  separator: string,
  chapterId: string,
  newId: () => string,
): StudyItem | string {
  const [front, ...rest] = fields;
  // Enthält die Antwort selbst das Trennzeichen, gehört alles nach der Frage zur Antwort
  const back = rest.join(separator === '\t' ? ' ' : '; ').trim();
  if (!front || !back) return 'Frage oder Antwort fehlt';
  return { kind: 'flashcard', id: newId(), chapterId, front, back };
}

function toQuestion(fields: string[], chapterId: string, newId: () => string): StudyItem | string {
  if (fields.length > 6) return 'Zu viele Spalten (höchstens 6)';
  const [question, correct, ...others] = fields;
  // Genau 6 Spalten: die letzte ist die Begründung, davor stehen drei falsche Antworten
  const explanation = fields.length === 6 ? (others.pop() ?? '') : '';
  const wrong = others.filter(Boolean);
  if (!question || !correct) return 'Frage oder richtige Antwort fehlt';
  if (wrong.length === 0) return 'Mindestens eine falsche Antwort fehlt';
  return { kind: 'choice', id: newId(), chapterId, question, correct, wrong, explanation };
}

/**
 * Bereinigt eine Spalte: Leerzeichen am Rand weg, Anführungszeichen einer CSV-Spalte weg
 * ("" steht dort für ein einzelnes "), Zeilenumbrüche aus Anki (<br>) als echte Umbrüche.
 */
function cleanField(field: string): string {
  let value = field.trim();
  if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
    value = value.slice(1, -1).replace(/""/g, '"');
  }
  return value.replace(/<br\s*\/?>/gi, '\n').trim();
}
