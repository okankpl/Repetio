import { TestBed } from '@angular/core/testing';
import { FileButton } from './file-button';

describe('FileButton', () => {
  it('reports the chosen file and can pick the same file again', async () => {
    const fixture = TestBed.createComponent(FileButton);
    fixture.componentRef.setInput('label', 'Sicherung laden');
    const picked: File[] = [];
    fixture.componentInstance.picked.subscribe((file) => picked.push(file));
    await fixture.whenStable();

    const input = (fixture.nativeElement as HTMLElement).querySelector('input')!;
    const file = new File(['{}'], 'sicherung.json');
    // jsdom erlaubt kein Setzen von files per Zuweisung – daher über defineProperty
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    input.dispatchEvent(new Event('change'));

    expect(picked).toEqual([file]);
    expect(input.value).toBe('');
  });
});
