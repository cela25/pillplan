import type { Medicine, PlanState } from '../model';

export type PlanAction =
  | { type: 'add'; medicine: Medicine }
  | { type: 'update'; medicine: Medicine }
  | { type: 'remove'; id: string }
  | { type: 'restore'; medicine: Medicine; index: number }
  | { type: 'move'; from: number; to: number }
  | { type: 'setPatientName'; name: string }
  | { type: 'toggleDose'; key: string }
  | { type: 'resetTracker'; start: string }
  | { type: 'replace'; state: PlanState };

export function emptyPlan(today: string): PlanState {
  return { patientName: '', medicines: [], tracker: { start: today, popped: [] } };
}

function move<T>(items: readonly T[], from: number, to: number): T[] {
  const next = [...items];
  const [item] = next.splice(from, 1);
  if (item === undefined) return [...items];
  next.splice(Math.max(0, Math.min(to, next.length)), 0, item);
  return next;
}

/** Pure state changes for the patient's plan. Dates come in through actions, never from the clock. */
export function planReducer(state: PlanState, action: PlanAction): PlanState {
  switch (action.type) {
    case 'add':
      return { ...state, medicines: [...state.medicines, action.medicine] };
    case 'update':
      return {
        ...state,
        medicines: state.medicines.map((m) => (m.id === action.medicine.id ? action.medicine : m)),
      };
    case 'remove':
      return { ...state, medicines: state.medicines.filter((m) => m.id !== action.id) };
    case 'restore': {
      if (state.medicines.some((m) => m.id === action.medicine.id)) return state;
      const medicines = [...state.medicines];
      medicines.splice(Math.min(action.index, medicines.length), 0, action.medicine);
      return { ...state, medicines };
    }
    case 'move':
      return { ...state, medicines: move(state.medicines, action.from, action.to) };
    case 'setPatientName':
      return { ...state, patientName: action.name };
    case 'toggleDose': {
      const popped = state.tracker.popped.includes(action.key)
        ? state.tracker.popped.filter((key) => key !== action.key)
        : [...state.tracker.popped, action.key];
      return { ...state, tracker: { ...state.tracker, popped } };
    }
    case 'resetTracker':
      return { ...state, tracker: { start: action.start, popped: [] } };
    case 'replace':
      return action.state;
  }
}
