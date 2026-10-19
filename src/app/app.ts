import { Component, DestroyRef, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { filter, map } from 'rxjs';
import { DataSafety } from './core/data-safety';
import { LearningStore } from './core/learning/learning-store';
import { PersistenceStatus } from './core/persistence/persistent-signal';
import { Settings, Theme } from './core/settings';

/** Hintergrundfarbe je Design – auch für die Statusleiste des Handys (meta theme-color) */
const THEME_COLORS = { light: '#f5f6f8', dark: '#0f1216' } as const;

/**
 * App-Hülle: zeigt die aktuelle Seite und Hinweise zu neuen Versionen und Speicherproblemen.
 * Kümmert sich außerdem um Dinge, die für die ganze App gelten: Design, App-Badge, Updates.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly updates = inject(SwUpdate);
  private readonly settings = inject(Settings);
  private readonly learning = inject(LearningStore);
  private readonly dataSafety = inject(DataSafety);
  protected readonly persistence = inject(PersistenceStatus);

  /**
   * Der Service Worker lädt neue Versionen im Hintergrund. Sobald eine bereitliegt, wird ein
   * Hinweis angezeigt. `toSignal` macht aus dem RxJS-Ereignisstrom ein Signal fürs Template.
   */
  protected readonly updateReady = toSignal(
    this.updates.versionUpdates.pipe(
      filter((event) => event.type === 'VERSION_READY'),
      map(() => true),
    ),
    { initialValue: false },
  );

  /**
   * Selten kann der Service Worker die gespeicherte Version nicht mehr vollständig laden
   * (z. B. wenn der Browser Teile des Caches gelöscht hat). Dann hilft nur Neuladen.
   */
  protected readonly broken = toSignal(this.updates.unrecoverable.pipe(map(() => true)), {
    initialValue: false,
  });

  constructor() {
    // effect: läuft sofort und erneut, sobald sich ein darin gelesenes Signal ändert
    effect(() => applyTheme(this.settings.current().theme));
    effect(() => showBadge(this.learning.overview({}).due));

    this.checkForUpdatesWhenVisible();

    // Als installierte App den Browser bitten, die Daten nicht von selbst zu löschen.
    // Im normalen Browser-Tab nicht automatisch, weil Firefox dafür eine Rückfrage zeigt.
    if (matchMedia('(display-mode: standalone)').matches) {
      void this.dataSafety.requestPersistence();
    }
  }

  protected reload(): void {
    document.location.reload();
  }

  /**
   * Eine installierte App bleibt oft tagelang geöffnet. Damit sie trotzdem Updates bekommt,
   * fragt sie bei jeder Rückkehr in den Vordergrund nach einer neuen Version.
   */
  private checkForUpdatesWhenVisible(): void {
    if (!this.updates.isEnabled) return;
    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      this.updates.checkForUpdate().catch(() => {
        // Offline oder Server nicht erreichbar: beim nächsten Mal erneut versuchen
      });
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    inject(DestroyRef).onDestroy(() =>
      document.removeEventListener('visibilitychange', onVisibilityChange),
    );
  }
}

/**
 * Setzt das Farbschema. styles.css wählt die Farben mit `light-dark()`: Ein festes
 * `data-theme` überschreibt dort das System-Schema über die CSS-Eigenschaft `color-scheme`.
 */
function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === 'system') delete root.dataset['theme'];
  else root.dataset['theme'] = theme;

  // Die Statusleiste passend einfärben; bei "system" gelten wieder die Media-Queries aus index.html
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
    const own = meta.media.includes('dark') ? THEME_COLORS.dark : THEME_COLORS.light;
    meta.content = theme === 'system' ? own : THEME_COLORS[theme];
  });
}

/**
 * Zeigt die Zahl fälliger Einheiten am App-Symbol (Badging API), z. B. in der Taskleiste
 * unter Windows. Browser ohne diese Funktion überspringen das einfach.
 */
function showBadge(due: number): void {
  if (!('setAppBadge' in navigator)) return;
  const request = due > 0 ? navigator.setAppBadge(due) : navigator.clearAppBadge();
  request.catch(() => {
    // z. B. nicht als App installiert – dann gibt es kein Symbol für ein Badge
  });
}
