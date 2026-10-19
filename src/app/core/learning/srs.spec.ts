import { RATING, createCardState, formatDue, formatInterval, scheduleCard } from './srs';

describe('scheduleCard', () => {
  const now = new Date(2026, 9, 16, 12, 0).getTime();

  it('schedules a new card by rating', () => {
    const state = createCardState();
    const previews = [RATING.AGAIN, RATING.HARD, RATING.GOOD, RATING.EASY].map((rating) =>
      formatInterval(scheduleCard(state, rating, now), now),
    );
    expect(previews).toEqual(['1 Min', '10 Min', '1 T', '4 T']);
  });

  it('grows the interval when a card is answered "Gut" repeatedly', () => {
    let state = createCardState();
    const intervals: number[] = [];
    let time = now;
    for (let i = 0; i < 5; i++) {
      state = scheduleCard(state, RATING.GOOD, time);
      intervals.push(state.interval);
      time = state.due;
    }
    expect(intervals).toEqual([1, 3, 8, 20, 50]);
  });

  it('makes a card due from midnight of the target day', () => {
    const state = scheduleCard(createCardState(), RATING.GOOD, now);
    expect(new Date(state.due)).toEqual(new Date(2026, 9, 17, 0, 0));
  });

  it('resets a forgotten card and lowers its ease', () => {
    let state = scheduleCard(createCardState(), RATING.GOOD, now);
    state = scheduleCard(state, RATING.AGAIN, now);
    expect(state).toMatchObject({ reps: 0, interval: 0, ease: 2.3, lapses: 1 });
  });

  it('never lets ease fall below 1.3', () => {
    let state = createCardState();
    for (let i = 0; i < 20; i++) state = scheduleCard(state, RATING.AGAIN, now);
    expect(state.ease).toBe(1.3);
  });

  it('describes when a card is due again', () => {
    const tomorrow = scheduleCard(createCardState(), RATING.GOOD, now);
    expect(formatDue(tomorrow, now)).toBe('morgen');
    const inThreeDays = scheduleCard(tomorrow, RATING.GOOD, now); // zweites "Richtig" → 3 Tage
    expect(formatDue(inThreeDays, now)).toBe('in 3 T');
    expect(formatDue(scheduleCard(tomorrow, RATING.AGAIN, now), now)).toBe('in 1 Min');
    expect(formatDue(tomorrow, tomorrow.due)).toBe('fällig');
  });
});
