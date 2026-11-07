import type { Catalog, CatalogData } from '../model';

export const SUPPORTED_VERSION = 1;

export function createCatalog(data: CatalogData): Catalog {
  if (data.version !== SUPPORTED_VERSION) {
    throw new Error(`Unsupported catalog version ${data.version}`);
  }
  return {
    ...data,
    drugById: new Map(data.drugs.map((drug) => [drug.id, drug])),
    ingredientById: new Map(data.ingredients.map((item) => [item.id, item])),
    warningById: new Map(data.warnings.map((warning) => [warning.id, warning])),
  };
}

/** The catalog is a separate chunk, so the first paint does not wait for it. */
export async function loadCatalog(): Promise<Catalog> {
  const module = await import('@/data/catalog.json');
  // Safe cast: the Python build validates this file against the same shape.
  return createCatalog(module.default as CatalogData);
}
