import { Injectable, inject } from '@angular/core';
import { Clock } from '../clock';
import { dayKey } from '../dates';
import { LibraryStore } from '../library/library-store';
import { StudyItem, StudyKind, StudyScope, isRecord } from '../models';
import { persistentSignal } from '../persistence/persistent-signal';
import { STORAGE_KEYS } from '../persistence/storage-keys';
import { Settings } from '../settings';
import { ActivityLog, isActivityLog, recordReview } from './activity';
import {
  CardState,
  RATING,
  Rating,
  createCardState,
  formatDue,
  formatInterval,
  scheduleCard,
} from './srs';

/** Wie viele neue Einheiten je Fach am Tag `date` schon begonnen wurden */
interface DailyCounts {
  date: string;
  perSubject: Record<string, Record<StudyKind, number>>;
}

function isDailyCounts(value: unknown): boolean {
  return isRecord(value) && typeof value['date'] === 'string' && isRecord(value['perSubject']);
}

export interface StudyOverview {
  due: number;
  newFlashcards: number;
  newQuestions: number;
  learned: number;
  /** Noch nie gelernte Einheiten, unabhängig vom Tageslimit */
  unseen: number;
  total: number;
}

/** Lesbare Zeitangaben, wann eine Einheit nach "falsch" bzw. "richtig" wiederkommt */
export interface NextIntervals {
  again: string;
  good: string;
}

/** Ergebnis einer Bewertung: der neue Lernzustand und eine Funktion, die sie zurücknimmt */
export interface RatingResult {
  state: CardState;
  undo: () => void;
}

const NO_COUNTS: Record<StudyKind, number> = { flashcard: 0, choice: 0 };

/**
 * Verwaltet den Lernfortschritt: was fällig ist, was neu dazukommt, Bewertungen speichern.
 * Die Inhalte selbst kommen aus dem LibraryStore.
 */
@Injectable({ providedIn: 'root' })
export class LearningStore {
  private readonly library = inject(LibraryStore);
  private readonly settings = inject(Settings);
  private readonly clock = inject(Clock);

  /** Lernzustand je Einheit (Schlüssel = id); neue Einheiten haben noch keinen Eintrag */
  private readonly progress = persistentSignal<Record<string, CardState>>(
    STORAGE_KEYS.progress,
    {},
    isRecord,
  );
  /** Tageszähler für neue Einheiten, damit das Tageslimit auch nach einem Neustart gilt */
  private readonly daily = persistentSignal<DailyCounts>(
    STORAGE_KEYS.daily,
    { date: '', perSubject: {} },
    isDailyCounts,
  );
  /** Lernprotokoll je Tag für die Statistik */
  private readonly activity = persistentSignal<ActivityLog>(
    STORAGE_KEYS.activity,
    {},
    isActivityLog,
  );

  /** Nur lesbare Sichten, z. B. für Export und Statistik */
  readonly progressData = this.progress.asReadonly();
  readonly activityData = this.activity.asReadonly();

  /** Kennzahlen für einen Umfang: fällig, heute neu, gelernt, gesamt */
  overview(scope: StudyScope): StudyOverview {
    const now = this.clock.now();
    const items = this.library.itemsIn(scope);
    const fresh = this.newItemsForToday(items);
    let due = 0;
    let learned = 0;
    let unseen = 0;
    for (const item of items) {
      const state = this.stateOf(item);
      if (!state) unseen++;
      else if (state.due <= now) due++;
      if (state && state.reps > 0) learned++;
    }
    return {
      due,
      newFlashcards: fresh.filter((item) => item.kind === 'flashcard').length,
      newQuestions: fresh.filter((item) => item.kind === 'choice').length,
      learned,
      unseen,
      total: items.length,
    };
  }

  /**
   * Stellt eine Lernrunde zusammen: erst fällige Wiederholungen, dann Neues.
   * `extraNew` erlaubt je Fach und Art so viele neue Einheiten zusätzlich zum Tageslimit.
   */
  buildQueue(scope: StudyScope, extraNew = 0): StudyItem[] {
    const now = this.clock.now();
    const items = this.library.itemsIn(scope);
    const due = items
      .filter((item) => this.isDue(item, now))
      .sort((a, b) => this.stateOf(a)!.due - this.stateOf(b)!.due);
    return [...due, ...this.newItemsForToday(items, extraNew)];
  }

  /**
   * Speichert eine Bewertung samt Lernzeit und gibt den neuen Lernzustand zurück.
   * Die mitgelieferte `undo`-Funktion stellt den Stand davor wieder her – auch Tageszähler und
   * Statistik. Weil Signals unveränderliche Werte halten, genügt es, die alten Werte aufzubewahren.
   */
  rate(item: StudyItem, rating: Rating, timeMs = 0): RatingResult {
    const previous = this.stateOf(item);
    const previousDaily = this.daily();
    const previousActivity = this.activity();
    const now = this.clock.now();

    if (!previous) this.countNewToday(item);
    const state = scheduleCard(previous ?? createCardState(), rating, now);
    this.progress.update((progress) => ({ ...progress, [item.id]: state }));
    this.activity.update((log) =>
      recordReview(log, dayKey(now), {
        correct: rating !== RATING.AGAIN,
        isNew: !previous,
        timeMs,
      }),
    );

    const undo = () => {
      this.progress.update((progress) => {
        const restored = { ...progress };
        if (previous) restored[item.id] = previous;
        else delete restored[item.id]; // war vorher neu, hatte also keinen Lernstand
        return restored;
      });
      this.daily.set(previousDaily);
      this.activity.set(previousActivity);
    };
    return { state, undo };
  }

  nextIntervals(item: StudyItem): NextIntervals {
    const state = this.stateOf(item) ?? createCardState();
    const now = Date.now();
    return {
      again: formatInterval(scheduleCard(state, RATING.AGAIN, now), now),
      good: formatInterval(scheduleCard(state, RATING.GOOD, now), now),
    };
  }

  /** Kurzer Status für Listen: "neu", "fällig", "morgen", "in 5 T" */
  dueLabel(item: StudyItem, now = this.clock.now()): string {
    const state = this.stateOf(item);
    return state ? formatDue(state, now) : 'neu';
  }

  stateOf(item: StudyItem): CardState | undefined {
    return this.progress()[item.id];
  }

  /** Ersetzt Lernstand und Statistik, z. B. beim Import einer Sicherung. */
  replaceProgress(progress: Record<string, CardState>, activity: ActivityLog = {}): void {
    this.progress.set(progress);
    this.activity.set(activity);
    this.daily.set({ date: '', perSubject: {} });
  }

  /** Löscht Lernstand und Statistik; die Inhalte bleiben erhalten. */
  resetProgress(): void {
    this.replaceProgress({});
  }

  private isDue(item: StudyItem, now: number): boolean {
    const state = this.stateOf(item);
    return !!state && state.due <= now;
  }

  /**
   * Noch nie gelernte Einheiten, die heute dran sind: je Fach und Art höchstens so viele,
   * wie das Tageslimit noch erlaubt; Karteikarten und Quizfragen im Wechsel.
   */
  private newItemsForToday(items: StudyItem[], extraNew = 0): StudyItem[] {
    const bySubject = new Map<string, StudyItem[]>();
    for (const item of items) {
      if (this.stateOf(item)) continue;
      const subjectId = this.library.subjectIdOf(item) ?? '';
      const fresh = bySubject.get(subjectId);
      if (fresh) fresh.push(item);
      else bySubject.set(subjectId, [item]);
    }

    return [...bySubject].flatMap(([subjectId, fresh]) => {
      const left = (kind: StudyKind) => this.newLeft(subjectId, kind) + extraNew;
      // <StudyItem>: beide Listen gelten als StudyItem[], obwohl filter sie genauer typisiert
      return alternate<StudyItem>(
        fresh.filter((item) => item.kind === 'flashcard').slice(0, left('flashcard')),
        fresh.filter((item) => item.kind === 'choice').slice(0, left('choice')),
      );
    });
  }

  private newLeft(subjectId: string, kind: StudyKind): number {
    const { newFlashcardsPerDay, newQuestionsPerDay } = this.settings.current();
    const limit = kind === 'flashcard' ? newFlashcardsPerDay : newQuestionsPerDay;
    return Math.max(0, limit - this.countsToday(subjectId)[kind]);
  }

  /** Zähler aller Fächer von heute; Zähler von gestern gelten als leer */
  private countsOfToday(): DailyCounts['perSubject'] {
    const daily = this.daily();
    return daily.date === dayKey(this.clock.now()) ? daily.perSubject : {};
  }

  private countsToday(subjectId: string): Record<StudyKind, number> {
    return this.countsOfToday()[subjectId] ?? NO_COUNTS;
  }

  private countNewToday(item: StudyItem): void {
    const subjectId = this.library.subjectIdOf(item) ?? '';
    const counts = this.countsToday(subjectId);
    this.daily.set({
      date: dayKey(this.clock.now()),
      perSubject: {
        ...this.countsOfToday(),
        [subjectId]: { ...counts, [item.kind]: counts[item.kind] + 1 },
      },
    });
  }
}

/** Mischt zwei Listen im Wechsel: a1, b1, a2, b2, … – Reste werden angehängt. */
function alternate<T>(a: T[], b: T[]): T[] {
  const result: T[] = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (i < a.length) result.push(a[i]);
    if (i < b.length) result.push(b[i]);
  }
  return result;
}
