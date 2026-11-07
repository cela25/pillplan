import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react';
import { planReducer, type PlanAction } from '../logic/reducer';
import type { PlanState } from '../model';

interface PlanContextValue {
  plan: PlanState;
  dispatch: Dispatch<PlanAction>;
}

const PlanContext = createContext<PlanContextValue | null>(null);

export function PlanProvider({ initial, children }: { initial: PlanState; children: ReactNode }) {
  const [plan, dispatch] = useReducer(planReducer, initial);
  const value = useMemo(() => ({ plan, dispatch }), [plan]);
  return <PlanContext value={value}>{children}</PlanContext>;
}

export function usePlan(): PlanContextValue {
  const value = useContext(PlanContext);
  if (!value) throw new Error('usePlan must be used inside PlanProvider');
  return value;
}
