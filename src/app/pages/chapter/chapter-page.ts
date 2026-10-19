import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LearningStore } from '../../core/learning/learning-store';
import { itemLink, subjectLink } from '../../app.links';
import { LibraryStore } from '../../core/library/library-store';
import { itemTitle } from '../../core/models';
import { ItemRow, statusTone } from '../../shared/item-row/item-row';
import { NameForm } from '../../shared/name-form/name-form';
import { injectLeavePage } from '../../shared/leave-page';
import { PageHeader } from '../../shared/page-header/page-header';
import { StudyCard } from '../../shared/study-card/study-card';

/** Ein Kapitel: Kennzahlen, alle Karteikarten und Quizfragen, umbenennen und löschen. */
@Component({
  selector: 'app-chapter-page',
  imports: [RouterLink, PageHeader, StudyCard, NameForm, ItemRow],
  templateUrl: './chapter-page.html',
  styleUrl: './chapter-page.css',
})
export class ChapterPage {
  private readonly library = inject(LibraryStore);
  private readonly learning = inject(LearningStore);
  private readonly leavePage = injectLeavePage();

  /** Beide kommen aus der Adresse /fach/:subjectId/kapitel/:chapterId */
  readonly subjectId = input.required<string>();
  readonly chapterId = input.required<string>();

  protected readonly subject = computed(() => this.library.subject(this.subjectId()));
  protected readonly chapter = computed(() => this.library.chapter(this.chapterId()));
  protected readonly backLink = computed(() => subjectLink(this.subjectId()));
  protected readonly nr = computed(
    () => this.library.chaptersOf(this.subjectId()).findIndex((c) => c.id === this.chapterId()) + 1,
  );
  protected readonly scope = computed(() => ({
    subjectId: this.subjectId(),
    chapterId: this.chapterId(),
  }));
  protected readonly overview = computed(() => this.learning.overview(this.scope()));

  /** Alle Einträge des Kapitels mit Anzeigetext und Status ("neu", "fällig", "in 5 T") */
  private readonly entries = computed(() => {
    const now = Date.now();
    return this.library.itemsIn({ chapterId: this.chapterId() }).map((item) => {
      const status = this.learning.dueLabel(item, now);
      return {
        id: item.id,
        kind: item.kind,
        text: itemTitle(item),
        link: itemLink(this.subjectId(), this.chapterId(), item.id),
        status,
        tone: statusTone(status),
      };
    });
  });
  /** Je ein Abschnitt für Karteikarten und Quizfragen – im Template gleich aufgebaut */
  protected readonly sections = computed(() => [
    {
      title: 'Karteikarten',
      newPath: 'karteikarte',
      empty: 'Noch keine Karteikarten.',
      entries: this.entries().filter((entry) => entry.kind === 'flashcard'),
    },
    {
      title: 'Quizfragen',
      newPath: 'quiz',
      empty: 'Noch keine Quizfragen.',
      entries: this.entries().filter((entry) => entry.kind === 'choice'),
    },
  ]);

  protected readonly renaming = signal(false);

  protected rename(title: string): void {
    this.library.renameChapter(this.chapterId(), title);
    this.renaming.set(false);
  }

  protected delete(): void {
    const chapter = this.chapter();
    if (!chapter) return;
    const count = this.entries().length;
    if (!confirm(`Kapitel „${chapter.title}“ mit ${count} Einträgen löschen?`)) return;
    this.library.deleteChapter(chapter.id);
    this.leavePage(subjectLink(this.subjectId()));
  }
}
