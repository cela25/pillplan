import type { Drug, MyDrug } from '../model';

export type SearchHit =
  | { kind: 'drug'; drug: Drug; /** Brand or alias that matched. */ matched: string | null }
  | { kind: 'mine'; drug: MyDrug; matched: null };

export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

function words(text: string): string[] {
  return normalize(text)
    .split(/[\s()+,]+/)
    .filter(Boolean);
}

function scoreName(name: string, query: string): number {
  if (normalize(name).startsWith(query)) return 4;
  if (words(name).some((word) => word.startsWith(query))) return 3;
  if (normalize(name).includes(query)) return 1;
  return 0;
}

function scoreDrug(drug: Drug, query: string): { score: number; matched: string | null } {
  const byName = scoreName(drug.name, query);
  if (byName >= 3) return { score: byName, matched: null };
  const other = [...drug.aliases, ...drug.brands].find((item) => normalize(item).startsWith(query));
  if (other) return { score: 2, matched: other };
  return { score: byName, matched: null };
}

/**
 * Generic name prefix first, then brands and Indonesian aliases, then anywhere in the name.
 * The apoteker's own drugs are listed first when they match.
 */
export function searchDrugs(
  drugs: readonly Drug[],
  query: string,
  limit = 8,
  mine: readonly MyDrug[] = [],
): SearchHit[] {
  const needle = normalize(query);
  if (!needle) return [];
  const own: SearchHit[] = mine
    .filter((drug) => scoreName(drug.name, needle) > 0)
    .map((drug) => ({ kind: 'mine', drug, matched: null }));
  const listed = drugs
    .map((drug) => ({ drug, ...scoreDrug(drug, needle) }))
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score || a.drug.name.localeCompare(b.drug.name))
    .map(({ drug, matched }): SearchHit => ({ kind: 'drug', drug, matched }));
  return [...own, ...listed].slice(0, limit);
}
