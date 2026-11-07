import { describe, expect, it } from 'vitest';
import type { Medicine } from '../model';
import { customMedicine } from './fromDrug';
import { emptyPlan, planReducer } from './reducer';

const med = (id: string): Medicine => customMedicine(id.toUpperCase(), id);
const ids = (state: { medicines: Medicine[] }) => state.medicines.map((m) => m.id);
const withThree = () =>
  ['a', 'b', 'c'].reduce(
    (state, id) => planReducer(state, { type: 'add', medicine: med(id) }),
    emptyPlan('2026-11-02'),
  );

describe('planReducer', () => {
  it('adds medicines in order', () => {
    expect(ids(withThree())).toEqual(['a', 'b', 'c']);
  });

  it('updates one medicine by id', () => {
    const next = planReducer(withThree(), { type: 'update', medicine: { ...med('b'), amount: 2 } });
    expect(next.medicines[1]?.amount).toBe(2);
  });

  it('removes and restores at the same position', () => {
    const removed = planReducer(withThree(), { type: 'remove', id: 'b' });
    expect(ids(removed)).toEqual(['a', 'c']);
    const restored = planReducer(removed, { type: 'restore', medicine: med('b'), index: 1 });
    expect(ids(restored)).toEqual(['a', 'b', 'c']);
  });

  it('does not restore a medicine twice', () => {
    const state = withThree();
    expect(planReducer(state, { type: 'restore', medicine: med('a'), index: 0 })).toBe(state);
  });

  it('moves a medicine', () => {
    expect(ids(planReducer(withThree(), { type: 'move', from: 0, to: 2 }))).toEqual([
      'b',
      'c',
      'a',
    ]);
    expect(ids(planReducer(withThree(), { type: 'move', from: 2, to: 0 }))).toEqual([
      'c',
      'a',
      'b',
    ]);
  });

  it('toggles tracker bubbles on and off', () => {
    const on = planReducer(withThree(), { type: 'toggleDose', key: 'd0-morning' });
    expect(on.tracker.popped).toEqual(['d0-morning']);
    const off = planReducer(on, { type: 'toggleDose', key: 'd0-morning' });
    expect(off.tracker.popped).toEqual([]);
  });

  it('starts a new tracker week', () => {
    const on = planReducer(withThree(), { type: 'toggleDose', key: 'd1-noon' });
    const reset = planReducer(on, { type: 'resetTracker', start: '2026-11-09' });
    expect(reset.tracker).toEqual({ start: '2026-11-09', popped: [] });
  });

  it('does not mutate the previous state', () => {
    const state = withThree();
    const snapshot = structuredClone(state);
    planReducer(state, { type: 'move', from: 0, to: 2 });
    planReducer(state, { type: 'remove', id: 'a' });
    expect(state).toEqual(snapshot);
  });
});
