import {
  Component,
  ElementRef,
  afterRenderEffect,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NextIntervals } from '../../../core/learning/learning-store';
import { Flashcard } from '../../../core/models';
import { RATING, Rating } from '../../../core/learning/srs';

/**
 * Fragt eine Karteikarte ab: Antwort (optional) eintippen, aufdecken, selbst bewerten.
 * Die Komponente kennt keinen Lernfortschritt – sie meldet nur die Bewertung nach außen.
 */
@Component({
  selector: 'app-flashcard-view',
  templateUrl: './flashcard-view.html',
  styleUrl: './flashcard-view.css',
  // Tastatursteuerung: hört auf Tastendrücke im ganzen Dokument, solange die Karte angezeigt wird
  host: { '(document:keydown)': 'onKeydown($event)' },
})
export class FlashcardView {
  /** `input.required` erzwingt, dass die Elternkomponente eine Karte übergibt */
  readonly card = input.required<Flashcard>();
  /** Herkunft der Karte, z. B. "Fach · Kapitel" */
  readonly context = input('');
  readonly typeAnswer = input(true);
  readonly intervals = input.required<NextIntervals>();
  /** `output()` ist ein Ereignis, auf das die Elternkomponente mit (rated)="…" reagiert */
  readonly rated = output<Rating>();

  protected readonly RATING = RATING;
  /** Ob die Musterlösung schon aufgedeckt ist */
  protected readonly revealed = signal(false);
  /** Die eingetippte Antwort */
  protected readonly typed = signal('');
  /** `viewChild` liefert das Element mit #answerBox aus dem Template (oder undefined) */
  private readonly answerBox = viewChild<ElementRef<HTMLTextAreaElement>>('answerBox');

  constructor() {
    // Läuft nach dem Rendern: Bei jeder neuen Karte direkt ins Eingabefeld springen
    afterRenderEffect(() => {
      this.card();
      this.answerBox()?.nativeElement.focus();
    });
  }

  protected reveal(): void {
    this.revealed.set(true);
  }

  protected rate(rating: Rating): void {
    if (!this.revealed()) return;
    this.rated.emit(rating);
    // Für die nächste Karte zurücksetzen – auch falls dieselbe Karte direkt erneut drankommt
    this.revealed.set(false);
    this.typed.set('');
  }

  protected onKeydown(event: KeyboardEvent): void {
    const inTextarea = (event.target as HTMLElement).tagName === 'TEXTAREA';
    if (inTextarea) {
      // Enter deckt auf, Shift+Enter macht wie gewohnt eine neue Zeile
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        this.reveal();
      }
      return;
    }

    if ((event.key === ' ' || event.key === 'Enter') && !this.revealed()) {
      event.preventDefault();
      this.reveal();
    } else if (event.key === '1') {
      this.rate(RATING.AGAIN);
    } else if (event.key === '2') {
      this.rate(RATING.GOOD);
    }
  }
}
