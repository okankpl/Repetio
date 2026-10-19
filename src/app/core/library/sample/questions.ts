// Quizfragen des Beispielfachs. Die ids müssen stabil bleiben – an ihnen hängt der Lernfortschritt.

import { ChoiceQuestion } from '../../models';

export const QUESTIONS: ChoiceQuestion[] = [
  // Repetio kennenlernen
  {
    kind: 'choice',
    id: 'q1-01',
    chapterId: 'beispiel-1',
    question: 'Wann kommt eine als „falsch“ bewertete Karte wieder?',
    correct: 'Noch in derselben Lernrunde',
    wrong: ['Morgen früh', 'In einer Woche', 'Erst nach dem Zurücksetzen'],
    explanation: 'Falsch beantwortete Einheiten hängt Repetio ans Ende der laufenden Runde.',
  },
  {
    kind: 'choice',
    id: 'q1-02',
    chapterId: 'beispiel-1',
    question: 'Wo liegen deine Fächer und Karten?',
    correct: 'Nur auf diesem Gerät',
    wrong: ['Auf einem Server von Repetio', 'In einem Benutzerkonto', 'In einer Cloud'],
    explanation: 'Repetio hat keinen Server. Darum sind Sicherungen wichtig.',
  },
  {
    kind: 'choice',
    id: 'q1-03',
    chapterId: 'beispiel-1',
    question: 'Wie sieht eine Zeile im Massenimport für Karteikarten aus?',
    correct: 'Frage ; Antwort',
    wrong: ['Eine Karte pro Datei', 'Frage und Antwort in getrennten Zeilen', 'Nur die Antwort'],
    explanation: 'Statt des Semikolons geht auch ein Tabulator, z. B. beim Kopieren aus Excel.',
  },

  // Lerntechniken
  {
    kind: 'choice',
    id: 'q2-01',
    chapterId: 'beispiel-2',
    question: 'Nach welchem Prinzip plant Repetio Wiederholungen?',
    correct: 'Verteilte Wiederholung',
    wrong: ['Alles an einem Tag', 'Zufällige Reihenfolge', 'Alphabetische Reihenfolge'],
    explanation: 'Gut Gewusstes kommt in immer größeren Abständen, Unsicheres häufiger.',
  },
  {
    kind: 'choice',
    id: 'q2-02',
    chapterId: 'beispiel-2',
    question: 'Was hilft am meisten, um sich etwas langfristig zu merken?',
    correct: 'Sich selbst abfragen',
    wrong: [
      'Den Text mehrmals lesen',
      'Wichtiges farbig markieren',
      'Zusammenfassungen abschreiben',
    ],
    explanation: 'Das ist der Testeffekt: Abrufen stärkt die Erinnerung mehr als Wiederlesen.',
  },
  {
    kind: 'choice',
    id: 'q2-03',
    chapterId: 'beispiel-2',
    question: 'Was bedeutet Interleaving?',
    correct: 'Themen im Wechsel üben',
    wrong: ['Ein Thema am Stück üben', 'Ohne Pausen lernen', 'Nur neue Karten lernen'],
    explanation: '',
  },
  {
    kind: 'choice',
    id: 'q2-04',
    chapterId: 'beispiel-2',
    question: 'Was tust du am besten mit einer Karte, die du ständig vergisst?',
    correct: 'Umformulieren oder aufteilen',
    wrong: ['Einfach als richtig bewerten', 'Mehrmals hintereinander lesen', 'Nie wieder lernen'],
    explanation: 'Die Statistik zeigt solche Karten unter „Am häufigsten vergessen“.',
  },

  // Europa
  {
    kind: 'choice',
    id: 'q3-01',
    chapterId: 'beispiel-3',
    question: 'Wo haben Regierung und Parlament der Schweiz ihren Sitz?',
    correct: 'Bern',
    wrong: ['Zürich', 'Genf', 'Basel'],
    explanation: 'Bern ist die Bundesstadt der Schweiz; Zürich ist die größte Stadt.',
  },
  {
    kind: 'choice',
    id: 'q3-02',
    chapterId: 'beispiel-3',
    question: 'Wie viele Staaten grenzen an Deutschland?',
    correct: '9',
    wrong: ['7', '8', '10'],
    explanation:
      'Dänemark, Polen, Tschechien, Österreich, die Schweiz, Frankreich, Luxemburg, Belgien und die Niederlande.',
  },
  {
    kind: 'choice',
    id: 'q3-03',
    chapterId: 'beispiel-3',
    question: 'Welcher Fluss fließt durch Paris?',
    correct: 'Seine',
    wrong: ['Loire', 'Rhône', 'Garonne'],
    explanation: '',
  },
  {
    kind: 'choice',
    id: 'q3-04',
    chapterId: 'beispiel-3',
    question: 'In welchem Land liegt Krakau?',
    correct: 'Polen',
    wrong: ['Tschechien', 'Slowakei', 'Ungarn'],
    explanation: 'Krakau war jahrhundertelang die Hauptstadt Polens.',
  },
];
