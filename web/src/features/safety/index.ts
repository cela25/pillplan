/** Public API of the safety feature. */
export type { NoteKind, SafetyNote, Severity } from './model';
export { runSafetyChecks } from './logic/checks';
export { SafetyNotes } from './ui/SafetyNotes';
