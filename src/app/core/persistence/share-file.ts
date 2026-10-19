/**
 * Gibt eine Datei an den Nutzer weiter.
 *
 * Auf Touch-Geräten öffnet sich das Teilen-Menü des Systems (z. B. "In Dateien sichern"
 * oder per Messenger an sich selbst schicken). Am PC wird die Datei normal heruntergeladen.
 *
 * Gibt `false` zurück, wenn das Teilen-Menü ohne Auswahl geschlossen wurde.
 */
export async function shareOrDownload(file: File): Promise<boolean> {
  const isTouchDevice = matchMedia('(pointer: coarse)').matches;
  if (isTouchDevice && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: file.name });
      return true;
    } catch (error) {
      // Schließt jemand das Teilen-Menü, ist das kein Fehler
      if ((error as DOMException).name === 'AbortError') return false;
      // Andere Fehler: unten auf den normalen Download ausweichen
    }
  }

  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  link.click();
  // Erst nach dem Klick freigeben, sonst bricht der Download in manchen Browsern ab
  setTimeout(() => URL.revokeObjectURL(url));
  return true;
}

/** Erstellt eine JSON-Datei, z. B. für eine Sicherung */
export function jsonFile(data: unknown, name: string): File {
  return new File([JSON.stringify(data, null, 2)], name, { type: 'application/json' });
}
