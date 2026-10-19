import { TestBed } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { appConfig } from './app.config';
import { prepareStorage } from './core/persistence/migrations';

describe('App (Seiten über den Router)', () => {
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    localStorage.clear();
    await prepareStorage();
    // jsdom kann nicht scrollen; der Router versucht es bei jedem Seitenwechsel
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {
      // absichtlich leer
    });
    // Die echte App-Konfiguration verwenden, damit der Test auch Router-Einstellungen prüft
    TestBed.configureTestingModule({ providers: appConfig.providers });
    harness = await RouterTestingHarness.create();
  });

  it('shows the daily overview and the sample subject on the start page', async () => {
    await harness.navigateByUrl('/');
    const page = harness.routeNativeElement!;

    const stats = [...page.querySelectorAll('dd')].map((dd) => dd.textContent?.trim());
    expect(stats).toEqual(['0', '10', '5']);
    expect(page.querySelector('app-progress-row')?.textContent).toContain(
      'Beispielfach: Besser lernen',
    );
  });

  it('lists the chapters of a subject', async () => {
    await harness.navigateByUrl('/fach/beispiel');
    expect(harness.routeNativeElement!.querySelectorAll('app-progress-row')).toHaveLength(3);
  });

  it('starts a round for one chapter with a flashcard', async () => {
    await harness.navigateByUrl('/lernen?fach=beispiel&kapitel=beispiel-2');
    const page = harness.routeNativeElement!;
    expect(page.querySelector('app-flashcard-view')?.textContent).toContain('Lerntechniken');
  });

  it('shows a hint for unknown subjects', async () => {
    await harness.navigateByUrl('/fach/gibt-es-nicht');
    expect(harness.routeNativeElement!.textContent).toContain('Fach nicht gefunden');
  });

  it('shows the statistics page, empty before the first answer', async () => {
    await harness.navigateByUrl('/statistik');
    const page = harness.routeNativeElement!;
    expect(page.textContent).toContain('Noch keine Antworten');
    expect(page.querySelectorAll('app-bar-chart')).toHaveLength(2);
  });

  it('finds cards that contain every search word', async () => {
    await harness.navigateByUrl('/suche');
    const page = harness.routeNativeElement!;
    const input = page.querySelector<HTMLInputElement>('input[type="search"]')!;
    input.value = 'feynman was';
    input.dispatchEvent(new Event('input'));
    await harness.fixture.whenStable();
    expect(page.querySelector('app-item-row')?.textContent).toContain(
      'Was ist die Feynman-Methode?',
    );
  });

  it('opens the bulk import for quiz questions', async () => {
    await harness.navigateByUrl('/fach/beispiel/kapitel/beispiel-1/import?art=quiz');
    expect(harness.routeNativeElement!.querySelector('h1')?.textContent).toContain(
      'Quizfragen importieren',
    );
  });
});
