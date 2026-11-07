import { useRef, useState, type RefObject } from 'react';
import { DrugSearch, useMyDrugs } from '@/features/catalog';
import { useI18n } from '@/shared/i18n';
import { newId } from '@/shared/id';
import { Button } from '@/shared/ui/Button';
import { useToast } from '@/shared/ui/Toast';
import { withViewTransition } from '@/shared/viewTransition';
import { customMedicine, medicineFromDrug, medicineFromMyDrug, toMyDrug } from '../logic/fromDrug';
import type { Medicine } from '../model';
import { MedicineForm } from './MedicineForm';
import { MedicineList } from './MedicineList';
import { usePlan } from './PlanProvider';
import styles from './MedicinePanel.module.css';

interface Draft {
  medicine: Medicine;
  mode: 'add' | 'edit';
}

interface MedicinePanelProps {
  searchRef?: RefObject<HTMLInputElement | null>;
}

/** Search, the add or edit form, and the sortable list of medicines. */
export function MedicinePanel({ searchRef }: MedicinePanelProps) {
  const { plan, dispatch } = usePlan();
  const { rememberDrug } = useMyDrugs();
  const { t, lang } = useI18n();
  const toast = useToast();
  const ownRef = useRef<HTMLInputElement>(null);
  const inputRef = searchRef ?? ownRef;
  const [draft, setDraft] = useState<Draft | null>(null);

  const close = () => {
    setDraft(null);
    window.setTimeout(() => inputRef.current?.focus());
  };

  const submit = (medicine: Medicine, remember: boolean) => {
    const mode = draft?.mode;
    withViewTransition(() => dispatch({ type: mode === 'edit' ? 'update' : 'add', medicine }));
    if (mode === 'add' && medicine.drugId === null && remember) {
      rememberDrug(toMyDrug(medicine, newId()));
      toast(t.myDrugs.saved(medicine.name));
    } else if (mode === 'add') {
      toast(t.list.added(medicine.name));
    }
    close();
  };

  const remove = (medicine: Medicine) => {
    const index = plan.medicines.findIndex((m) => m.id === medicine.id);
    withViewTransition(() => dispatch({ type: 'remove', id: medicine.id }));
    if (draft?.medicine.id === medicine.id) setDraft(null);
    toast(t.list.removed(medicine.name), {
      label: t.list.undo,
      run: () => withViewTransition(() => dispatch({ type: 'restore', medicine, index })),
    });
  };

  return (
    <div className={styles.panel}>
      <DrugSearch
        inputRef={inputRef}
        onPick={(drug) =>
          setDraft({ medicine: medicineFromDrug(drug, 0, newId(), lang), mode: 'add' })
        }
        onPickMine={(drug) =>
          setDraft({ medicine: medicineFromMyDrug(drug, newId()), mode: 'add' })
        }
        onCustom={(name) => setDraft({ medicine: customMedicine(name, newId()), mode: 'add' })}
      />
      {!draft && (
        <Button
          variant="quiet"
          icon="edit"
          className={styles.own}
          onClick={() => setDraft({ medicine: customMedicine('', newId()), mode: 'add' })}
        >
          {t.myDrugs.typeOwn}
        </Button>
      )}
      {draft && (
        <MedicineForm
          key={draft.medicine.id}
          initial={draft.medicine}
          mode={draft.mode}
          onSubmit={submit}
          onCancel={close}
        />
      )}
      <MedicineList
        medicines={plan.medicines}
        onMove={(from, to) => dispatch({ type: 'move', from, to })}
        onEdit={(medicine) => setDraft({ medicine, mode: 'edit' })}
        onRemove={remove}
      />
    </div>
  );
}
