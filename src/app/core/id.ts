/**
 * Erzeugt eine kurze, praktisch eindeutige id für neue Fächer, Kapitel und Lerneinheiten.
 *
 * Bewusst nicht `crypto.randomUUID()`: Das gibt es nur über HTTPS bzw. localhost,
 * nicht aber beim Testen auf dem Handy über die IP-Adresse des PCs im WLAN.
 */
export function createId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
