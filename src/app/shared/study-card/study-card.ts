import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { studyQueryParams } from '../../app.links';
import { StudyOverview } from '../../core/learning/learning-store';
import { StudyScope } from '../../core/models';
import { Figure, KeyFigures } from '../key-figures/key-figures';

/**
 * Karte mit den Kennzahlen eines Lernumfangs (fällig / neue Karten / Quizfragen)
 * und dem Button, der die passende Lernrunde startet.
 */
@Component({
  selector: 'app-study-card',
  imports: [RouterLink, KeyFigures],
  template: `
    <section class="card">
      <h2>{{ heading() }}</h2>
      <app-key-figures class="figures" [figures]="figures()" />
      @if (pending() > 0) {
        <!-- [queryParams] hängt ?fach=…&kapitel=… an die Adresse an -->
        <a class="btn btn-primary btn-block" routerLink="/lernen" [queryParams]="queryParams()">
          {{ startLabel() }}
        </a>
      } @else {
        <button class="btn btn-block" disabled>
          {{ overview().total === 0 ? 'Noch keine Lerneinheiten' : 'Für heute alles erledigt' }}
        </button>
      }
    </section>
  `,
  styles: `
    h2 {
      font-size: 18px;
    }
    .figures {
      display: block;
      margin: 14px 0 18px;
    }
  `,
})
export class StudyCard {
  readonly heading = input.required<string>();
  readonly overview = input.required<StudyOverview>();
  /** Welche Einheiten die Lernrunde enthält: alles, ein Fach oder ein Kapitel */
  readonly scope = input<StudyScope>({});
  readonly startLabel = input('Lernen starten');

  protected readonly figures = computed<Figure[]>(() => {
    const { due, newFlashcards, newQuestions } = this.overview();
    return [
      { label: 'fällig', value: due },
      { label: 'neue Karten', value: newFlashcards },
      { label: 'Quizfragen', value: newQuestions },
    ];
  });

  /** Wie viele Einheiten die Runde jetzt hätte */
  protected readonly pending = computed(() => {
    const overview = this.overview();
    return overview.due + overview.newFlashcards + overview.newQuestions;
  });

  protected readonly queryParams = computed(() => studyQueryParams(this.scope()));
}
