import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Clock } from '../../core/clock';
import { addDays, dayKey } from '../../core/dates';
import { EMPTY_DAY } from '../../core/learning/activity';
import { LearningStore } from '../../core/learning/learning-store';
import { CardState } from '../../core/learning/srs';
import {
  MATURITY_LABELS,
  Maturity,
  accuracy,
  activityHistory,
  countByMaturity,
  currentStreak,
  dueForecast,
  formatDuration,
  sumDays,
} from '../../core/learning/statistics';
import { LibraryStore } from '../../core/library/library-store';
import { StudyItem } from '../../core/models';
import { Bar, BarChart } from '../../shared/bar-chart/bar-chart';
import { PageHeader } from '../../shared/page-header/page-header';

/** Wählbare Zeiträume für den Verlauf */
const RANGES = [14, 30] as const;
type Range = (typeof RANGES)[number];

/** So weit reicht die Prognose in die Zukunft */
const FORECAST_DAYS = 14;
/** So viele Problemkarten werden gezeigt */
const PROBLEM_COUNT = 5;

const MATURITY_ORDER: Maturity[] = ['mature', 'young', 'learning', 'new'];

const shortDate = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'numeric' });
const longDate = new Intl.DateTimeFormat('de-DE', {
  weekday: 'short',
  day: 'numeric',
  month: 'numeric',
});

/** Ein Abschnitt im Lernstand-Diagramm, z. B. „gefestigt: 40“ */
interface Segment {
  maturity: Maturity;
  label: string;
  count: number;
  percent: number;
}

/**
 * Statistik: Lernserie, Verlauf der letzten Tage, Prognose, Lernstand je Fach und Problemkarten.
 * Die Kennzahlen berechnen die reinen Funktionen aus statistics.ts; die Seite bereitet sie nur auf.
 */
@Component({
  selector: 'app-statistics-page',
  imports: [RouterLink, PageHeader, BarChart],
  templateUrl: './statistics-page.html',
  styleUrl: './statistics-page.css',
})
export class StatisticsPage {
  private readonly library = inject(LibraryStore);
  private readonly learning = inject(LearningStore);
  private readonly clock = inject(Clock);

  protected readonly ranges = RANGES;
  protected readonly range = signal<Range>(14);

  private readonly log = this.learning.activityData;
  protected readonly hasActivity = computed(() => Object.keys(this.log()).length > 0);

  // ---------- Kennzahlen oben ----------

  protected readonly streak = computed(() => currentStreak(this.log(), this.clock.now()));
  protected readonly today = computed(() => this.log()[dayKey(this.clock.now())] ?? EMPTY_DAY);
  /** Summe des gewählten Zeitraums */
  protected readonly period = computed(() => sumDays(this.history()));
  protected readonly periodAccuracy = computed(() => accuracy(this.period()));
  protected readonly periodTime = computed(() => formatDuration(this.period().timeMs));

  // ---------- Verlauf ----------

  private readonly history = computed(() =>
    activityHistory(this.log(), this.range(), this.clock.now()),
  );

  protected readonly historyBars = computed<Bar[]>(() =>
    this.history().map((day) => {
      const rate = accuracy(day);
      return {
        label: shortDate.format(day.date),
        value: day.reviews,
        description:
          `${longDate.format(day.date)}: ${day.reviews} Antworten` +
          (rate === null ? '' : `, ${rate} % richtig, ${formatDuration(day.timeMs)}`),
      };
    }),
  );

  protected readonly historySummary = computed(() => {
    const { reviews, learned } = this.period();
    return `${reviews} Antworten in ${this.range()} Tagen, davon ${learned} neu gelernt`;
  });

  // ---------- Prognose ----------

  /** Lernstand aller vorhandenen Einheiten (Einträge gelöschter Einheiten zählen nicht) */
  private readonly states = computed(() => {
    const progress = this.learning.progressData();
    return this.library
      .items()
      .map((item) => progress[item.id])
      .filter((state): state is CardState => !!state);
  });

  protected readonly forecastBars = computed<Bar[]>(() => {
    const now = this.clock.now();
    return dueForecast(this.states(), FORECAST_DAYS, now).map((count, offset) => {
      const date = addDays(now, offset);
      const name = offset === 0 ? 'heute' : offset === 1 ? 'morgen' : longDate.format(date);
      return {
        label: offset === 0 ? 'heute' : shortDate.format(date),
        value: count,
        description: `${name}: ${count} fällig`,
      };
    });
  });

  protected readonly forecastSummary = computed(() => {
    const week = this.forecastBars()
      .slice(0, 7)
      .reduce((sum, bar) => sum + bar.value, 0);
    return `${week} Wiederholungen in den nächsten 7 Tagen`;
  });

  // ---------- Lernstand je Fach ----------

  protected readonly maturity = computed(() => {
    const progress = this.learning.progressData();
    const rows = this.library.subjects().map((subject) => ({
      id: subject.id,
      name: subject.name,
      segments: toSegments(this.library.itemsIn({ subjectId: subject.id }), progress),
    }));
    return {
      overall: toSegments(this.library.items(), progress),
      rows,
    };
  });

  /** Text für Screenreader, z. B. „gefestigt 40, gelernt 12, in Arbeit 3, neu 20“ */
  protected describe(segments: Segment[]): string {
    return segments.map((segment) => `${segment.label} ${segment.count}`).join(', ');
  }

  // ---------- Problemkarten ----------

  /** Am häufigsten vergessene Einheiten – oft hilft es, sie umzuformulieren oder aufzuteilen */
  protected readonly problems = computed(() => {
    const progress = this.learning.progressData();
    return this.library
      .items()
      .map((item) => ({ item, state: progress[item.id] }))
      .filter(({ state }) => (state?.lapses ?? 0) > 0)
      .sort((a, b) => b.state!.lapses - a.state!.lapses || a.state!.ease - b.state!.ease)
      .slice(0, PROBLEM_COUNT)
      .map(({ item, state }) => {
        const chapter = this.library.chapter(item.chapterId);
        return {
          item,
          lapses: state!.lapses,
          text: item.kind === 'flashcard' ? item.front : item.question,
          link: ['/fach', chapter?.subjectId, 'kapitel', item.chapterId, 'eintrag', item.id],
        };
      });
  });
}

/** Teilt Einheiten nach Lernstand auf, in fester Reihenfolge von „gefestigt“ bis „neu“ */
function toSegments(items: StudyItem[], progress: Record<string, CardState>): Segment[] {
  const counts = countByMaturity(items.map((item) => progress[item.id]));
  return MATURITY_ORDER.map((maturity) => ({
    maturity,
    label: MATURITY_LABELS[maturity],
    count: counts[maturity],
    percent: items.length > 0 ? (counts[maturity] / items.length) * 100 : 0,
  }));
}
