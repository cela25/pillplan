import type {
  ClockTime,
  DayPart,
  DoseForm,
  DoseUnit,
  FoodRule,
  IntervalHours,
  Preparation,
} from '@/shared/domain/time';
import type { LocalText } from '@/shared/i18n';
import type { StickerTone } from '@/shared/ui/Sticker';

/** Shapes of the generated catalog.json (validated by the Python tools at build time). */
export interface WarningLabel {
  id: string;
  short: LocalText;
  text: LocalText;
  icon: string;
  sticker: StickerTone;
}

export interface Ingredient {
  id: string;
  name: string;
  usualMaxDaily: number | null;
  unit: DoseUnit;
  source: string;
}

export interface Drug {
  id: string;
  name: string;
  /** Other spellings people search for, such as Indonesian generic names. */
  aliases: string[];
  brands: string[];
  ingredients: string[];
  drugClass: LocalText;
  area: LocalText;
  form: 'tablet' | 'capsule';
  strengths: number[][];
  unit: DoseUnit;
  /** Day parts from the label; turned into an even interval when the drug is added. */
  defaultTimes: DayPart[];
  defaultPrn: boolean;
  bestTimes: DayPart[];
  food: FoodRule;
  warnings: string[];
  advice: LocalText;
  source: string;
}

export interface CatalogData {
  version: number;
  warnings: WarningLabel[];
  ingredients: Ingredient[];
  drugs: Drug[];
}

export interface Catalog extends CatalogData {
  drugById: ReadonlyMap<string, Drug>;
  ingredientById: ReadonlyMap<string, Ingredient>;
  warningById: ReadonlyMap<string, WarningLabel>;
}

/** A drug the apoteker typed in, remembered on this device. Never safety checked. */
export interface MyDrug {
  id: string;
  name: string;
  strength: string;
  form: DoseForm;
  every: IntervalHours;
  firstDose: ClockTime;
  preparation: Preparation;
  prn: boolean;
  prnMaxPerDay: number | null;
  food: FoodRule;
  warnings: string[];
  advice: string;
}
