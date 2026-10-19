import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Clock } from '../../../core/clock';
import { dayKey } from '../../../core/dates';
import { LearningStore } from '../../../core/learning/learning-store';
import { currentStreak } from '../../../core/learning/statistics';

/**
 * Lernserie unter der Tageskarte: „5 Tage in Folge gelernt · heute 24 Antworten“.
 * Die ganze Karte führt zur Statistik. Bevor jemals gelernt wurde, erscheint sie nicht.
 */
@Component({
  selector: 'app-streak-card',
  imports: [RouterLink],
  template: `
    @if (streak(); as streak) {
      <a class="card streak" routerLink="/statistik">
        <span class="number">{{ streak.days }}</span>
        <span class="text">
          <strong>{{ streak.days === 1 ? 'Tag' : 'Tage' }} in Folge gelernt</strong>
          <small>heute {{ streak.reviewsToday }} Antworten · zur Statistik</small>
        </span>
        <span class="chevron" aria-hidden="true">›</span>
      </a>
    }
  `,
  styles: `
    .streak {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-top: 12px;
      padding-block: 14px;
      color: inherit;
      text-decoration: none;
    }
    .streak:hover {
      background: var(--surface-muted);
    }
    .number {
      flex: none;
      min-width: 44px;
      font-size: 28px;
      font-weight: 700;
      text-align: center;
      color: var(--primary);
    }
    .text {
      display: grid;
      flex: 1;
    }
    small {
      font-size: 13px;
      color: var(--muted);
    }
    .chevron {
      font-size: 22px;
      color: var(--muted);
    }
  `,
})
export class StreakCard {
  private readonly learning = inject(LearningStore);
  private readonly clock = inject(Clock);

  /** Lernserie und heutige Antworten; null, solange noch nie gelernt wurde */
  protected readonly streak = computed(() => {
    const log = this.learning.activityData();
    if (Object.keys(log).length === 0) return null;
    const now = this.clock.now();
    return { days: currentStreak(log, now), reviewsToday: log[dayKey(now)]?.reviews ?? 0 };
  });
}
