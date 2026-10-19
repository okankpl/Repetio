import { TestBed } from '@angular/core/testing';
import { QUESTIONS } from '../../../core/library/sample/questions';
import { RATING, Rating } from '../../../core/learning/srs';
import { ChoiceView } from './choice-view';

describe('ChoiceView', () => {
  const question = QUESTIONS[0];

  async function render() {
    const fixture = TestBed.createComponent(ChoiceView);
    fixture.componentRef.setInput('question', question);
    fixture.componentRef.setInput('intervals', { again: '1 Min', good: '1 T' });
    const ratings: Rating[] = [];
    fixture.componentInstance.rated.subscribe((rating) => ratings.push(rating));
    await fixture.whenStable();
    return { fixture, ratings, element: fixture.nativeElement as HTMLElement };
  }

  function option(element: HTMLElement, text: string): HTMLButtonElement {
    const buttons = [...element.querySelectorAll<HTMLButtonElement>('.option')];
    return buttons.find((button) => button.textContent?.includes(text))!;
  }

  function nextButton(element: HTMLElement): HTMLButtonElement {
    return element.querySelector<HTMLButtonElement>('.actions .btn')!;
  }

  it('shows the correct answer together with all distractors', async () => {
    const { element } = await render();
    expect(element.querySelectorAll('.option')).toHaveLength(1 + question.wrong.length);
    expect(element.querySelector('.feedback')).toBeNull();
  });

  it('marks a wrong choice, reveals the right one and rates it as "again"', async () => {
    const { fixture, element, ratings } = await render();
    option(element, question.wrong[0]).click();
    await fixture.whenStable();

    expect(element.querySelector('.feedback')?.textContent).toContain('Leider falsch');
    expect(option(element, question.wrong[0]).classList).toContain('is-wrong');
    expect(option(element, question.correct).classList).toContain('is-correct');

    nextButton(element).click();
    expect(ratings).toEqual([RATING.AGAIN]);
  });

  it('rates a correct choice as "good"', async () => {
    const { fixture, element, ratings } = await render();
    option(element, question.correct).click();
    await fixture.whenStable();

    expect(element.querySelector('.feedback')?.textContent).toContain('Richtig!');
    nextButton(element).click();
    expect(ratings).toEqual([RATING.GOOD]);
  });
});
