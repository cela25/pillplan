export type NoteKind =
  'max-daily' | 'duplicate-ingredient' | 'duplicate-class' | 'timing' | 'unchecked';
export type Severity = 'alert' | 'caution' | 'info';

export interface SafetyNote {
  /** Stable id, so a note keeps its identity (and does not re-animate) between renders. */
  id: string;
  kind: NoteKind;
  severity: Severity;
  medicineIds: string[];
  title: string;
  detail: string;
}
