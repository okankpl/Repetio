import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SegmentedControl } from './segmented-control';

/** Testseite, die den Umschalter wie eine echte Seite mit [(value)] einbindet */
@Component({
  imports: [SegmentedControl],
  template: `<app-segmented-control label="Zeitraum" [options]="options" [(value)]="days" />`,
})
class Host {
  readonly options = [
    { value: 14, label: '14 Tage' },
    { value: 30, label: '30 Tage' },
  ];
  readonly days = signal(14);
}

describe('SegmentedControl', () => {
  it('marks the active option and writes a click back to the page', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const buttons = [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')];
    expect(buttons.map((button) => button.getAttribute('aria-pressed'))).toEqual(['true', 'false']);

    buttons[1].click();
    await fixture.whenStable();

    expect(fixture.componentInstance.days()).toBe(30);
    expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
  });
});
