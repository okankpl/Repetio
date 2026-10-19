import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { LibraryStore } from '../../core/library/library-store';
import { parseItemsFromText } from '../../core/library/text-import';
import { StudyKind } from '../../core/models';
import { chapterLink } from '../../app.links';
import { FileButton } from '../../shared/file-button/file-button';
import { injectLeavePage } from '../../shared/leave-page';
import { PageHeader } from '../../shared/page-header/page-header';
import { SegmentOption, SegmentedControl } from '../../shared/segmented-control/segmented-control';

/** So viele erkannte Einträge zeigt die Vorschau */
const PREVIEW_SIZE = 5;

/**
 * Massenimport: Karteikarten oder Quizfragen aus Text, eine Zeile pro Eintrag.
 * Adresse: /fach/:subjectId/kapitel/:chapterId/import?art=karteikarte|quiz
 */
@Component({
  selector: 'app-text-import-page',
  imports: [PageHeader, SegmentedControl, FileButton],
  templateUrl: './text-import-page.html',
  styleUrl: './text-import-page.css',
})
export class TextImportPage {
  private readonly library = inject(LibraryStore);
  private readonly leavePage = injectLeavePage();

  readonly subjectId = input.required<string>();
  readonly chapterId = input.required<string>();
  /** Aus dem Query-Parameter ?art=… – withComponentInputBinding liefert auch diese als input */
  readonly art = input<string>();

  protected readonly chapter = computed(() => this.library.chapter(this.chapterId()));
  protected readonly backLink = computed(() => chapterLink(this.subjectId(), this.chapterId()));

  protected readonly kinds: SegmentOption<StudyKind>[] = [
    { value: 'flashcard', label: 'Karteikarten' },
    { value: 'choice', label: 'Quizfragen' },
  ];

  /** Art der Einträge: startet mit dem Wert aus der Adresse, lässt sich auf der Seite umschalten */
  protected readonly kind = linkedSignal<StudyKind>(() =>
    this.art() === 'quiz' ? 'choice' : 'flashcard',
  );
  protected readonly text = signal('');

  /** Ergebnis der Erkennung – wird bei jeder Eingabe neu berechnet und als Vorschau gezeigt */
  protected readonly result = computed(() =>
    parseItemsFromText(this.text(), this.kind(), this.chapterId()),
  );
  protected readonly preview = computed(() => this.result().items.slice(0, PREVIEW_SIZE));
  protected readonly more = computed(() => this.result().items.length - PREVIEW_SIZE);

  protected readonly placeholder = computed(() =>
    this.kind() === 'flashcard'
      ? 'Hauptstadt von Spanien? ; Madrid\nWas ist Active Recall? ; Antworten selbst aus dem Gedächtnis abrufen'
      : 'Welche Farbe hat der Himmel? ; Blau ; Grün ; Rot ; Gelb ; Wegen der Lichtstreuung\n2 + 2 = ? ; 4 ; 3 ; 5',
  );

  /** Liest eine Textdatei (z. B. CSV oder einen Anki-Export) in das Textfeld ein */
  protected async loadFile(file: File): Promise<void> {
    this.text.set(await file.text());
  }

  protected import(): void {
    const { items } = this.result();
    if (items.length === 0) return;
    this.library.addItems(items);
    this.leavePage(this.backLink());
  }
}
