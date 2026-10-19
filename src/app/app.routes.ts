import { Routes } from '@angular/router';
import { HomePage } from './pages/home/home-page';

/**
 * Seiten der App. Die Startseite wird sofort geladen, alle anderen erst beim ersten Aufruf
 * (`loadComponent` = Lazy Loading) – das hält den ersten Download klein.
 * Platzhalter wie :subjectId landen über withComponentInputBinding direkt in gleichnamigen inputs.
 */
export const routes: Routes = [
  { path: '', component: HomePage, title: 'Repetio' },
  {
    path: 'fach/:subjectId',
    title: 'Fach · Repetio',
    loadComponent: () => import('./pages/subject/subject-page').then((m) => m.SubjectPage),
  },
  {
    path: 'fach/:subjectId/kapitel/:chapterId',
    title: 'Kapitel · Repetio',
    loadComponent: () => import('./pages/chapter/chapter-page').then((m) => m.ChapterPage),
  },
  {
    path: 'fach/:subjectId/kapitel/:chapterId/neu/:kind',
    title: 'Neuer Eintrag · Repetio',
    loadComponent: () =>
      import('./pages/item-editor/item-editor-page').then((m) => m.ItemEditorPage),
  },
  {
    path: 'fach/:subjectId/kapitel/:chapterId/import',
    title: 'Import · Repetio',
    loadComponent: () =>
      import('./pages/text-import/text-import-page').then((m) => m.TextImportPage),
  },
  {
    path: 'fach/:subjectId/kapitel/:chapterId/eintrag/:itemId',
    title: 'Eintrag bearbeiten · Repetio',
    loadComponent: () =>
      import('./pages/item-editor/item-editor-page').then((m) => m.ItemEditorPage),
  },
  {
    path: 'lernen',
    title: 'Lernen · Repetio',
    loadComponent: () => import('./pages/session/session-page').then((m) => m.SessionPage),
  },
  {
    path: 'statistik',
    title: 'Statistik · Repetio',
    loadComponent: () => import('./pages/statistics/statistics-page').then((m) => m.StatisticsPage),
  },
  {
    path: 'suche',
    title: 'Suche · Repetio',
    loadComponent: () => import('./pages/search/search-page').then((m) => m.SearchPage),
  },
  {
    path: 'einstellungen',
    title: 'Einstellungen · Repetio',
    loadComponent: () => import('./pages/settings/settings-page').then((m) => m.SettingsPage),
  },
  // Unbekannte Adressen führen zur Startseite
  { path: '**', redirectTo: '' },
];
