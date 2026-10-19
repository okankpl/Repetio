import { TestBed } from '@angular/core/testing';
import { BarChart, niceCeiling } from './bar-chart';

describe('BarChart', () => {
  it('rounds the scale up to a round number', () => {
    expect([0, 1, 7, 23, 140, 1000].map(niceCeiling)).toEqual([1, 1, 10, 50, 200, 1000]);
  });

  it('shows the summary and the description of the bar under the pointer', async () => {
    const fixture = TestBed.createComponent(BarChart);
    fixture.componentRef.setInput('label', 'Antworten');
    fixture.componentRef.setInput('summary', '30 Antworten');
    fixture.componentRef.setInput('bars', [
      { label: 'Mo', value: 10, description: 'Montag: 10' },
      { label: 'Di', value: 20, description: 'Dienstag: 20' },
    ]);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const readout = () => element.querySelector('.readout')?.textContent?.trim();

    expect(readout()).toBe('30 Antworten');
    expect(element.querySelector('.tick.top')?.textContent).toBe('20');

    const [, tuesday] = element.querySelectorAll<HTMLElement>('.slot');
    expect(tuesday.getAttribute('aria-label')).toBe('Dienstag: 20');
    tuesday.dispatchEvent(new Event('pointerenter'));
    await fixture.whenStable();
    expect(readout()).toBe('Dienstag: 20');
  });
});
