import { Component, computed, inject, signal } from '@angular/core';
import { itemLink } from '../../app.links';
import { Clock } from '../../core/clock';
import { addDays, dayKey } from '../../core/dates';
import { EMPTY_DAY } from '../../core/learning/activity';
import { LearningStore } from '../../core/learning/learning-store';
import { CardState } from '../../core/learning/srs';
import {
  accuracy,
  activityHistory,
  currentStreak,
  dueForecast,
  formatDuration,
  maturityShares,
  sumDays,
} from '../../core/learning/statistics';
import { LibraryStore } from '../../core/library/library-store';
import { itemTitle } from '../../core/models';
import { Bar, BarChart } from '../../shared/bar-chart/bar-chart';
import { ItemRow } from '../../shared/item-row/item-row';
import { Figure, KeyFigures } from '../../shared/key-figures/key-figures';
import { PageHeader } from '../../shared/page-header/page-header';
import { SegmentOption, SegmentedControl } from '../../shared/segmented-control/segmented-control';
import { MaturityOverview, MaturityRow } from './maturity-overview/maturity-overview';

/** Wählbare Zeiträume für Verlauf und Kennzahlen, in Tagen */
const RANGES: SegmentOption<number>[] = [
  { value: 14, label: '14 Tage' },
  { value: 30, label: '30 Tage' },
];
/** So weit reicht die Prognose in die Zukunft */
const FORECAST_DAYS = 14;
/** So viele Problemkarten werden gezeigt */
const PROBLEM_COUNT = 5;

const shortDate = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'numeric' });
const longDate = new Intl.DateTimeFormat('de-DE', {
  weekday: 'short',
  day: 'numeric',
  month: 'numeric',
});

/**
 * Statistik: Kennzahlen, Verlauf der letzten Tage, Prognose, Lernstand je Fach und Problemkarten.
 * Die Zahlen berechnen die reinen Funktionen aus core/learning/statistics.ts;
 * diese Seite bereitet sie nur für die Anzeige-Bausteine auf.
 */
@Component({
  selector: 'app-statistics-page',
  imports: [PageHeader, KeyFigures, SegmentedControl, BarChart, MaturityOverview, ItemRow],
  templateUrl: './statistics-page.html',
  styleUrl: './statistics-page.css',
})
export class StatisticsPage {
  private readonly library = inject(LibraryStore);
  private readonly learning = inject(LearningStore);
  private readonly clock = inject(Clock);

  protected readonly ranges = RANGES;
  /** Gewählter Zeitraum in Tagen; der Umschalter ändert ihn über [(value)] */
  protected readonly range = signal(14);

  private readonly log = this.learning.activityData;
  protected readonly hasActivity = computed(() => Object.keys(this.log()).length > 0);

  // ---------- Kennzahlen ----------

  /** Tage im gewählten Zeitraum, älteste zuerst */
  private readonly history = computed(() =>
    activityHistory(this.log(), this.range(), this.clock.now()),
  );
  /** Summe des gewählten Zeitraums */
  private readonly period = computed(() => sumDays(this.history()));

  protected readonly figures = computed<Figure[]>(() => {
    const now = this.clock.now();
    const rate = accuracy(this.period());
    return [
      { label: 'Tage in Folge', value: currentStreak(this.log(), now) },
      { label: 'Antworten heute', value: (this.log()[dayKey(now)] ?? EMPTY_DAY).reviews },
      { label: `richtig (${this.range()} Tage)`, value: rate === null ? '–' : `${rate} %` },
      { label: `Lernzeit (${this.range()} Tage)`, value: formatDuration(this.period().timeMs) },
    ];
  });

  // ---------- Verlauf ----------

  protected readonly historyBars = computed<Bar[]>(() =>
    this.history().map((day) => {
      const rate = accuracy(day);
      const details = rate === null ? '' : `, ${rate} % richtig, ${formatDuration(day.timeMs)}`;
      return {
        label: shortDate.format(day.date),
        value: day.reviews,
        description: `${longDate.format(day.date)}: ${day.reviews} Antworten${details}`,
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

  protected readonly maturityTotal = computed(() => {
    const progress = this.learning.progressData();
    return maturityShares(this.library.items().map((item) => progress[item.id]));
  });

  protected readonly maturityRows = computed<MaturityRow[]>(() => {
    const progress = this.learning.progressData();
    return this.library.subjects().map((subject) => ({
      id: subject.id,
      name: subject.name,
      shares: maturityShares(
        this.library.itemsIn({ subjectId: subject.id }).map((item) => progress[item.id]),
      ),
    }));
  });

  // ---------- Problemkarten ----------

  /** Am häufigsten vergessene Einheiten – oft hilft es, sie umzuformulieren oder aufzuteilen */
  protected readonly problems = computed(() => {
    const progress = this.learning.progressData();
    return (
      this.library
        .items()
        // flatMap mit [] bzw. [Eintrag]: filtert und behält zugleich den Lernstand zur Einheit
        .flatMap((item) => {
          const state = progress[item.id];
          return state && state.lapses > 0 ? [{ item, state }] : [];
        })
        .sort((a, b) => b.state.lapses - a.state.lapses || a.state.ease - b.state.ease)
        .slice(0, PROBLEM_COUNT)
        .map(({ item, state }) => ({
          id: item.id,
          text: itemTitle(item),
          lapses: `${state.lapses}×`,
          link: itemLink(this.library.subjectIdOf(item) ?? '', item.chapterId, item.id),
        }))
    );
  });
}
