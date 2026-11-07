import {
  DAY_PART_CLOCK,
  DAY_PARTS,
  DEFAULT_FIRST_DOSE,
  intervalFor,
  intervalFromDayParts,
  type DayPart,
  type DoseForm,
  type FoodRule,
  type Interval,
} from '@/shared/domain/time';

/**
 * Reads a prescription signa (Latin or Indonesian) such as "S 3 dd 1 tab p.c.",
 * "2x1 sesudah makan", "1 dd 1 h.s." or "prn 1 tab". Anything it cannot read is
 * returned in `unknown`, so the apoteker always sees what was not understood.
 *
 * Doses are spread evenly: "3 dd 1" is every 8 hours. Day words such as "malam" or "h.s."
 * only set when the first dose is taken.
 */
export interface SignaResult {
  /** Hours between doses and the first dose, or null when the signa did not say. */
  interval: Interval | null;
  /** Doses per day, or null when not given. */
  count: number | null;
  amount: number | null;
  form: DoseForm | null;
  food: FoodRule | null;
  prn: boolean;
  maxPerDay: number | null;
  unknown: string[];
}

const ROMAN: Record<string, number> = { i: 1, ii: 2, iii: 3, iv: 4 };
const FRACTION: Record<string, number> = { '½': 0.5, '¼': 0.25, '¾': 0.75 };

const AMOUNT = String.raw`(\d+(?:[.,]\d+)?(?:\/\d+)?|[½¼¾]|iv|i{1,3}|s{1,2})`;
const UNIT = String.raw`(tab(?:let)?s?|caps?(?:ul|ule)?s?|kaps(?:ul)?|cth|c|gtt|tetes|ml|puffs?|semprot)`;

const FILLER = new Set([
  'x',
  'dd',
  'kali',
  'sehari',
  'hari',
  'per',
  'a',
  'day',
  'daily',
  'dan',
  'and',
  'et',
  'tiap',
  'setiap',
  'jam',
  'minum',
  'take',
  'obat',
  'diminum',
  'times',
  'time',
  'once',
  'twice',
]);

const PATTERNS = {
  prn: /\b(?:p\.?\s?r\.?\s?n\.?|s\.?\s?o\.?\s?s\.?|bila perlu|kalau perlu|jika perlu|k\/p|as needed|when needed)(?=\s|$|[.,])/g,
  before: /\b(?:a\.?\s?c\.?|sebelum makan|before (?:food|meals?))(?=\s|$|[.,])/g,
  after:
    /\b(?:p\.?\s?c\.?|d\.?\s?c\.?|sesudah makan|setelah makan|saat makan|after (?:food|meals?)|with (?:food|meals?))(?=\s|$|[.,])/g,
  bedtime: /\b(?:h\.?\s?s\.?|hora somni|sebelum tidur|at bedtime|bedtime)(?=\s|$|[.,])/g,
  morning: /\b(?:o\.?\s?m\.?|omni mane|pagi(?: hari)?|in the morning|morning)(?=\s|$|[.,])/g,
  evening: /\b(?:o\.?\s?n\.?|omni nocte|malam(?: hari)?|in the evening|evening)(?=\s|$|[.,])/g,
  noon: /\b(?:siang(?: hari)?|noon|midday)(?=\s|$|[.,])/g,
  latinDaily:
    /\b(?:(b)\.?\s?i\.?\s?d|(t)\.?\s?i\.?\s?d|(q)\.?\s?i\.?\s?d|(o)\.?\s?d|(q)\.?\s?d)\.?(?=\s|$|[.,])/,
  interval: /\b(?:tiap|setiap|every)\s*(\d+)\s*(?:jam|hours?)\b|\bq\.?\s?(\d+)\s?h\b/,
  frequency: new RegExp(
    String.raw`\b(\d+)\s*(?:x|dd|d\.d\.|kali)\s*(?:sehari|per hari|a day|daily)?\s*` +
      `(?:${AMOUNT}(?=\\s|$|[a-z.,]))?`,
  ),
  amountWithUnit: new RegExp(String.raw`(?:^|\s)${AMOUNT}\s*${UNIT}\b\.?`),
  unitAlone: new RegExp(String.raw`(?:^|\s)${UNIT}\b\.?`),
};

function toNumber(token: string): number | null {
  const lower = token.toLowerCase();
  if (lower in FRACTION) return FRACTION[lower] ?? null;
  if (lower in ROMAN) return ROMAN[lower] ?? null;
  if (lower === 's' || lower === 'ss') return 0.5;
  if (lower.includes('/')) {
    const [top, bottom] = lower.split('/').map(Number);
    return top && bottom ? top / bottom : null;
  }
  const value = Number(lower.replace(',', '.'));
  return Number.isFinite(value) && value > 0 ? value : null;
}

function unitToForm(unit: string): { form: DoseForm; perUnitMl?: number } {
  if (unit.startsWith('tab')) return { form: 'tablet' };
  if (unit.startsWith('cap') || unit.startsWith('kap')) return { form: 'capsule' };
  if (unit === 'cth') return { form: 'mL', perUnitMl: 5 };
  if (unit === 'c') return { form: 'mL', perUnitMl: 15 };
  if (unit === 'gtt' || unit === 'tetes') return { form: 'drop' };
  if (unit.startsWith('puff') || unit === 'semprot') return { form: 'puff' };
  return { form: 'mL' };
}

export function parseSigna(text: string, defaultTimes: readonly DayPart[] = []): SignaResult {
  let rest = ` ${text.toLowerCase().replace(/\s+/g, ' ').trim()} `;
  rest = rest.replace(/^\s*s\.?\s+/, ' ');
  const take = (pattern: RegExp): boolean => {
    const before = rest;
    rest = rest.replace(pattern, ' ');
    return rest !== before;
  };

  const prn = take(PATTERNS.prn);
  const food: FoodRule | null = take(PATTERNS.before)
    ? 'before'
    : take(PATTERNS.after)
      ? 'with_after'
      : null;
  const named = new Set<DayPart>();
  if (take(PATTERNS.bedtime)) named.add('bedtime');
  if (take(PATTERNS.morning)) named.add('morning');
  if (take(PATTERNS.evening)) named.add('evening');
  if (take(PATTERNS.noon)) named.add('noon');

  let count: number | null = null;
  let amount: number | null = null;
  let form: DoseForm | null = null;

  const latin = PATTERNS.latinDaily.exec(rest);
  if (latin) {
    const letter = latin.slice(1).find(Boolean);
    count =
      letter === 'b'
        ? 2
        : letter === 't'
          ? 3
          : latin[0].startsWith('q') && latin[0].includes('i')
            ? 4
            : 1;
    rest = rest.replace(PATTERNS.latinDaily, ' ');
  }

  const hoursMatch = PATTERNS.interval.exec(rest);
  if (hoursMatch) {
    const hours = Number(hoursMatch[1] ?? hoursMatch[2]);
    if (hours > 0 && 24 % hours === 0) count = 24 / hours;
    rest = rest.replace(PATTERNS.interval, ' ');
  }

  const frequency = PATTERNS.frequency.exec(rest);
  if (frequency) {
    count = Number(frequency[1]);
    if (frequency[2]) amount = toNumber(frequency[2]);
    rest = rest.replace(PATTERNS.frequency, ' ');
  }

  const withUnit = PATTERNS.amountWithUnit.exec(rest);
  if (withUnit?.[1] && withUnit[2]) {
    const value = toNumber(withUnit[1]);
    const unit = unitToForm(withUnit[2]);
    form = unit.form;
    if (value !== null) amount = unit.perUnitMl ? value * unit.perUnitMl : value;
    rest = rest.replace(PATTERNS.amountWithUnit, ' ');
  } else {
    const unitAlone = PATTERNS.unitAlone.exec(rest);
    if (unitAlone?.[1]) {
      const unit = unitToForm(unitAlone[1]);
      form = unit.form;
      if (unit.perUnitMl && amount !== null) amount *= unit.perUnitMl;
      rest = rest.replace(PATTERNS.unitAlone, ' ');
    }
  }

  const unknown = rest
    .split(/[\s,]+/)
    .map((token) => token.replace(/^[.]+|[.]+$/g, ''))
    .filter((token) => token && !FILLER.has(token));

  let interval: Interval | null = null;
  let maxPerDay: number | null = null;
  const parts = DAY_PARTS.filter((part) => named.has(part));
  if (prn) {
    maxPerDay = count;
  } else if (count === null && parts.length > 0) {
    interval = intervalFromDayParts(parts);
  } else if (count !== null) {
    const every = intervalFor(count);
    const fromDefault = intervalFromDayParts(defaultTimes);
    const first = parts[0];
    if (!every) unknown.push(`${count} x`);
    else if (first) interval = { every, firstDose: DAY_PART_CLOCK[first] };
    else if (fromDefault?.every === every) interval = fromDefault;
    else interval = { every, firstDose: DEFAULT_FIRST_DOSE };
  }

  return { interval, count, amount, form, food, prn, maxPerDay, unknown };
}

/** True when the signa gave nothing usable yet, for example while the user is still typing. */
export function isEmptySigna(result: SignaResult): boolean {
  return (
    result.interval === null &&
    result.amount === null &&
    result.food === null &&
    !result.prn &&
    result.form === null
  );
}
