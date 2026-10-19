import {
  Component,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { LearningStore } from '../../core/learning/learning-store';
import { itemLink } from '../../app.links';
import { LibraryStore } from '../../core/library/library-store';
import { StudyItem, itemTitle } from '../../core/models';
import { ItemRow, statusTone } from '../../shared/item-row/item-row';
import { PageHeader } from '../../shared/page-header/page-header';

/** Mehr Treffer würden die Liste unübersichtlich machen – dann lieber genauer suchen */
const MAX_RESULTS = 50;

/** Durchsucht alle Karteikarten und Quizfragen aller Fächer. */
@Component({
  selector: 'app-search-page',
  imports: [PageHeader, ItemRow],
  templateUrl: './search-page.html',
  styleUrl: './search-page.css',
})
export class SearchPage {
  private readonly library = inject(LibraryStore);
  private readonly learning = inject(LearningStore);
  private readonly field = viewChild.required<ElementRef<HTMLInputElement>>('field');

  protected readonly query = signal('');

  /** Suchtext je Einheit – einmal vorbereitet statt bei jedem Tastendruck für jede Einheit neu */
  private readonly index = computed(() =>
    this.library.items().map((item) => ({ item, text: searchableText(item) })),
  );

  /** Alle Treffer, die jedes eingegebene Wort enthalten (Groß-/Kleinschreibung egal) */
  private readonly matches = computed(() => {
    const words = normalize(this.query()).split(/\s+/).filter(Boolean);
    if (words.length === 0) return [];
    return this.index()
      .filter(({ text }) => words.every((word) => text.includes(word)))
      .map(({ item }) => item);
  });

  protected readonly total = computed(() => this.matches().length);

  /** Die ersten Treffer mit Anzeigetext, Herkunft und Lernstatus */
  protected readonly results = computed(() =>
    this.matches()
      .slice(0, MAX_RESULTS)
      .map((item) => {
        const status = this.learning.dueLabel(item);
        const kind = item.kind === 'flashcard' ? 'Karteikarte' : 'Quiz';
        return {
          id: item.id,
          text: itemTitle(item),
          detail: `${kind} · ${this.library.contextOf(item)}`,
          link: itemLink(this.library.subjectIdOf(item) ?? '', item.chapterId, item.id),
          status,
          tone: statusTone(status),
        };
      }),
  );

  constructor() {
    afterNextRender(() => this.field().nativeElement.focus());
  }
}

/** Alle Texte einer Einheit in einem kleingeschriebenen String */
function searchableText(item: StudyItem): string {
  const parts =
    item.kind === 'flashcard'
      ? [item.front, item.back]
      : [item.question, item.correct, ...item.wrong, item.explanation];
  return normalize(parts.join(' '));
}

function normalize(text: string): string {
  return text.toLocaleLowerCase('de-DE');
}
