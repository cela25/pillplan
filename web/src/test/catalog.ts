import { createCatalog } from '@/features/catalog';
import type { CatalogData } from '@/features/catalog';
import data from '@/data/catalog.json';

/** The real generated catalog, for tests. */
export const testCatalog = createCatalog(data as CatalogData);
