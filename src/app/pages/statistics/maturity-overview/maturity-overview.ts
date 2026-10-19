import { Component, input } from '@angular/core';
import { MaturityShare } from '../../../core/learning/statistics';

/** Eine Zeile im Diagramm: ein Fach und seine Lernstände */
export interface MaturityRow {
  id: string;
  name: string;
  shares: MaturityShare[];
}

/**
 * Lernstand je Fach als gestapelte Balken (neu, in Arbeit, gelernt, gefestigt),
 * mit einer Legende, die die Gesamtzahlen nennt.
 * Reine Anzeige: Die Seite berechnet die Anteile mit maturityShares() und übergibt sie.
 */
@Component({
  selector: 'app-maturity-overview',
  templateUrl: './maturity-overview.html',
  styleUrl: './maturity-overview.css',
})
export class MaturityOverview {
  /** Anteile über alle Fächer – für die Legende */
  readonly total = input.required<MaturityShare[]>();
  readonly rows = input.required<MaturityRow[]>();

  /** Text für Screenreader, z. B. „gefestigt 40, gelernt 12, in Arbeit 3, neu 20“ */
  protected describe(shares: MaturityShare[]): string {
    return shares.map((share) => `${share.label} ${share.count}`).join(', ');
  }
}
