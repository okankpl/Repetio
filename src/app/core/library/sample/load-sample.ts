import { Library } from '../../models';

/**
 * Lädt das Beispielfach erst bei Bedarf (beim ersten Start oder beim Wiederherstellen).
 * `import()` mit Funktionsaufruf-Syntax lädt ein Modul zur Laufzeit; der Build legt es dafür
 * in eine eigene Datei. So bleiben die Beispieldaten aus dem Startpaket der App heraus.
 */
export async function loadSampleLibrary(): Promise<Library> {
  const { SAMPLE_LIBRARY } = await import('./sample-library');
  return SAMPLE_LIBRARY;
}
