import { Page, expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

/** Legt ein Fach mit einem Kapitel an und öffnet die Kapitelseite */
async function createChapter(page: Page, subject: string, chapter: string): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: '+ Neues Fach' }).click();
  await page.getByRole('textbox', { name: /Name des Fachs/ }).fill(subject);
  await page.getByRole('button', { name: 'Fach anlegen' }).click();
  await page.getByRole('button', { name: '+ Neues Kapitel' }).click();
  await page.getByRole('textbox', { name: 'Titel des Kapitels' }).fill(chapter);
  await page.getByRole('button', { name: 'Kapitel anlegen' }).click();
  await expect(page.getByRole('heading', { level: 1, name: chapter })).toBeVisible();
}

test('cards from a bulk import can be learned and show up in the statistics', async ({ page }) => {
  await createChapter(page, 'Erdkunde', 'Hauptstädte');

  await page.getByRole('link', { name: 'Import' }).first().click();
  await page
    .getByRole('textbox', { name: 'Text' })
    .fill('Frankreich? ; Paris\nItalien? ; Rom\nSpanien? ; Madrid');
  await page.getByRole('button', { name: '3 Karteikarten importieren' }).click();
  await expect(page.getByRole('heading', { name: 'Karteikarten · 3' })).toBeVisible();

  await page.getByRole('link', { name: 'Kapitel lernen' }).click();
  for (const answer of ['Paris', 'Rom', 'Madrid']) {
    await page.getByRole('textbox', { name: 'Deine Antwort' }).fill(answer);
    await page.getByRole('button', { name: /Aufdecken/ }).click();
    await page.getByRole('button', { name: /Richtig/ }).click();
  }
  await expect(page.getByRole('heading', { name: 'Runde geschafft!' })).toBeVisible();

  await page.getByRole('link', { name: 'Zur Statistik' }).click();
  await expect(page.locator('app-key-figures')).toContainText(/Antworten heute\s*3/);
  await expect(page.locator('app-key-figures')).toContainText('100 %');
});

test('the last rating can be taken back', async ({ page }) => {
  await createChapter(page, 'Mathe', 'Rechnen');
  await page.getByRole('link', { name: '+ Neu' }).first().click();
  await page.getByRole('textbox', { name: 'Frage' }).fill('2 + 2?');
  await page.getByRole('textbox', { name: 'Antwort' }).fill('4');
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();

  await page.getByRole('link', { name: 'Kapitel lernen' }).click();
  await page.getByRole('button', { name: /Aufdecken/ }).click();
  await page.getByRole('button', { name: /Falsch/ }).click();
  // Falsch beantwortet: Die Karte kommt in derselben Runde wieder
  await expect(page.getByRole('heading', { name: '2 + 2?' })).toBeVisible();

  const undo = page.getByRole('button', { name: 'Letzte Bewertung zurücknehmen' });
  await undo.click();
  await expect(undo).toBeDisabled();
  await page.getByRole('button', { name: /Aufdecken/ }).click();
  await page.getByRole('button', { name: /Richtig/ }).click();
  await expect(page.locator('app-key-figures')).toContainText('100 %');
});

test.describe('am PC', () => {
  // Ohne Touchscreen lädt die App Dateien herunter, statt das Teilen-Menü zu öffnen
  test.use({ isMobile: false, hasTouch: false, viewport: { width: 1280, height: 800 } });

  test('a backup contains contents and statistics and is remembered', async ({ page }) => {
    await page.goto('/einstellungen');
    await expect(page.locator('.facts')).toContainText('noch nie');
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Sicherung speichern' }).click();
    const file = await download;
    expect(file.suggestedFilename()).toMatch(/^repetio-\d{4}-\d{2}-\d{2}\.json$/);

    const backup = JSON.parse(await readFile(await file.path(), 'utf-8'));
    expect(backup).toMatchObject({ format: 'repetio-backup', version: 2, activity: {} });
    expect(backup.library.subjects[0].name).toBe('Beispielfach: Besser lernen');
    await expect(page.locator('.facts')).toContainText('heute');
  });
});

test('the chosen design is kept after a reload', async ({ page }) => {
  await page.goto('/einstellungen');
  await page.getByRole('combobox', { name: 'Design' }).selectOption('dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});
