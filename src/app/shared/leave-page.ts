import { Location } from '@angular/common';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

/**
 * Liefert eine Funktion, die eine Seite verlässt, nachdem sie ihren Zweck erfüllt hat
 * (Runde beendet, Eintrag gespeichert, Fach gelöscht …).
 *
 * Wurde die Seite aus der App heraus geöffnet, geht es wie mit der Zurück-Taste zur vorigen
 * Seite. Dadurch bleibt die erledigte Seite nicht im Verlauf, und die Zurück-Taste auf dem
 * Handy führt danach nicht noch einmal hinein. Wurde die Adresse direkt geöffnet (Lesezeichen,
 * geteilter Link), gibt es keine vorige Seite der App – dann geht es zum angegebenen Ziel.
 *
 * Muss wie `inject()` als Feld-Initialisierer aufgerufen werden:
 *   private readonly leave = injectLeavePage();
 */
export function injectLeavePage(): (fallback: unknown[]) => void {
  const location = inject(Location);
  const router = inject(Router);

  return (fallback) => {
    // Der Router zählt Navigationen mit; ab 2 gab es vorher schon eine Seite der App
    const navigationId = (history.state as { navigationId?: number } | null)?.navigationId ?? 1;
    if (navigationId > 1) {
      location.back();
    } else {
      router.navigate(fallback);
    }
  };
}
