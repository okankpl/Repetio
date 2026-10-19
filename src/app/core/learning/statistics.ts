// Kennzahlen für die Statistikseite als reine Funktionen: ohne Angular, einzeln testbar.

import { DAY_MS, MINUTE_MS, addDays, dayKey, startOfDay } from '../dates';
import { ActivityLog, DayActivity, EMPTY_DAY } from './activity';
import { CardState } from './srs';

/** Ab diesem Intervall (Tage) gilt eine Einheit als „gefestigt“ – dieselbe Grenze nutzt Anki */
export const MATURE_INTERVAL_DAYS = 21;

/** Lernstand einer Einheit, grob eingeteilt */
export type Maturity = 'new' | 'learning' | 'young' | 'mature';

export const MATURITY_LABELS: Record<Maturity, string> = {
  new: 'neu',
  learning: 'in Arbeit',
  young: 'gelernt',
  mature: 'gefestigt',
};

export function maturityOf(state: CardState | undefined): Maturity {
  if (!state) return 'new';
  // Nach „falsch“ steht das Intervall auf 0: die Einheit muss erst wieder sitzen
  if (state.interval === 0) return 'learning';
  return state.interval < MATURE_INTERVAL_DAYS ? 'young' : 'mature';
}

/** Zählt die Einheiten je Lernstand */
export function countByMaturity(states: (CardState | undefined)[]): Record<Maturity, number> {
  const counts: Record<Maturity, number> = { new: 0, learning: 0, young: 0, mature: 0 };
  for (const state of states) counts[maturityOf(state)]++;
  return counts;
}

/** Ein Tag im Verlauf, mit Datum für die Beschriftung */
export interface ActivityDay extends DayActivity {
  /** Mitternacht des Tages */
  date: number;
}

/** Die letzten `days` Tage bis einschließlich heute, älteste zuerst; Tage ohne Lernen mit 0 */
export function activityHistory(log: ActivityLog, days: number, now: number): ActivityDay[] {
  return Array.from({ length: days }, (_, index) => {
    const date = addDays(now, index - days + 1);
    return { ...(log[dayKey(date)] ?? EMPTY_DAY), date };
  });
}

/**
 * Lernserie: an wie vielen Tagen in Folge gelernt wurde. Ein heute noch nicht genutzter Tag
 * unterbricht die Serie nicht – sie zählt dann bis gestern.
 */
export function currentStreak(log: ActivityLog, now: number): number {
  const learnedOn = (offset: number) => (log[dayKey(addDays(now, offset))]?.reviews ?? 0) > 0;
  let offset = learnedOn(0) ? 0 : -1;
  let streak = 0;
  while (learnedOn(offset)) {
    streak++;
    offset--;
  }
  return streak;
}

/** Summe mehrerer Tage, z. B. für „letzte 30 Tage“ */
export function sumDays(days: DayActivity[]): DayActivity {
  return days.reduce(
    (sum, day) => ({
      reviews: sum.reviews + day.reviews,
      correct: sum.correct + day.correct,
      learned: sum.learned + day.learned,
      timeMs: sum.timeMs + day.timeMs,
    }),
    EMPTY_DAY,
  );
}

/** Anteil richtiger Antworten in Prozent (gerundet); null, wenn es keine Antworten gibt */
export function accuracy(activity: DayActivity): number | null {
  return activity.reviews > 0 ? Math.round((activity.correct / activity.reviews) * 100) : null;
}

/**
 * Prognose: wie viele Einheiten an den nächsten `days` Tagen fällig werden.
 * Index 0 = heute, einschließlich allem, was schon überfällig ist.
 */
export function dueForecast(states: CardState[], days: number, now: number): number[] {
  const counts = new Array<number>(days).fill(0);
  const today = startOfDay(now);
  for (const state of states) {
    // Math.round gleicht Tage mit Zeitumstellung aus (23 bzw. 25 Stunden)
    const offset = Math.max(0, Math.round((startOfDay(state.due) - today) / DAY_MS));
    if (offset < days) counts[offset]++;
  }
  return counts;
}

/** Lernzeit lesbar: „45 Min“, „2 Std 5 Min“, „< 1 Min“ */
export function formatDuration(ms: number): string {
  const minutes = Math.round(ms / MINUTE_MS);
  if (minutes < 1) return ms > 0 ? '< 1 Min' : '0 Min';
  if (minutes < 60) return `${minutes} Min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours} Std ${rest} Min` : `${hours} Std`;
}
