// Spaced-Repetition-Algorithmus: vereinfachte SM-2-Variante (so hat Anki ursprünglich gearbeitet)

import { DAY_MS, MINUTE_MS, addDays, startOfDay } from '../dates';

export interface CardState {
  /** wie oft die Karte zuletzt in Folge gewusst wurde */
  reps: number;
  /** Abstand bis zur nächsten Wiederholung in Tagen (0 = heute nochmal) */
  interval: number;
  /** Wachstumsfaktor des Intervalls (startet bei 2.5, sinkt bei "Nochmal"/"Schwer") */
  ease: number;
  /** wie oft eine bereits gelernte Karte vergessen wurde */
  lapses: number;
  /** Zeitpunkt in ms, ab dem die Karte wieder fällig ist */
  due: number;
}

export const RATING = { AGAIN: 0, HARD: 1, GOOD: 2, EASY: 3 } as const;
export type Rating = (typeof RATING)[keyof typeof RATING];

const START_EASE = 2.5;
const MIN_EASE = 1.3;

export function createCardState(): CardState {
  return { reps: 0, interval: 0, ease: START_EASE, lapses: 0, due: 0 };
}

export function scheduleCard(state: CardState, rating: Rating, now = Date.now()): CardState {
  const next = { ...state };

  if (rating === RATING.AGAIN) {
    next.reps = 0;
    next.interval = 0;
    next.ease = Math.max(MIN_EASE, state.ease - 0.2);
    next.lapses = state.lapses + (state.reps > 0 ? 1 : 0);
    next.due = now + MINUTE_MS;
    return next;
  }

  if (rating === RATING.HARD && state.reps === 0) {
    next.due = now + 10 * MINUTE_MS;
    return next;
  }

  const goodInterval = getGoodInterval(state);

  if (rating === RATING.HARD) {
    next.interval = Math.min(
      goodInterval,
      Math.max(state.interval + 1, Math.round(state.interval * 1.2)),
    );
    next.ease = Math.max(MIN_EASE, state.ease - 0.15);
  } else if (rating === RATING.GOOD) {
    next.interval = goodInterval;
  } else {
    next.interval =
      state.reps === 0 ? 4 : Math.max(goodInterval + 1, Math.round(goodInterval * 1.3));
    next.ease = state.ease + 0.15;
  }

  next.reps = state.reps + 1;
  // Fällig ab Mitternacht des Zieltages, damit "in 1 Tag" auch wirklich morgen früh bedeutet
  next.due = addDays(now, next.interval);
  return next;
}

function getGoodInterval(state: CardState): number {
  if (state.reps === 0) return 1;
  if (state.reps === 1) return 3;
  return Math.max(state.interval + 1, Math.round(state.interval * state.ease));
}

/** Wann eine Einheit wieder dran ist, für Listen: "fällig", "in 10 Min", "morgen", "in 5 T" */
export function formatDue(state: CardState, now = Date.now()): string {
  if (state.due <= now) return 'fällig';
  if (state.interval === 0) {
    return `in ${Math.max(1, Math.ceil((state.due - now) / MINUTE_MS))} Min`;
  }
  // Math.round gleicht die eine Stunde aus, um die sich Tage bei der Zeitumstellung unterscheiden
  const days = Math.round((state.due - startOfDay(now)) / DAY_MS);
  return days <= 1 ? 'morgen' : `in ${days} T`;
}

/** Länge des Intervalls, für die Bewertungs-Buttons: "1 Min", "3 T", "1,7 Mon" */
export function formatInterval(state: CardState, now = Date.now()): string {
  if (state.interval === 0) {
    return `${Math.max(1, Math.round((state.due - now) / MINUTE_MS))} Min`;
  }
  if (state.interval < 30) return `${state.interval} T`;
  if (state.interval < 365) return `${(state.interval / 30).toFixed(1).replace('.', ',')} Mon`;
  return `${(state.interval / 365).toFixed(1).replace('.', ',')} J`;
}
