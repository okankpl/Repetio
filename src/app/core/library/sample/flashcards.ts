// Karteikarten des Beispielfachs. Die ids müssen stabil bleiben – an ihnen hängt der Lernfortschritt.

import { Flashcard } from '../../models';

/** Kurzschreibweise für eine Karteikarte des Beispielfachs */
function card(id: string, chapterId: string, front: string, back: string): Flashcard {
  return { kind: 'flashcard', id, chapterId, front, back };
}

export const FLASHCARDS: Flashcard[] = [
  // Repetio kennenlernen
  card(
    'b1-01',
    'beispiel-1',
    'Was bedeutet „fällig“ bei einer Karte?',
    'Der geplante Zeitpunkt für die nächste Wiederholung ist erreicht – die Karte kommt in die nächste Lernrunde.',
  ),
  card(
    'b1-02',
    'beispiel-1',
    'Was passiert, wenn du eine Karte als „falsch“ bewertest?',
    'Sie kommt am Ende derselben Runde noch einmal, und der Abstand bis zur nächsten Wiederholung beginnt von vorn.',
  ),
  card(
    'b1-03',
    'beispiel-1',
    'Was passiert, wenn du eine Karte als „richtig“ bewertest?',
    'Der Abstand wächst: erst 1 Tag, dann 3 Tage, danach jedes Mal um den Faktor 2,5 (bei schwierigen Karten weniger).',
  ),
  card(
    'b1-04',
    'beispiel-1',
    'Wozu gibt es ein Tageslimit für neue Karten?',
    'Jede neue Karte erzeugt Wiederholungen an den folgenden Tagen. Das Limit hält diese Menge überschaubar.',
  ),
  card(
    'b1-05',
    'beispiel-1',
    'Wie legst du viele Karten auf einmal an?',
    'Im Kapitel auf „Import“ tippen und Text einfügen: eine Zeile pro Karte, Frage und Antwort durch ; getrennt.',
  ),
  card(
    'b1-06',
    'beispiel-1',
    'Wie kommen deine Daten vom PC aufs Handy?',
    'In den Einstellungen „Sicherung speichern“ wählen und die Datei auf dem anderen Gerät mit „Sicherung laden“ einlesen.',
  ),
  card(
    'b1-07',
    'beispiel-1',
    'Wie nimmst du eine versehentliche Bewertung zurück?',
    'Mit dem Pfeil oben rechts in der Lernrunde – oder am PC mit der Taste Z.',
  ),
  card(
    'b1-08',
    'beispiel-1',
    'Darfst du dieses Beispielfach löschen?',
    'Ja: auf der Fachseite unter „Fach verwalten“. In den Einstellungen lässt es sich jederzeit wiederherstellen.',
  ),

  // Lerntechniken
  card(
    'b2-01',
    'beispiel-2',
    'Was ist verteilte Wiederholung (Spaced Repetition)?',
    'Lernstoff in wachsenden Abständen wiederholen statt alles auf einmal – am besten kurz bevor man ihn vergessen würde.',
  ),
  card(
    'b2-02',
    'beispiel-2',
    'Was ist aktives Erinnern (Active Recall)?',
    'Die Antwort selbst aus dem Gedächtnis abrufen, bevor man sie nachliest. Das wirkt stärker als erneutes Lesen.',
  ),
  card(
    'b2-03',
    'beispiel-2',
    'Was besagt der Testeffekt?',
    'Sich selbst abzufragen festigt Wissen stärker, als dieselbe Zeit mit Wiederlesen zu verbringen.',
  ),
  card(
    'b2-04',
    'beispiel-2',
    'Was ist verschachteltes Lernen (Interleaving)?',
    'Verschiedene Themen oder Aufgabentypen im Wechsel üben statt jeweils in einem Block.',
  ),
  card(
    'b2-05',
    'beispiel-2',
    'Was zeigt die Vergessenskurve nach Hermann Ebbinghaus?',
    'Ohne Wiederholung geht ein großer Teil des Gelernten schon in den ersten Tagen verloren. Jede Wiederholung verlangsamt das Vergessen.',
  ),
  card(
    'b2-06',
    'beispiel-2',
    'Warum sollte eine Karte nur eine Sache abfragen?',
    'Kleine, eindeutige Fragen lassen sich ehrlich bewerten und werden seltener vergessen.',
  ),
  card(
    'b2-07',
    'beispiel-2',
    'Was hilft bei Karten, die du immer wieder vergisst?',
    'Umformulieren, in kleinere Karten aufteilen oder mit einem Beispiel oder einer Eselsbrücke verknüpfen.',
  ),
  card(
    'b2-08',
    'beispiel-2',
    'Warum lohnt es sich, Karten in eigenen Worten zu schreiben?',
    'Wer selbst formuliert, setzt sich gründlicher mit dem Stoff auseinander und versteht ihn besser.',
  ),
  card(
    'b2-09',
    'beispiel-2',
    'Was ist die Feynman-Methode?',
    'Ein Thema so erklären, als würde man es jemandem ohne Vorwissen beibringen. Wissenslücken zeigen sich dabei sofort.',
  ),

  // Europa
  card('b3-01', 'beispiel-3', 'Hauptstadt von Portugal?', 'Lissabon'),
  card('b3-02', 'beispiel-3', 'Hauptstadt von Norwegen?', 'Oslo'),
  card('b3-03', 'beispiel-3', 'Hauptstadt von Polen?', 'Warschau'),
  card('b3-04', 'beispiel-3', 'Hauptstadt von Ungarn?', 'Budapest'),
  card(
    'b3-05',
    'beispiel-3',
    'Durch welche Hauptstädte fließt die Donau?',
    'Wien, Bratislava, Budapest und Belgrad',
  ),
  card(
    'b3-06',
    'beispiel-3',
    'Welches ist der höchste Berg der Alpen?',
    'Der Mont Blanc (rund 4.800 m) an der Grenze zwischen Frankreich und Italien',
  ),
  card(
    'b3-07',
    'beispiel-3',
    'Welcher ist der längste Fluss Europas?',
    'Die Wolga (rund 3.500 km)',
  ),
];
