import { TestBed } from '@angular/core/testing';
import { DataSafety } from './data-safety';
import { STORAGE_KEYS } from './persistence/storage-keys';

describe('DataSafety', () => {
  const now = new Date(2026, 9, 16, 12, 0);
  const day = { reviews: 5, correct: 4, learned: 2, timeMs: 60_000 };

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => vi.useRealTimers());

  function reminderDue(activity: object, lastBackupAt: number | null = null): boolean {
    localStorage.setItem(STORAGE_KEYS.activity, JSON.stringify(activity));
    localStorage.setItem(STORAGE_KEYS.backup, JSON.stringify({ lastBackupAt }));
    return TestBed.inject(DataSafety).reminderDue();
  }

  it('does not remind during the very first day of learning', () => {
    expect(reminderDue({ '2026-10-16': day })).toBe(false);
  });

  it('reminds from the second day of learning when there was never a backup', () => {
    expect(reminderDue({ '2026-10-15': day, '2026-10-16': day })).toBe(true);
  });

  it('reminds when the last backup is a week old', () => {
    const daysAgo = (days: number) => now.getTime() - days * 24 * 60 * 60 * 1000;
    expect(reminderDue({ '2026-10-01': day }, daysAgo(3))).toBe(false);
    TestBed.resetTestingModule();
    expect(reminderDue({ '2026-10-01': day }, daysAgo(7))).toBe(true);
  });
});
