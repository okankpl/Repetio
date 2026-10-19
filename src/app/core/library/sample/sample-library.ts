import { Library } from '../../models';
import { FLASHCARDS } from './flashcards';
import { QUESTIONS } from './questions';
import { SAMPLE_SUBJECT_ID } from './sample-id';

/**
 * Beispielfach, mit dem die App beim ersten Start gefüllt wird (geladen über load-sample.ts).
 * Es führt nebenbei in die App ein. Danach gehört es zu den eigenen Daten und lässt sich wie
 * jedes andere Fach bearbeiten oder löschen.
 */
export const SAMPLE_LIBRARY: Library = {
  subjects: [{ id: SAMPLE_SUBJECT_ID, name: 'Beispielfach: Besser lernen' }],
  chapters: [
    { id: 'beispiel-1', subjectId: SAMPLE_SUBJECT_ID, title: 'Repetio kennenlernen' },
    { id: 'beispiel-2', subjectId: SAMPLE_SUBJECT_ID, title: 'Lerntechniken' },
    { id: 'beispiel-3', subjectId: SAMPLE_SUBJECT_ID, title: 'Europa' },
  ],
  items: [...FLASHCARDS, ...QUESTIONS],
};
