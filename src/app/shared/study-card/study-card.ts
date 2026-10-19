import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StudyOverview } from '../../core/learning/learning-store';
import { StudyScope } from '../../core/models';

/**
 * Karte mit den Kennzahlen eines Lernumfangs (fällig / neue Karten / Quizfragen)
 * und dem Button, der die passende Lernrunde startet.
 */
@Component({
  selector: 'app-study-card',
  imports: [RouterLink],
  template: `
    <section class="card">
      <h2>{{ heading() }}</h2>
      <dl class="stats">
        <div>
          <dt>fällig</dt>
          <dd>{{ overview().due }}</dd>
        </div>
        <div>
          <dt>neue Karten</dt>
          <dd>{{ overview().newFlashcards }}</dd>
        </div>
        <div>
          <dt>Quizfragen</dt>
          <dd>{{ overview().newQuestions }}</dd>
        </div>
      </dl>
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
    .stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin: 14px 0 18px;
    }
    .stats div {
      display: flex;
      flex-direction: column-reverse; /* Zahl oben, Beschriftung darunter */
      align-items: center;
      padding: 10px 4px;
      background: var(--surface-muted);
      border-radius: var(--radius-sm);
    }
    dd {
      margin: 0;
      font-size: 26px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
    dt {
      font-size: 13px;
      color: var(--muted);
      text-align: center;
    }
  `,
})
export class StudyCard {
  readonly heading = input.required<string>();
  readonly overview = input.required<StudyOverview>();
  /** Welche Einheiten die Lernrunde enthält: alles, ein Fach oder ein Kapitel */
  readonly scope = input<StudyScope>({});
  readonly startLabel = input('Lernen starten');

  /** Wie viele Einheiten die Runde jetzt hätte */
  protected readonly pending = computed(() => {
    const overview = this.overview();
    return overview.due + overview.newFlashcards + overview.newQuestions;
  });

  /** Nur gesetzte Werte übernehmen, damit die Adresse kein "?fach=undefined" enthält */
  protected readonly queryParams = computed(() => {
    const { subjectId, chapterId } = this.scope();
    return { ...(subjectId && { fach: subjectId }), ...(chapterId && { kapitel: chapterId }) };
  });
}
