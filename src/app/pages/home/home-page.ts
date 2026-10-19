import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Clock } from '../../core/clock';
import { DataSafety } from '../../core/data-safety';
import { dayKey } from '../../core/dates';
import { LearningStore } from '../../core/learning/learning-store';
import { currentStreak } from '../../core/learning/statistics';
import { LibraryStore } from '../../core/library/library-store';
import { parseSubjects } from '../../core/persistence/backup';
import { NameForm } from '../../shared/name-form/name-form';
import { ProgressRow } from '../../shared/progress-row/progress-row';
import { StudyCard } from '../../shared/study-card/study-card';

/** Startseite: tägliche Runde über alle Fächer und das Register aller Fächer. */
@Component({
  selector: 'app-home-page',
  imports: [RouterLink, StudyCard, ProgressRow, NameForm],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
})
export class HomePage {
  private readonly library = inject(LibraryStore);
  private readonly learning = inject(LearningStore);
  private readonly clock = inject(Clock);
  private readonly router = inject(Router);
  protected readonly dataSafety = inject(DataSafety);

  /** Kennzahlen über alle Fächer */
  protected readonly today = computed(() => this.learning.overview({}));

  /** Lernserie und heutige Antworten; null, solange noch nie gelernt wurde */
  protected readonly streak = computed(() => {
    const log = this.learning.activityData();
    if (Object.keys(log).length === 0) return null;
    const now = this.clock.now();
    return { days: currentStreak(log, now), reviewsToday: log[dayKey(now)]?.reviews ?? 0 };
  });

  /** Fächer mit Kapitelanzahl und Kennzahlen für die Liste */
  protected readonly subjects = computed(() =>
    this.library.subjects().map((subject) => ({
      subject,
      chapterCount: this.library.chaptersOf(subject.id).length,
      overview: this.learning.overview({ subjectId: subject.id }),
    })),
  );

  /** Ob das Formular für ein neues Fach offen ist */
  protected readonly creating = signal(false);
  /** Ob die Erinnerung an die Sicherung für diesen Besuch weggeklickt wurde */
  protected readonly reminderDismissed = signal(false);
  /** Rückmeldung nach dem Laden eines Fachs aus einer Datei */
  protected readonly message = signal('');

  protected addSubject(name: string): void {
    const subject = this.library.addSubject(name);
    this.router.navigate(['/fach', subject.id]);
  }

  /** Fügt Fächer aus einer geteilten Datei oder Sicherung zu den vorhandenen hinzu. */
  protected async addFromFile(input: HTMLInputElement): Promise<void> {
    const file = input.files?.[0];
    input.value = ''; // dieselbe Datei soll sich später erneut auswählen lassen
    if (!file) return;

    try {
      const content = parseSubjects(await file.text());
      const names = content.subjects.map((subject) => `„${subject.name}“`).join(', ');
      if (!confirm(`${names} mit ${content.items.length} Einträgen hinzufügen?`)) return;
      const added = this.library.addSubjects(content);
      this.message.set(
        added.length === 1 ? 'Fach hinzugefügt.' : `${added.length} Fächer hinzugefügt.`,
      );
    } catch (error) {
      this.message.set((error as Error).message);
    }
  }

  protected async backupNow(): Promise<void> {
    await this.dataSafety.exportBackup();
  }

  protected initial(name: string): string {
    return name.trim().charAt(0).toUpperCase();
  }
}
