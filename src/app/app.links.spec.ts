import { chapterLink, itemLink, scopeLink, studyQueryParams, subjectLink } from './app.links';

describe('app.links', () => {
  it('builds the addresses of subjects, chapters and items', () => {
    expect(subjectLink('s')).toEqual(['/fach', 's']);
    expect(chapterLink('s', 'c')).toEqual(['/fach', 's', 'kapitel', 'c']);
    expect(itemLink('s', 'c', 'i')).toEqual(['/fach', 's', 'kapitel', 'c', 'eintrag', 'i']);
  });

  it('leads back to the page a round was started from', () => {
    expect(scopeLink({})).toEqual(['/']);
    expect(scopeLink({ subjectId: 's' })).toEqual(['/fach', 's']);
    expect(scopeLink({ subjectId: 's', chapterId: 'c' })).toEqual(['/fach', 's', 'kapitel', 'c']);
  });

  it('only puts set values into the query of a round', () => {
    expect(studyQueryParams({})).toEqual({});
    expect(studyQueryParams({ subjectId: 's', chapterId: 'c' })).toEqual({
      fach: 's',
      kapitel: 'c',
    });
  });
});
