import { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * Validator für Pflichtfelder, der auch reine Leerzeichen ablehnt
 * (das eingebaute `Validators.required` würde "   " durchlassen).
 */
export function notBlank(control: AbstractControl<string>): ValidationErrors | null {
  return control.value.trim() ? null : { blank: true };
}
