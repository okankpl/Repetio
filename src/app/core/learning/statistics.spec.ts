import { ActivityLog, EMPTY_DAY, recordReview } from './activity';
import { createCardState } from './srs';
import {
  accuracy,
  activityHistory,
  countByMaturity,
  currentStreak,
  dueForecast,
  formatDuration,
  maturityOf,
  sumDays,
} from './statistics';

describe('statistics', () => {
  const now = new Date(2026, 9, 16, 12, 0).getTime();
  const day = (reviews: number, correct = reviews) => ({ ...EMPTY_DAY, reviews, correct });

  it('counts a streak up to today, or up to yesterday while today is still open', () => {
    const log: ActivityLog = {
      '2026-10-13': day(4),
      '2026-10-14': day(2),
      '2026-10-15': day(7),
    };
    expect(currentStreak(log, now)).toBe(3);
    expect(currentStreak({ ...log, '2026-10-16': day(1) }, now)).toBe(4);
    // Eine Lücke beendet die Serie
    expect(currentStreak({ '2026-10-14': day(5) }, now)).toBe(0);
  });

  it('lists the last days oldest first and fills days without learning with 0', () => {
    const history = activityHistory({ '2026-10-15': day(3) }, 3, now);
    expect(history.map((entry) => entry.reviews)).toEqual([0, 3, 0]);
    expect(new Date(history[0].date)).toEqual(new Date(2026, 9, 14));
  });

  it('sums days and computes the share of correct answers', () => {
    const total = sumDays([day(10, 8), day(10, 9)]);
    expect(total.reviews).toBe(20);
    expect(accuracy(total)).toBe(85);
    expect(accuracy(EMPTY_DAY)).toBeNull();
  });

  it('records a review and caps the time of a single answer', () => {
    const log = recordReview({}, '2026-10-16', { correct: true, isNew: true, timeMs: 3_600_000 });
    expect(log['2026-10-16']).toEqual({ reviews: 1, correct: 1, learned: 1, timeMs: 120_000 });
  });

  it('groups items by how well they are learned', () => {
    const learning = { ...createCardState(), reps: 0, interval: 0, due: now };
    const young = { ...createCardState(), reps: 2, interval: 3 };
    const mature = { ...createCardState(), reps: 5, interval: 40 };
    expect([undefined, learning, young, mature].map(maturityOf)).toEqual([
      'new',
      'learning',
      'young',
      'mature',
    ]);
    expect(countByMaturity([undefined, undefined, young])).toEqual({
      new: 2,
      learning: 0,
      young: 1,
      mature: 0,
    });
  });

  it('forecasts due reviews per day, counting overdue ones for today', () => {
    const dueOn = (date: Date) => ({
      ...createCardState(),
      reps: 1,
      interval: 1,
      due: date.getTime(),
    });
    const states = [
      dueOn(new Date(2026, 9, 10)), // überfällig → heute
      dueOn(new Date(2026, 9, 16, 18, 0)), // heute
      dueOn(new Date(2026, 9, 17)), // morgen
      dueOn(new Date(2026, 9, 17)),
      dueOn(new Date(2026, 10, 30)), // außerhalb der Prognose
    ];
    expect(dueForecast(states, 3, now)).toEqual([2, 2, 0]);
  });

  it('formats learning time', () => {
    expect(formatDuration(0)).toBe('0 Min');
    expect(formatDuration(20_000)).toBe('< 1 Min');
    expect(formatDuration(45 * 60_000)).toBe('45 Min');
    expect(formatDuration(125 * 60_000)).toBe('2 Std 5 Min');
  });
});
