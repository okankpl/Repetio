import {
  ApplicationConfig,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { routes } from './app.routes';
import { prepareStorage } from './core/persistence/migrations';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Läuft vor dem Start der App: Daten älterer Versionen übernehmen, beim ersten Start das
    // Beispielfach anlegen. Die App wartet, bis das zurückgegebene Promise erfüllt ist.
    provideAppInitializer(() => prepareStorage()),
    provideRouter(
      routes,
      // Routen-Platzhalter (z. B. :subjectId) werden direkt als input() an die Seite übergeben
      withComponentInputBinding(),
      // Neue Seite beginnt oben; "Zurück" stellt die vorige Scrollposition wieder her
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
    ),
    // Service Worker: macht die App offline-fähig und installierbar (nur im Produktions-Build aktiv)
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
