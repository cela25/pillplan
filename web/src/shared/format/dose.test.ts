import { describe, expect, it } from 'vitest';
import { en, id } from '@/shared/i18n';
import { formatAmount, formatDose, formatNumber, formatStrength } from './dose';

describe('formatNumber (ISMP rules)', () => {
  it('keeps a leading zero and drops trailing zeros', () => {
    expect(formatNumber(0.5)).toBe('0.5');
    expect(formatNumber(1)).toBe('1');
    expect(formatNumber(2.5)).toBe('2.5');
  });

  it('groups thousands', () => {
    expect(formatNumber(4000)).toBe('4,000');
  });

  it('uses Indonesian decimal and grouping marks', () => {
    expect(formatNumber(0.5, 'id-ID')).toBe('0,5');
    expect(formatNumber(4000, 'id-ID')).toBe('4.000');
  });
});

describe('formatAmount', () => {
  it('shows halves of tablets as fractions', () => {
    expect(formatAmount(0.5, 'tablet')).toBe('½');
    expect(formatAmount(1.5, 'tablet')).toBe('1½');
    expect(formatAmount(2, 'tablet')).toBe('2');
  });

  it('keeps decimals for liquids', () => {
    expect(formatAmount(2.5, 'mL')).toBe('2.5');
    expect(formatAmount(2.5, 'mL', 'id-ID')).toBe('2,5');
  });
});

describe('formatDose', () => {
  it('uses singular and plural form names in English', () => {
    expect(formatDose(1, 'tablet', en)).toBe('1 tablet');
    expect(formatDose(0.5, 'tablet', en)).toBe('½ tablet');
    expect(formatDose(2, 'capsule', en)).toBe('2 capsules');
    expect(formatDose(5, 'mL', en)).toBe('5 mL');
  });

  it('has no plural in Indonesian', () => {
    expect(formatDose(2, 'capsule', id)).toBe('2 kapsul');
  });
});

describe('formatStrength', () => {
  it('joins combination products with a plus', () => {
    expect(formatStrength([500, 65], 'mg')).toBe('500 mg + 65 mg');
    expect(formatStrength([0.4], 'mg')).toBe('0.4 mg');
    expect(formatStrength([0.4], 'mg', 'id-ID')).toBe('0,4 mg');
    expect(formatStrength([88], 'mcg')).toBe('88 mcg');
  });
});
