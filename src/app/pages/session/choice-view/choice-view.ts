import { Component, computed, input, output, signal } from '@angular/core';
import { NextIntervals } from '../../../core/learning/learning-store';
import { ChoiceQuestion } from '../../../core/models';
import { shuffle } from '../../../core/shuffle';
import { RATING, Rating } from '../../../core/learning/srs';

interface Option {
  text: string;
  correct: boolean;
}

const LETTERS = ['A', 'B', 'C', 'D'];

/**
 * Fragt eine Quizfrage ab. Die App wertet selbst aus:
 * richtig → Bewertung "Gut", falsch → "Nochmal".
 */
@Component({
  selector: 'app-choice-view',
  templateUrl: './choice-view.html',
  styleUrl: './choice-view.css',
  host: { '(document:keydown)': 'onKeydown($event)' },
})
export class ChoiceView {
  readonly question = input.required<ChoiceQuestion>();
  /** Herkunft der Frage, z. B. "Fach · Kapitel" */
  readonly context = input('');
  readonly intervals = input.required<NextIntervals>();
  readonly rated = output<Rating>();

  protected readonly letters = LETTERS;

  /** Alle Antwortmöglichkeiten in zufälliger Reihenfolge – neu gemischt für jede Frage */
  protected readonly options = computed<Option[]>(() =>
    shuffle([
      { text: this.question().correct, correct: true },
      ...this.question().wrong.map((text) => ({ text, correct: false })),
    ]),
  );

  /** Position der gewählten Antwort; null, solange noch nicht geantwortet wurde */
  protected readonly selected = signal<number | null>(null);

  protected readonly answeredCorrectly = computed(() => {
    const index = this.selected();
    return index !== null && this.options()[index].correct;
  });

  protected choose(index: number): void {
    if (this.selected() === null) this.selected.set(index);
  }

  /** CSS-Klasse einer Antwort: vor dem Antworten neutral, danach richtig/falsch markiert */
  protected optionState(index: number): string {
    if (this.selected() === null) return '';
    if (this.options()[index].correct) return 'is-correct';
    return index === this.selected() ? 'is-wrong' : 'is-faded';
  }

  protected next(): void {
    if (this.selected() === null) return;
    this.rated.emit(this.answeredCorrectly() ? RATING.GOOD : RATING.AGAIN);
    this.selected.set(null);
  }

  protected onKeydown(event: KeyboardEvent): void {
    // Antwort per Taste 1–4 oder A–D wählen
    const byNumber = ['1', '2', '3', '4'].indexOf(event.key);
    const byLetter = LETTERS.indexOf(event.key.toUpperCase());
    const index = byNumber >= 0 ? byNumber : byLetter;

    if (index >= 0 && index < this.options().length) {
      this.choose(index);
    } else if ((event.key === 'Enter' || event.key === ' ') && this.selected() !== null) {
      event.preventDefault();
      this.next();
    }
  }
}
