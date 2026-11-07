import * as v from 'valibot';
import type { PlanState } from '@/features/medicines';
import {
  DAY_PARTS,
  DEFAULT_FIRST_DOSE,
  DOSE_FORMS,
  DOSE_UNITS,
  FOOD_RULES,
  INTERVALS,
  intervalFromDayParts,
  isClockTime,
  PREPARATIONS,
  type ClockTime,
  type DayPart,
  type DoseForm,
  type Preparation,
} from '@/shared/domain/time';

/** Version 2 spreads doses evenly (every N hours) and stores the sediaan instead of a pill look. */
export const FILE_VERSION = 2;

const text = (max: number) => v.pipe(v.string(), v.maxLength(max));
const clock = v.custom<ClockTime>((value) => typeof value === 'string' && isClockTime(value));

const common = {
  id: v.pipe(v.string(), v.regex(/^[A-Za-z0-9_-]{1,64}$/)),
  drugId: v.nullable(v.pipe(v.string(), v.regex(/^[a-z][a-z0-9_]*$/))),
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
  strength: text(80),
  ingredientAmounts: v.pipe(v.array(v.pipe(v.number(), v.minValue(0))), v.maxLength(10)),
  unit: v.nullable(v.picklist(DOSE_UNITS)),
  amount: v.pipe(v.number(), v.minValue(0.25), v.maxValue(100)),
  form: v.picklist(DOSE_FORMS),
  prn: v.boolean(),
  prnMaxPerDay: v.nullable(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(24))),
  food: v.picklist(FOOD_RULES),
  warnings: v.pipe(v.array(text(40)), v.maxLength(20)),
  purpose: text(120),
  advice: text(400),
  signa: v.optional(text(120)),
};

const MedicineSchema = v.object({
  ...common,
  every: v.picklist(INTERVALS),
  firstDose: clock,
  preparation: v.picklist(PREPARATIONS),
});

const Tracker = v.object({
  start: v.pipe(v.string(), v.isoDate()),
  popped: v.pipe(v.array(v.pipe(v.string(), v.regex(/^d[0-6]-\d{4}$/))), v.maxLength(7 * 24)),
});

export const PlanSchema = v.object({
  patientName: text(120),
  medicines: v.pipe(v.array(MedicineSchema), v.maxLength(50)),
  tracker: Tracker,
});

/** Version 1: morning, noon, evening and bedtime, plus a pill shape and color. */
const LegacyMedicineSchema = v.object({
  ...common,
  times: v.pipe(v.array(v.picklist(DAY_PARTS)), v.maxLength(4)),
  pill: v.object({ shape: v.picklist(['round', 'oval', 'capsule']) }),
});

const LegacyPlanSchema = v.object({
  patientName: text(120),
  medicines: v.pipe(v.array(LegacyMedicineSchema), v.maxLength(50)),
  tracker: v.object({ start: v.pipe(v.string(), v.isoDate()) }),
});

function legacyPreparation(form: DoseForm, shape: string): Preparation {
  if (form === 'mL') return 'syrup';
  return shape === 'capsule' || form === 'capsule' ? 'capsule' : 'tablet';
}

/**
 * Old plans keep their dose count: "morning and evening" becomes every 12 hours from 07:00.
 * Ticked tracker bubbles cannot be mapped to the new times, so the week starts clean.
 */
function migrateV1(plan: v.InferOutput<typeof LegacyPlanSchema>): PlanState {
  return {
    patientName: plan.patientName,
    tracker: { start: plan.tracker.start, popped: [] },
    medicines: plan.medicines.map(({ times, pill, ...medicine }) => ({
      ...medicine,
      ...(intervalFromDayParts(times as DayPart[]) ?? {
        every: 24,
        firstDose: DEFAULT_FIRST_DOSE,
      }),
      preparation: legacyPreparation(medicine.form, pill.shape),
    })),
  };
}

/** The same envelope is used for browser storage and for exported files. */
export const SavedPlanSchema = v.object({
  app: v.literal('pillplan'),
  version: v.literal(FILE_VERSION),
  savedAt: v.string(),
  plan: PlanSchema,
});

const LegacySavedPlanSchema = v.object({
  app: v.literal('pillplan'),
  version: v.literal(1),
  savedAt: v.string(),
  plan: LegacyPlanSchema,
});

export function parsePlan(value: unknown): PlanState | null {
  const current = v.safeParse(SavedPlanSchema, value);
  if (current.success) return current.output.plan;
  const legacy = v.safeParse(LegacySavedPlanSchema, value);
  return legacy.success ? migrateV1(legacy.output.plan) : null;
}

export function serializePlan(plan: PlanState, now: Date): string {
  return JSON.stringify({
    app: 'pillplan',
    version: FILE_VERSION,
    savedAt: now.toISOString(),
    plan,
  });
}
