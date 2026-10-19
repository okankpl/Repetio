import { Component, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { chapterLink } from '../../app.links';
import { DataSafety } from '../../core/data-safety';
import { LearningStore } from '../../core/learning/learning-store';
import { LibraryStore } from '../../core/library/library-store';
import { NameForm } from '../../shared/name-form/name-form';
import { injectLeavePage } from '../../shared/leave-page';
import { PageHeader } from '../../shared/page-header/page-header';
import { ProgressRow } from '../../shared/progress-row/progress-row';
import { StudyCard } from '../../shared/study-card/study-card';

/** Ein Fach: Kennzahlen, Kapitelliste, neues Kapitel, umbenennen und löschen. */
@Component({
  selector: 'app-subject-page',
  imports: [PageHeader, StudyCard, ProgressRow, NameForm],
  templateUrl: './subject-page.html',
})
export class SubjectPage {
  private readonly library = inject(LibraryStore);
  private readonly learning = inject(LearningStore);
  private readonly router = inject(Router);
  private readonly dataSafety = inject(DataSafety);
  private readonly leavePage = injectLeavePage();

  /** Kommt aus der Adresse /fach/:subjectId (über withComponentInputBinding in app.config.ts) */
  readonly subjectId = input.required<string>();

  protected readonly subject = computed(() => this.library.subject(this.subjectId()));
  protected readonly scope = computed(() => ({ subjectId: this.subjectId() }));
  protected readonly overview = computed(() => this.learning.overview(this.scope()));

  /** Kapitel in ihrer Reihenfolge, mit Nummer und Kennzahlen */
  protected readonly chapters = computed(() =>
    this.library.chaptersOf(this.subjectId()).map((chapter, index) => ({
      chapter,
      nr: index + 1,
      overview: this.learning.overview({ chapterId: chapter.id }),
    })),
  );

  /** Welches Formular gerade offen ist – es ist immer höchstens eins */
  protected readonly mode = signal<'idle' | 'add-chapter' | 'rename'>('idle');

  protected addChapter(title: string): void {
    const chapter = this.library.addChapter(this.subjectId(), title);
    // Direkt ins neue Kapitel, damit man gleich Karten anlegen kann
    this.router.navigate(chapterLink(this.subjectId(), chapter.id));
  }

  protected rename(name: string): void {
    this.library.renameSubject(this.subjectId(), name);
    this.mode.set('idle');
  }

  /** Bietet das Fach ohne Lernstand als Datei an – andere fügen es mit „Fach aus Datei“ hinzu */
  protected share(): void {
    void this.dataSafety.exportSubject(this.subjectId());
  }

  protected delete(): void {
    const subject = this.subject();
    if (!subject) return;
    if (!confirm(`Fach „${subject.name}“ mit allen Kapiteln und Karten löschen?`)) return;
    this.library.deleteSubject(subject.id);
    this.leavePage(['/']);
  }
}
