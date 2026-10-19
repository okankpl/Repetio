import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MAX_TIME_PER_REVIEW_MS } from '../../core/learning/activity';
import { LearningStore } from '../../core/learning/learning-store';
import { formatDuration } from '../../core/learning/statistics';
import { LibraryStore } from '../../core/library/library-store';
import { StudyItem, StudyScope } from '../../core/models';
import { Settings } from '../../core/settings';
import { RATING, Rating } from '../../core/learning/srs';
import { injectLeavePage } from '../../shared/leave-page';
import { ProgressBar } from '../../shared/progress-bar/progress-bar';
import { ChoiceView } from './choice-view/choice-view';
import { FlashcardView } from './flashcard-view/flashcard-view';

/** So viele neue Einheiten je Fach und Art kommen mit „Weitere neue lernen“ dazu */
const EXTRA_NEW = 10;

/** Zustand der Runde vor einer Bewertung – damit „Rückgängig“ ihn wiederherstellen kann */
interface Step {
  undo: () => void;
  queue: StudyItem[];
  completed: number;
  right: number;
  wrong: number;
  timeMs: number;
}

/**
 * Eine Lernrunde unter /lernen, optional eingeschränkt mit ?fach=…&kapitel=….
 * Zeigt die Einheiten nacheinander, speichert jede Bewertung und am Ende eine Zusammenfassung.
 */
@Component({
  selector: 'app-session-page',
  imports: [RouterLink, ProgressBar, FlashcardView, ChoiceView],
  templateUrl: './session-page.html',
  styleUrl: './session-page.css',
  // "z" nimmt die letzte Bewertung zurück (außer beim Tippen in einem Textfeld)
  host: { '(document:keydown)': 'onKeydown($event)' },
})
export class SessionPage implements OnInit {
  private readonly library = inject(LibraryStore);
  private readonly learning = inject(LearningStore);
  private readonly route = inject(ActivatedRoute);
  private readonly leavePage = injectLeavePage();
  protected readonly settings = inject(Settings);

  /** Umfang der Runde aus der Adresse */
  private scope: StudyScope = {};
  /** Wohin "Beenden" führt, wenn es keine vorige Seite gibt: Kapitel, Fach oder Startseite */
  private backLink: unknown[] = ['/'];
  /** Seit wann die aktuelle Einheit angezeigt wird – für die Lernzeit */
  private shownAt = Date.now();

  /** Warteschlange der Runde; wird einmal beim Start zusammengestellt */
  protected readonly queue = signal<StudyItem[]>([]);
  /** Ob die Runde beim Start überhaupt Einheiten hatte */
  protected readonly hadItems = signal(false);
  /** Die gerade angezeigte Einheit (undefined = Runde vorbei) */
  protected readonly current = computed(() => this.queue()[0]);
  /** Wie viele Einheiten die Runde endgültig verlassen haben */
  protected readonly completed = signal(0);
  protected readonly total = computed(() => this.completed() + this.queue().length);
  protected readonly right = signal(0);
  protected readonly wrong = signal(0);
  /** Lernzeit dieser Runde in ms */
  protected readonly timeMs = signal(0);
  /** Bisherige Bewertungen, neueste zuletzt – für „Rückgängig“ */
  private readonly steps = signal<Step[]>([]);
  protected readonly canUndo = computed(() => this.steps().length > 0);

  protected readonly accuracy = computed(() => {
    const answers = this.right() + this.wrong();
    return answers > 0 ? Math.round((this.right() / answers) * 100) : 0;
  });
  protected readonly duration = computed(() => formatDuration(this.timeMs()));
  /** Noch nie gelernte Einheiten im Umfang, die das Tageslimit gerade zurückhält */
  protected readonly unseen = computed(() => this.learning.overview(this.scope).unseen);

  protected readonly intervals = computed(() => {
    const item = this.current();
    return item ? this.learning.nextIntervals(item) : { again: '', good: '' };
  });

  /** Herkunft der aktuellen Einheit, z. B. "Mathematik · Kapitel Analysis" */
  protected readonly context = computed(() => {
    const item = this.current();
    const chapter = item && this.library.chapter(item.chapterId);
    const subject = chapter && this.library.subject(chapter.subjectId);
    return [subject?.name, chapter?.title].filter(Boolean).join(' · ');
  });

  ngOnInit(): void {
    // snapshot: die Werte beim Öffnen der Seite – die Runde wird bewusst nur einmal zusammengestellt
    const params = this.route.snapshot.queryParamMap;
    this.scope = {
      subjectId: params.get('fach') ?? undefined,
      chapterId: params.get('kapitel') ?? undefined,
    };
    this.backLink = backLinkFor(this.scope);
    this.start();
  }

  /** Stellt die Runde zusammen; `extraNew` erlaubt neue Einheiten über das Tageslimit hinaus */
  protected start(extraNew = 0): void {
    const items = this.learning.buildQueue(this.scope, extraNew);
    this.queue.set(items);
    this.hadItems.set(items.length > 0);
    this.completed.set(0);
    this.right.set(0);
    this.wrong.set(0);
    this.timeMs.set(0);
    this.steps.set([]);
    this.shownAt = Date.now();
  }

  protected learnMore(): void {
    this.start(EXTRA_NEW);
  }

  /** Zurück zur Ausgangsseite (siehe injectLeavePage) */
  protected leave(): void {
    this.leavePage(this.backLink);
  }

  protected rate(rating: Rating): void {
    const item = this.current();
    if (!item) return;

    const now = Date.now();
    const timeMs = now - this.shownAt;
    this.shownAt = now;

    const { state, undo } = this.learning.rate(item, rating, timeMs);
    this.steps.update((steps) => [
      ...steps,
      {
        undo,
        queue: this.queue(),
        completed: this.completed(),
        right: this.right(),
        wrong: this.wrong(),
        timeMs: this.timeMs(),
      },
    ]);
    (rating === RATING.GOOD ? this.right : this.wrong).update((n) => n + 1);
    this.timeMs.update((total) => total + Math.min(timeMs, MAX_TIME_PER_REVIEW_MS));

    const rest = this.queue().slice(1);
    if (state.interval === 0) {
      // Falsch beantwortet: kommt am Ende dieser Runde noch einmal
      this.queue.set([...rest, item]);
    } else {
      this.queue.set(rest);
      this.completed.update((n) => n + 1);
    }
  }

  /** Nimmt die letzte Bewertung zurück und zeigt die Einheit erneut */
  protected undo(): void {
    const step = this.steps().at(-1);
    if (!step) return;
    step.undo();
    this.steps.update((steps) => steps.slice(0, -1));
    this.queue.set(step.queue);
    this.completed.set(step.completed);
    this.right.set(step.right);
    this.wrong.set(step.wrong);
    this.timeMs.set(step.timeMs);
    this.shownAt = Date.now();
  }

  protected onKeydown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    const typing = target.tagName === 'TEXTAREA' || target.tagName === 'INPUT';
    if (!typing && event.key.toLowerCase() === 'z' && !event.ctrlKey && !event.metaKey) {
      this.undo();
    }
  }
}

function backLinkFor({ subjectId, chapterId }: StudyScope): unknown[] {
  if (subjectId && chapterId) return ['/fach', subjectId, 'kapitel', chapterId];
  if (subjectId) return ['/fach', subjectId];
  return ['/'];
}
