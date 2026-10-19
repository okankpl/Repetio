import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { MINUTE_MS } from './dates';

/**
 * Uhrzeit, auf die `computed`-Werte reagieren können.
 *
 * Fälligkeiten und Tageslimits hängen von der Zeit ab. Ein `computed` merkt aber nur Änderungen
 * an Signals – ohne diesen Dienst würde die Startseite einer installierten App, die über Nacht
 * im Hintergrund offen bleibt, am Morgen noch die Zahlen vom Vortag zeigen.
 *
 * `now()` liefert immer die genaue Zeit. Zusätzlich liest es das Signal `tick`, das jede Minute
 * und beim Zurückkehren in die App weiterzählt. Dadurch rechnen alle `computed`, die `now()`
 * aufrufen, zu diesen Zeitpunkten neu.
 */
@Injectable({ providedIn: 'root' })
export class Clock {
  private readonly tick = signal(0);

  constructor() {
    const advance = () => this.tick.update((n) => n + 1);
    const timer = setInterval(advance, MINUTE_MS);
    // "visibilitychange": die App kommt wieder in den Vordergrund (Tab gewechselt, Handy entsperrt)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') advance();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    inject(DestroyRef).onDestroy(() => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    });
  }

  /** Aktueller Zeitpunkt in ms; macht den aufrufenden `computed` von der Uhr abhängig */
  now(): number {
    this.tick();
    return Date.now();
  }
}
