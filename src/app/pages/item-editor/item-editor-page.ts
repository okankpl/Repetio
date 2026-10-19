import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  ElementRef,
  OnInit,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { createId } from '../../core/id';
import { LibraryStore } from '../../core/library/library-store';
import { StudyItem, StudyKind } from '../../core/models';
import { notBlank } from '../../shared/validators';
import { injectLeavePage } from '../../shared/leave-page';
import { PageHeader } from '../../shared/page-header/page-header';

/**
 * Anlegen und Bearbeiten einer Karteikarte oder Quizfrage.
 * Neu:        /fach/:subjectId/kapitel/:chapterId/neu/:kind   (kind = karteikarte | quiz)
 * Bearbeiten: /fach/:subjectId/kapitel/:chapterId/eintrag/:itemId
 */
@Component({
  selector: 'app-item-editor-page',
  imports: [ReactiveFormsModule, NgTemplateOutlet, PageHeader],
  templateUrl: './item-editor-page.html',
  styleUrl: './item-editor-page.css',
})
export class ItemEditorPage implements OnInit {
  private readonly library = inject(LibraryStore);
  private readonly leavePage = injectLeavePage();
  /** FormBuilder erzeugt Formulare kurz und typsicher; "NonNullable" = Felder werden nie null */
  private readonly formBuilder = inject(NonNullableFormBuilder);

  readonly subjectId = input.required<string>();
  readonly chapterId = input.required<string>();
  readonly kind = input<string>();
  readonly itemId = input<string>();

  /** Der vorhandene Eintrag beim Bearbeiten; undefined beim Anlegen */
  protected readonly existing = computed(() => {
    const id = this.itemId();
    return id ? this.library.item(id) : undefined;
  });
  protected readonly itemKind = computed<StudyKind>(
    () => this.existing()?.kind ?? (this.kind() === 'quiz' ? 'choice' : 'flashcard'),
  );
  protected readonly notFound = computed(() => !!this.itemId() && !this.existing());
  protected readonly chapter = computed(() => this.library.chapter(this.chapterId()));
  protected readonly backLink = computed(() => [
    '/fach',
    this.subjectId(),
    'kapitel',
    this.chapterId(),
  ]);
  protected readonly title = computed(() => {
    const what = this.itemKind() === 'flashcard' ? 'Karteikarte' : 'Quizfrage';
    return this.existing() ? `${what} bearbeiten` : `Neue ${what}`;
  });

  /** Erstes Feld des Formulars, um nach „Speichern & nächste“ dorthin zu springen */
  private readonly firstField = viewChild<ElementRef<HTMLTextAreaElement>>('firstField');
  /** Wie viele Einträge in diesem Durchgang schon mit „Speichern & nächste“ angelegt wurden */
  protected readonly savedCount = signal(0);

  protected readonly cardForm = this.formBuilder.group({
    front: ['', notBlank],
    back: ['', notBlank],
  });

  protected readonly quizForm = this.formBuilder.group({
    question: ['', notBlank],
    correct: ['', notBlank],
    wrong1: ['', notBlank],
    wrong2: [''],
    wrong3: [''],
    explanation: [''],
  });

  ngOnInit(): void {
    // Beim Bearbeiten die Felder mit dem vorhandenen Eintrag füllen
    const item = this.existing();
    if (item?.kind === 'flashcard') {
      this.cardForm.setValue({ front: item.front, back: item.back });
    } else if (item?.kind === 'choice') {
      const [wrong1 = '', wrong2 = '', wrong3 = ''] = item.wrong;
      this.quizForm.setValue({
        question: item.question,
        correct: item.correct,
        wrong1,
        wrong2,
        wrong3,
        explanation: item.explanation,
      });
    }
  }

  /**
   * Speichert den Eintrag. Mit `addAnother` bleibt die Seite offen und leert das Formular –
   * so lassen sich viele Einträge hintereinander anlegen.
   */
  protected save(addAnother = false): void {
    const form = this.itemKind() === 'flashcard' ? this.cardForm : this.quizForm;
    if (form.invalid) {
      form.markAllAsTouched(); // zeigt die Fehlermeldungen aller leeren Pflichtfelder
      return;
    }
    this.library.saveItem(this.buildItem());

    if (addAnother) {
      form.reset(); // setzt Werte und den Zustand "angefasst" zurück
      this.savedCount.update((n) => n + 1);
      this.firstField()?.nativeElement.focus();
    } else {
      this.leavePage(this.backLink());
    }
  }

  protected delete(): void {
    const item = this.existing();
    if (!item || !confirm('Diesen Eintrag löschen?')) return;
    this.library.deleteItem(item.id);
    this.leavePage(this.backLink());
  }

  /** Ob ein Feld eine Fehlermeldung zeigen soll: leer und schon einmal angefasst */
  protected showError(control: { invalid: boolean; touched: boolean }): boolean {
    return control.invalid && control.touched;
  }

  private buildItem(): StudyItem {
    // Beim Bearbeiten bleibt die id gleich – damit bleibt auch der Lernfortschritt erhalten
    const id = this.existing()?.id ?? createId();
    const chapterId = this.chapterId();

    if (this.itemKind() === 'flashcard') {
      const { front, back } = this.cardForm.getRawValue();
      return { kind: 'flashcard', id, chapterId, front: front.trim(), back: back.trim() };
    }

    const { question, correct, wrong1, wrong2, wrong3, explanation } = this.quizForm.getRawValue();
    return {
      kind: 'choice',
      id,
      chapterId,
      question: question.trim(),
      correct: correct.trim(),
      wrong: [wrong1, wrong2, wrong3].map((text) => text.trim()).filter(Boolean),
      explanation: explanation.trim(),
    };
  }
}
