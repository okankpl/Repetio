import { TestBed } from '@angular/core/testing';
import { PersistenceStatus, Validator, persistentSignal } from './persistent-signal';

describe('persistentSignal', () => {
  const KEY = 'test.counter';

  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  /** persistentSignal braucht einen Injection Context – den liefert TestBed */
  function create(isValid?: Validator) {
    return TestBed.runInInjectionContext(() => persistentSignal(KEY, { count: 0 }, isValid));
  }

  function problem(): string | null {
    return TestBed.inject(PersistenceStatus).problem();
  }

  it('loads the stored value and saves every change', () => {
    localStorage.setItem(KEY, '{"count":1}');
    const counter = create();
    expect(counter()).toEqual({ count: 1 });

    counter.set({ count: 2 });
    TestBed.tick(); // führt anstehende effects aus
    expect(localStorage.getItem(KEY)).toBe('{"count":2}');
  });

  it('takes over a change made in another tab', () => {
    const counter = create();
    localStorage.setItem(KEY, '{"count":5}');
    window.dispatchEvent(new StorageEvent('storage', { key: KEY }));
    expect(counter()).toEqual({ count: 5 });
  });

  it('falls back to the default for damaged data but keeps a copy of it', () => {
    localStorage.setItem(KEY, '{kaputt');
    const counter = create();
    expect(counter()).toEqual({ count: 0 });
    expect(localStorage.getItem(`${KEY}.defekt`)).toBe('{kaputt');
    expect(problem()).toContain('beschädigt');
  });

  it('rejects stored data with the wrong shape', () => {
    localStorage.setItem(KEY, '[1, 2, 3]');
    const counter = create((value) => typeof value === 'object' && !Array.isArray(value));
    expect(counter()).toEqual({ count: 0 });
  });

  it('reports when the browser storage is full', () => {
    const counter = create();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Speicher voll', 'QuotaExceededError');
    });
    counter.set({ count: 1 });
    TestBed.tick();
    expect(problem()).toContain('Speicher des Browsers ist voll');
  });
});
