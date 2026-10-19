import { parseItemsFromText } from './text-import';

describe('parseItemsFromText', () => {
  let counter = 0;
  const newId = () => `id-${++counter}`;

  beforeEach(() => (counter = 0));

  it('reads one flashcard per line, separated by semicolon or tab', () => {
    const text = 'Was ist 2 + 2? ; 4\nHauptstadt von Frankreich?\tParis\n\n';
    const { items, skipped } = parseItemsFromText(text, 'flashcard', 'k1', newId);

    expect(skipped).toEqual([]);
    expect(items).toEqual([
      { kind: 'flashcard', id: 'id-1', chapterId: 'k1', front: 'Was ist 2 + 2?', back: '4' },
      {
        kind: 'flashcard',
        id: 'id-2',
        chapterId: 'k1',
        front: 'Hauptstadt von Frankreich?',
        back: 'Paris',
      },
    ]);
  });

  it('keeps semicolons inside the answer of a flashcard', () => {
    const { items } = parseItemsFromText('Drei Farben? ; Rot; Gelb; Blau', 'flashcard', 'k1');
    expect(items[0]).toMatchObject({ front: 'Drei Farben?', back: 'Rot; Gelb; Blau' });
  });

  it('reads quiz questions with one to three wrong answers and an optional explanation', () => {
    const text = [
      '2 + 2 = ? ; 4 ; 3',
      'Himmelsfarbe? ; Blau ; Grün ; Rot ; Gelb ; Lichtstreuung',
    ].join('\n');
    const { items } = parseItemsFromText(text, 'choice', 'k1', newId);

    expect(items).toEqual([
      {
        kind: 'choice',
        id: 'id-1',
        chapterId: 'k1',
        question: '2 + 2 = ?',
        correct: '4',
        wrong: ['3'],
        explanation: '',
      },
      {
        kind: 'choice',
        id: 'id-2',
        chapterId: 'k1',
        question: 'Himmelsfarbe?',
        correct: 'Blau',
        wrong: ['Grün', 'Rot', 'Gelb'],
        explanation: 'Lichtstreuung',
      },
    ]);
  });

  it('reports lines that do not fit, with line number and reason', () => {
    const text = 'Nur eine Frage\nFrage ; Antwort\n# Kommentar wird übersprungen';
    const flashcards = parseItemsFromText(text, 'flashcard', 'k1');
    expect(flashcards.items).toHaveLength(1);
    expect(flashcards.skipped).toEqual([{ line: 1, reason: 'Frage oder Antwort fehlt' }]);

    const quiz = parseItemsFromText('Frage ; richtig', 'choice', 'k1');
    expect(quiz.skipped).toEqual([{ line: 1, reason: 'Mindestens eine falsche Antwort fehlt' }]);
  });

  it('understands quoted CSV fields and line breaks from Anki exports', () => {
    const text = '#separator:tab\n"Er sagte ""Hallo"""\tZeile 1<br>Zeile 2';
    const { items } = parseItemsFromText(text, 'flashcard', 'k1');
    expect(items[0]).toMatchObject({ front: 'Er sagte "Hallo"', back: 'Zeile 1\nZeile 2' });
  });
});
