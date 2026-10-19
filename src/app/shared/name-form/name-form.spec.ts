import { TestBed } from '@angular/core/testing';
import { NameForm } from './name-form';

describe('NameForm', () => {
  async function render(value = '') {
    const fixture = TestBed.createComponent(NameForm);
    fixture.componentRef.setInput('value', value);
    const saved: string[] = [];
    fixture.componentInstance.saved.subscribe((name) => saved.push(name));
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const input = element.querySelector('input')!;
    const form = element.querySelector('form')!;
    return { fixture, saved, input, form };
  }

  function submit(form: HTMLFormElement): Event {
    const event = new Event('submit', { cancelable: true });
    form.dispatchEvent(event);
    return event;
  }

  it('emits the trimmed name and keeps the browser from reloading the page', async () => {
    const { saved, input, form } = await render();
    input.value = '  Mathematik  ';
    input.dispatchEvent(new Event('input'));

    const event = submit(form);

    expect(event.defaultPrevented).toBe(true);
    expect(saved).toEqual(['Mathematik']);
  });

  it('ignores names that only consist of spaces', async () => {
    const { saved, input, form } = await render();
    input.value = '   ';
    input.dispatchEvent(new Event('input'));
    submit(form);
    expect(saved).toEqual([]);
  });

  it('starts with the given value, e.g. when renaming', async () => {
    const { input } = await render('Physik');
    expect(input.value).toBe('Physik');
  });
});
