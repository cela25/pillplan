import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { loadCatalog } from '../logic/catalog';
import { loadMyDrugs, saveMyDrugs, upsertMyDrug } from '../logic/myDrugs';
import type { Catalog, MyDrug } from '../model';

interface CatalogValue {
  /** The drug list, or null while it is still loading. */
  catalog: Catalog | null;
  myDrugs: MyDrug[];
  rememberDrug: (drug: MyDrug) => void;
  forgetDrug: (id: string) => void;
}

const CatalogContext = createContext<CatalogValue | null>(null);

interface CatalogProviderProps {
  children: ReactNode;
  storage: Storage | null;
  /** Tests pass the catalog in directly instead of loading the chunk. */
  catalog?: Catalog | undefined;
}

export function CatalogProvider({ children, storage, catalog: given }: CatalogProviderProps) {
  const [loaded, setLoaded] = useState<Catalog | null>(null);
  const [myDrugs, setMyDrugs] = useState(() => loadMyDrugs(storage));

  useEffect(() => {
    if (given) return;
    let active = true;
    void loadCatalog().then((catalog) => {
      if (active) setLoaded(catalog);
    });
    return () => {
      active = false;
    };
  }, [given]);

  const update = useCallback(
    (change: (drugs: MyDrug[]) => MyDrug[]) =>
      setMyDrugs((drugs) => {
        const next = change(drugs);
        saveMyDrugs(storage, next);
        return next;
      }),
    [storage],
  );

  const value = useMemo<CatalogValue>(
    () => ({
      catalog: given ?? loaded,
      myDrugs,
      rememberDrug: (drug) => update((drugs) => upsertMyDrug(drugs, drug)),
      forgetDrug: (id) => update((drugs) => drugs.filter((drug) => drug.id !== id)),
    }),
    [given, loaded, myDrugs, update],
  );

  return <CatalogContext value={value}>{children}</CatalogContext>;
}

function useCatalogValue(): CatalogValue {
  const value = useContext(CatalogContext);
  if (!value) throw new Error('Catalog hooks must be used inside CatalogProvider');
  return value;
}

/** The catalog, or null while it is still loading. */
export function useCatalog(): Catalog | null {
  return useCatalogValue().catalog;
}

/** The apoteker's own drugs and how to change them. */
export function useMyDrugs() {
  const { myDrugs, rememberDrug, forgetDrug } = useCatalogValue();
  return { myDrugs, rememberDrug, forgetDrug };
}
