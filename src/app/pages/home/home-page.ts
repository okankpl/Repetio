import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { subjectLink } from '../../app.links';
import { LearningStore } from '../../core/learning/learning-store';
import { LibraryStore } from '../../core/library/library-store';
import { parseSubjects } from '../../core/persistence/backup';
import { FileButton } from '../../shared/file-button/file-button';
import { NameForm } from '../../shared/name-form/name-form';
import { ProgressRow } from '../../shared/progress-row/progress-row';
import { StudyCard } from '../../shared/study-card/study-card';
import { BackupReminder } from './backup-reminder/backup-reminder';
import { StreakCard } from './streak-card/streak-card';

/**
 * Startseite: Hinweis zur Sicherung, tägliche Runde über alle Fächer, Lernserie
 * und das Register aller Fächer (anlegen oder aus einer Datei hinzufügen).
 */
@Component({
  selector: 'app-home-page',
  imports: [RouterLink, StudyCard, ProgressRow, NameForm, FileButton, BackupReminder, StreakCard],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
})
export class HomePage {
  private readonly library = inject(LibraryStore);
  private readonly learning = inject(LearningStore);
  private readonly router = inject(Router);

  /** Kennzahlen über alle Fächer */
  protected readonly today = computed(() => this.learning.overview({}));

  /** Fächer mit Link, Kapitelanzahl und Kennzahlen für die Liste */
  protected readonly subjects = computed(() =>
    this.library.subjects().map((subject) => ({
      subject,
      link: subjectLink(subject.id),
      chapterCount: this.library.chaptersOf(subject.id).length,
      overview: this.learning.overview({ subjectId: subject.id }),
    })),
  );

  /** Ob das Formular für ein neues Fach offen ist */
  protected readonly creating = signal(false);
  /** Rückmeldung nach dem Laden eines Fachs aus einer Datei */
  protected readonly message = signal('');

  protected addSubject(name: string): void {
    const subject = this.library.addSubject(name);
    this.router.navigate(subjectLink(subject.id));
  }

  /** Fügt Fächer aus einer geteilten Datei oder Sicherung zu den vorhandenen hinzu. */
  protected async addFromFile(file: File): Promise<void> {
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

  /** Anfangsbuchstabe als Kennzeichen in der Liste */
  protected initial(name: string): string {
    return name.trim().charAt(0).toUpperCase();
  }
}
