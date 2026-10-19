import { createBackup, createSubjectsFile, parseBackup, parseSubjects } from './backup';
import { SAMPLE_LIBRARY } from '../library/sample/sample-library';
import { createCardState } from '../learning/srs';

describe('backup', () => {
  it('reads back what it wrote', () => {
    const backup = createBackup(SAMPLE_LIBRARY, { 'b1-01': createCardState() });
    expect(parseBackup(JSON.stringify(backup))).toEqual(backup);
  });

  it('leaves out the progress of deleted items', () => {
    const backup = createBackup(SAMPLE_LIBRARY, {
      'b1-01': createCardState(),
      'geloescht-1': createCardState(),
    });
    expect(Object.keys(backup.progress)).toEqual(['b1-01']);
  });

  it('rejects text that is not JSON', () => {
    expect(() => parseBackup('kein json')).toThrow('keine gültige JSON-Datei');
  });

  it('rejects JSON that is not a backup of this app', () => {
    expect(() => parseBackup('{"name": "irgendwas"}')).toThrow('keine Repetio-Sicherung');
  });

  it('rejects a backup with broken items', () => {
    const backup = createBackup(SAMPLE_LIBRARY, {});
    const broken = { ...backup, library: { ...backup.library, items: [{ id: 'x' }] } };
    expect(() => parseBackup(JSON.stringify(broken))).toThrow('keine Repetio-Sicherung');
  });

  it('includes the statistics', () => {
    const activity = { '2026-10-16': { reviews: 3, correct: 2, learned: 1, timeMs: 5000 } };
    const backup = createBackup(SAMPLE_LIBRARY, {}, activity);
    expect(backup.version).toBe(2);
    expect(parseBackup(JSON.stringify(backup)).activity).toEqual(activity);
  });

  it('still reads backups of version 1 (without statistics)', () => {
    const { library, progress, exportedAt } = createBackup(SAMPLE_LIBRARY, {});
    const old = { format: 'repetio-backup', version: 1, exportedAt, library, progress };
    const parsed = parseBackup(JSON.stringify(old));
    expect(parsed.version).toBe(2);
    expect(parsed.activity).toEqual({});
  });

  it('reads the subjects of a shared file or of a complete backup', () => {
    const shared = createSubjectsFile(SAMPLE_LIBRARY);
    expect(parseSubjects(JSON.stringify(shared))).toEqual(SAMPLE_LIBRARY);
    const backup = createBackup(SAMPLE_LIBRARY, { 'b1-01': createCardState() });
    expect(parseSubjects(JSON.stringify(backup))).toEqual(SAMPLE_LIBRARY);
    expect(() => parseSubjects('{"format":"etwas-anderes"}')).toThrow('keine Repetio-Fächer');
  });

  it('still reads files from the time the app was called "Merkwerk"', () => {
    const backup = { ...createBackup(SAMPLE_LIBRARY, {}), format: 'merkwerk-backup' };
    expect(parseBackup(JSON.stringify(backup)).format).toBe('repetio-backup');
    const shared = { ...createSubjectsFile(SAMPLE_LIBRARY), format: 'merkwerk-subjects' };
    expect(parseSubjects(JSON.stringify(shared))).toEqual(SAMPLE_LIBRARY);
  });
});
