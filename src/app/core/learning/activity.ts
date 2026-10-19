// Lernprotokoll für die Statistik: je Tag eine Summe statt jeder einzelnen Bewertung.
// So bleibt der Speicherbedarf klein (rund 60 Byte pro Lerntag) und wächst nicht mit der Kartenzahl.

import { isRecord } from '../models';

/** Was an einem Tag gelernt wurde */
export interface DayActivity {
  /** Bewertungen insgesamt (auch wiederholte Versuche derselben Einheit) */
  reviews: number;
  /** davon richtig */
  correct: number;
  /** Einheiten, die an diesem Tag zum ersten Mal gelernt wurden */
  learned: number;
  /** Lernzeit in ms */
  timeMs: number;
}

/** Tageswerte, Schlüssel = Tag im Format JJJJ-MM-TT */
export type ActivityLog = Record<string, DayActivity>;

export const EMPTY_DAY: DayActivity = { reviews: 0, correct: 0, learned: 0, timeMs: 0 };

/** Höchstens so viel Zeit zählt pro Antwort – wer das Handy weglegt, verfälscht sonst die Lernzeit */
export const MAX_TIME_PER_REVIEW_MS = 2 * 60 * 1000;

export interface Review {
  correct: boolean;
  /** Ob die Einheit dabei zum ersten Mal gelernt wurde */
  isNew: boolean;
  timeMs: number;
}

/** Gibt ein neues Protokoll zurück, in dem die Bewertung am Tag `day` mitgezählt ist. */
export function recordReview(log: ActivityLog, day: string, review: Review): ActivityLog {
  const current = log[day] ?? EMPTY_DAY;
  return {
    ...log,
    [day]: {
      reviews: current.reviews + 1,
      correct: current.correct + (review.correct ? 1 : 0),
      learned: current.learned + (review.isNew ? 1 : 0),
      timeMs: current.timeMs + Math.min(Math.max(0, review.timeMs), MAX_TIME_PER_REVIEW_MS),
    },
  };
}

export function isActivityLog(value: unknown): value is ActivityLog {
  return (
    isRecord(value) &&
    Object.values(value).every(
      (day) =>
        isRecord(day) && typeof day['reviews'] === 'number' && typeof day['correct'] === 'number',
    )
  );
}
